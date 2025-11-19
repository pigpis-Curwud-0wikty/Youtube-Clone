import express from 'express'
import mongoose from 'mongoose'
import Comment from '../Models/comment.Model.js'
import { checkAuth } from '../Middleware/auth.middleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/comment/new:
 *   post:
 *     tags: [Comments]
 *     summary: Add a new comment
 *     description: Add a comment to a video. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - video_id
 *               - commentText
 *             properties:
 *               video_id:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               commentText:
 *                 type: string
 *                 example: "Great video!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully"
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/new', checkAuth, async (req, res) => {
  try {
    const { video_id, commentText } = req.body

    if (!video_id || !commentText) {
      return res.status(400).json({ error: 'Video id & text are required.' })
    }

    const newComment = new Comment({
      _id: new mongoose.Types.ObjectId(),
      video_id,
      commentText,
      user_id: req.user._id,
    })

    await newComment.save()
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'something went wrong', message: error.message })
  }
})

router.delete('/:commentId', checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params
    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res.status(403).json({ error: 'unauthorized to delete this comment' })
    }

    await Comment.findByIdAndDelete(commentId)
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'something went wrong', message: error.message })
  }
})

router.put('/:commentId', checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params
    const { commentText } = req.body

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res.status(403).json({ error: 'unauthorized to update this comment' })
    }
    comment.commentText = commentText
    await comment.save()
    res.status(200).json({ message: 'Comment updated successfully', comment })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'something went wrong', message: error.message })
  }
})

/**
 * @swagger
 * /api/v1/comment/comment/{videoId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a video
 *     description: Retrieve all comments for a specific video. No authentication required.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The video ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Public: get comments by video
router.get('/comment/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    const comments = await Comment.find({ video_id: videoId })
      .populate('user_id', 'ChannelName logoUrl')
      .sort({ createdAt: -1 })
    res.status(200).json({ comments })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something went wrong', message: error.message })
  }
})

export default router
