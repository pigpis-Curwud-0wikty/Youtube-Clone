import jwt from 'jsonwebtoken'

export const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Decode using the same secret used in user login route
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret')

    // Attach user
    req.user = decodedUser
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token', message: error.message })
  }
}

