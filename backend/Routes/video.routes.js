import express from 'express';
import mongoose from 'mongoose';

import User from '../Models/user.Model.js';
import cloudinary from '../Config/Cloudinary.js';
import videoModel from '../Models/video.Model.js';
import { checkAuth } from '../Middleware/auth.middleware.js';

const router = express.Router();

//creating upload video endpoint
router.post("/upload", checkAuth, async (req, res) => {
    try {
        const {title, description, category, tags} = req.body;
        if(!req.files || !req.files.video || !req.files.thumbnail) {
            return res.status(400).json({error: "Video & thumbnail are required"});
        }

        const videoUpload = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: "video",
            folder: "videos",
        });

        const thumbnailUpload = await cloudinary.uploader.upload(
            req.files.thumbnail.tempFilePath,
            {
                folder: "thumbnails",
            }
        );

        const newVideo = new videoModel({
            _id: new mongoose.Types.ObjectId(),
            title,
            description,
            user_id: req.user._id,
            channel: req.user._id,
            videoUrl: videoUpload.secure_url,
            thumbnailUrl: thumbnailUpload.secure_url,
            thumbnailId: thumbnailUpload.public_id,
            category: category || 'General',
            tags: tags ? tags.split(",").map(t => t.trim()) : [],
            status: 'approved', // Videos are auto-approved
        });

        await newVideo.save();

        const videoWithUser = await videoModel.findById(newVideo._id).populate('user_id', 'ChannelName logoUrl subscriber');

        res.status(201).json({message: "Video uploaded successfully", video: videoWithUser});

    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
});

