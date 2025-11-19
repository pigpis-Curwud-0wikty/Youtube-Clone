import jwt from 'jsonwebtoken'
import User from '../Models/user.Model.js'

export const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Decode using the same secret used in user login route
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret')

    // Fetch user from database
    const user = await User.findById(decodedUser._id)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Attach user
    req.user = {
      ...decodedUser
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token', message: error.message })
  }
}

