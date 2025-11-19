import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../Models/user.Model.js";
import cloudinary from "../Config/Cloudinary.js";
import { checkAuth } from "../Middleware/auth.middleware.js";
import nodemailer from "nodemailer";
import videoModel from "../Models/video.Model.js";

const router = express.Router();

async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    text: `Your verification code is: ${code}`,
  });
}

router.post("/signup", async (req, res) => {
  try {
    console.log("Request received");

    // 1. Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // 2. Upload Logo to Cloudinary
    const uploadImage = await cloudinary.uploader.upload(
      req.files.logoUrl.tempFilePath
    );

    // 3. Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // 4. Create New User
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      email: req.body.email,
      password: hashedPassword,
      ChannelName: req.body.ChannelName,
      phone: req.body.phone,
      logoUrl: uploadImage.secure_url,
      logoId: uploadImage.public_id,
      isVerified: false, // user not verified yet ❌
      verificationCode: verificationCode, // save code in DB
    });

    let user = await newUser.save();

    // 5. Send verification email
    await sendVerificationEmail(req.body.email, verificationCode);

    // 6. Response
    res.status(201).json({
      message:
        "Signup successful. Please verify your email to activate your account.",
      userId: user._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Something went wrong",
      message: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {
      return res.status(404).send({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        _id: existingUser.id,
        ChannelName: existingUser.ChannelName,
        email: existingUser.email,
        phone: existingUser.phone,
        logoId: existingUser.logoId,
      },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "10d" }
    );

    res.status(200).json({
      _id: existingUser.id,
      ChannelName: existingUser.ChannelName,
      email: existingUser.email,
      phone: existingUser.phone,
      logoId: existingUser.logoId,
      logoUrl: existingUser.logoUrl,
      token: token,
      subscriber: existingUser.subscriber,
      subscribedChannels: existingUser.subscribedChannels,
      role: existingUser.role || 'user',
    });
  } catch (error) {
    console.error("Login Error", error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});

router.put("/update-profile", checkAuth, async (req, res) => {
  try {
    const { ChannelName, phone } = req.body;
    let updatedData = { ChannelName, phone };

    if (req.files && req.files.logoUrl) {
      const uploadedImage = await cloudinary.uploader.upload(
        req.files.logoUrl.tempFilePath
      );
      updatedData.logoUrl = uploadedImage.secure_url;
      updatedData.logoId = uploadedImage.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedData,
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Profile updated Successfully", updatedUser });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      error: "Something went wrong",
      message: error.message,
      stack: error.stack,
    });
  }
});

router.post("/subscribe", checkAuth, async (req, res) => {
  try {
    const { ChannelId } = req.body; //userId == currentUser & channelId ==user to subscribe (channel);

    if (req.user._id == ChannelId) {
      return res.status(400).json({ error: "You Can't subscribe to yourself" });
    }

    const currentUser = await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { subscribedChannels: ChannelId },
    });

    const subscribedUser = await User.findByIdAndUpdate(ChannelId, {
      $inc: { subscriber: 1 },
    });
    res.status(200).json({
      message: "Subscribed successfully",
      data: {
        currentUser,
        subscribedUser,
      },
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});

/* ---------------------------- EMAIL SENDER ---------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------------------------- GENERATE OTP ---------------------------- */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* -------------------------- FORGOT PASSWORD -------------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // expires in 10 mins
    await user.save();

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
      <h2>Your OTP Code</h2>
      <p>Use this code to reset your password. It is valid for 10 minutes:</p>
      <h1 style="letter-spacing: 3px;">${otp}</h1>
      `,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* --------------------------- RESET PASSWORD --------------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const hashedPass = await bcrypt.hash(newPassword, 10);

    user.password = hashedPass;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});
/* --------------------------- VERIFY EMAIL --------------------------- */
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode != code)
      return res.status(400).json({ message: "Invalid verification code" });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});

/* --------------------------- GET USER PROFILE --------------------------- */
router.get("/profile", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId).select('-password -otp -otpExpires -verificationCode');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's videos with stats
    const videos = await videoModel.find({ user_id: userId })
      .select('title thumbnailUrl createdAt viewedBy likedBy disLikedBy')
      .sort({ createdAt: -1 });

    // Calculate video statistics
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + (video.viewedBy?.length || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likedBy?.length || 0), 0);

    // Get user's profile data
    const profileData = {
      _id: user._id,
      ChannelName: user.ChannelName,
      email: user.email,
      phone: user.phone,
      logoUrl: user.logoUrl,
      subscriber: user.subscriber || 0,
      subscribedChannels: user.subscribedChannels || [],
      createdAt: user.createdAt,
      stats: {
        totalVideos,
        totalViews,
        totalLikes
      },
      recentVideos: videos.slice(0, 6).map(v => ({
        _id: v._id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        views: v.viewedBy?.length || 0,
        likes: v.likedBy?.length || 0,
        createdAt: v.createdAt
      }))
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({ 
      error: "Something went wrong", 
      message: error.message 
    });
  }
});

export default router;