//update video endpoint (no video change only metadata & thumbnail is change)
router.put("/update/:id", checkAuth, async (req, res) => {
    try {
        const {title, description, category, tags} = req.body;
        const videoId = req.params.id;

        //find video by id
        let video = await videoModel.findById(videoId);
        if(!video) {
            return res.status(404).json({error: "Video not found"});
        }

        if(video.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({error: "Unauthorized"});
        }

        if(req.files && req.files.thumbnail) {
            await cloudinary.uploader.destroy(video.thumbnailId);

            const thumbnailUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
                folder: "thumbnails"
            })

            video.thumbnailUrl = thumbnailUpload.secure_url;
            video.thumbnailId = thumbnailUpload.public_id;
        }

        video.title = title || video.title;
        video.description = description || video.description;
        video.category = category || video.category;
        video.tags = tags ? tags.split(",").map(t => t.trim()) : video.tags;

        await video.save();

        const updatedVideo = await videoModel.findById(videoId).populate('user_id', 'ChannelName logoUrl subscriber');

        res.status(200).json({message: "Video updated successfully", video: updatedVideo})

    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//Delete video
router.delete("/delete/:id", checkAuth, async (req, res)=>{
    try {
        const videoId = req.params.id;
        const video = await videoModel.findById(videoId);

        if(!video) {
            return res.status(404).json({error: "Video not found"});
        }

        if(video.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({error: "Unauthorized"});
        }

        // Delete from cloudinary
        await cloudinary.uploader.destroy(video.thumbnailId);
        // Note: Video deletion from cloudinary might need special handling

        await videoModel.findByIdAndDelete(videoId);

        res.status(200).json({message: "Video deleted successfully"});
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//get all videos
router.get("/all", async (req, res) => {
    try {
        const videos = await videoModel.find()
            .populate('user_id', 'ChannelName logoUrl subscriber')
            .sort({ createdAt: -1 });
        
        // Map to include likes and dislikes arrays
        const videosWithLikes = videos.map(v => {
            const videoObj = v.toJSON();
            videoObj.likes = videoObj.likedBy || [];
            videoObj.dislikes = videoObj.disLikedBy || [];
            videoObj.views = videoObj.viewedBy?.length || 0;
            return videoObj;
        });

        res.status(200).json(videosWithLikes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//get my videos (users can see all their videos including pending/rejected)
router.get("/my-videoes", checkAuth, async(req, res) => {
    try {
        const videos = await videoModel.find({ user_id: req.user._id })
            .populate('user_id', 'ChannelName logoUrl subscriber')
            .sort({ createdAt: -1 });
        
        const videosWithLikes = videos.map(v => {
            const videoObj = v.toJSON();
            videoObj.likes = videoObj.likedBy || [];
            videoObj.dislikes = videoObj.disLikedBy || [];
            videoObj.views = videoObj.viewedBy?.length || 0;
            return videoObj;
        });

        res.status(200).json(videosWithLikes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
});

//like video
router.post("/like", checkAuth, async (req, res) => {
    try {
        const {videoId} = req.body;
        const userId = req.user._id;

        const video = await videoModel.findByIdAndUpdate(
            videoId,
            {
                $addToSet: {likedBy: userId}, // Add to likes
                $pull: {disLikedBy: userId}, // Remove from dislikes if previously disliked
            },
            {new: true}
        ).populate('user_id', 'ChannelName logoUrl subscriber');

        if(!video) {
            return res.status(404).json({error: "Video not found"});
        }

        const videoObj = video.toJSON();
        videoObj.likes = videoObj.likedBy || [];
        videoObj.dislikes = videoObj.disLikedBy || [];
        videoObj.views = videoObj.viewedBy?.length || 0;

        res.status(200).json({message: "Video liked successfully", video: videoObj});
    } catch (error) {
        console.error("Like Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//dislike video
router.post("/dislike", checkAuth, async (req, res) => {
    try {
        const {videoId} = req.body;
        const userId = req.user._id;

        const video = await videoModel.findByIdAndUpdate(
            videoId,
            {
                $addToSet: {disLikedBy: userId}, // Add to dislikes
                $pull: {likedBy: userId}, // Remove from likes if previously liked
            },
            {new: true}
        ).populate('user_id', 'ChannelName logoUrl subscriber');

        if(!video) {
            return res.status(404).json({error: "Video not found"});
        }

        const videoObj = video.toJSON();
        videoObj.likes = videoObj.likedBy || [];
        videoObj.dislikes = videoObj.disLikedBy || [];
        videoObj.views = videoObj.viewedBy?.length || 0;

        res.status(200).json({message: "Video disliked successfully", video: videoObj});
    } catch (error) {
        console.error("Dislike Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//get videos by tag
router.get("/tags/:tag", async (req, res) => {
    try {
        const tag = req.params.tag;
        const videos = await videoModel.find({tags: tag})
            .populate('user_id', 'ChannelName logoUrl subscriber')
            .sort({ createdAt: -1 });
        
        const videosWithLikes = videos.map(v => {
            const videoObj = v.toJSON();
            videoObj.likes = videoObj.likedBy || [];
            videoObj.dislikes = videoObj.disLikedBy || [];
            videoObj.views = videoObj.viewedBy?.length || 0;
            return videoObj;
        });

        res.status(200).json(videosWithLikes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//get videos by category
router.get("/category/:category", async (req, res) => {
    try {
        const category = req.params.category;
        const videos = await videoModel.find({category: category})
            .populate('user_id', 'ChannelName logoUrl subscriber')
            .sort({ createdAt: -1 });
        
        const videosWithLikes = videos.map(v => {
            const videoObj = v.toJSON();
            videoObj.likes = videoObj.likedBy || [];
            videoObj.dislikes = videoObj.disLikedBy || [];
            videoObj.views = videoObj.viewedBy?.length || 0;
            return videoObj;
        });

        res.status(200).json(videosWithLikes);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//search videos by query (tags, title, description, words, letters)
router.get("/search", async (req, res) => {
    try {
        const query = req.query.q || req.query.query || '';
        
        if (!query || query.trim() === '') {
            return res.status(400).json({error: "Search query is required"});
        }

        // Create case-insensitive regex pattern for searching
        const searchRegex = new RegExp(query.trim(), 'i');
        
        // Search in title, description, tags, and category
        // For tags array (array of strings), MongoDB will match if any element matches the regex
        const videos = await videoModel.find({
            $or: [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { tags: searchRegex },
                { category: { $regex: searchRegex } }
            ]
        })
        .populate('user_id', 'ChannelName logoUrl subscriber')
        .sort({ createdAt: -1 });
        
        const videosWithLikes = videos.map(v => {
            const videoObj = v.toJSON();
            videoObj.likes = videoObj.likedBy || [];
            videoObj.dislikes = videoObj.disLikedBy || [];
            videoObj.views = videoObj.viewedBy?.length || 0;
            return videoObj;
        });

        res.status(200).json(videosWithLikes);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
})

//get video by id - MUST be last to avoid conflicts with other routes
router.get("/:id", checkAuth, async (req, res) => {
    try {
        const videoId = req.params.id;
        const userId = req.user._id;

        //use findByIdAndUpdate to add the userid to the viewedBy array if not already present
        const video = await videoModel.findByIdAndUpdate(
            videoId,
            {
                $addToSet: {viewedBy: userId},  //Add user id to viewedBy array, avoiding duplicates
            },
            {new: true} //return the updated video document
        ).populate('user_id', 'ChannelName logoUrl subscriber subscribedChannels');

        if(!video) return res.status(404).json({error: "Video not found"});

        const videoObj = video.toJSON();
        videoObj.likes = videoObj.likedBy || [];
        videoObj.dislikes = videoObj.disLikedBy || [];
        videoObj.views = videoObj.viewedBy?.length || 0;

        res.status(200).json(videoObj);
    } catch (error) {
        console.error("Fetch error", error);
        res.status(500).json({error: "Something went wrong", message: error.message});
    }
});

export default router;
