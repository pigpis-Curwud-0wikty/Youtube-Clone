import express from 'express'
import dotenv from 'dotenv'
import fileUpload from 'express-fileupload'
import bodyParser from 'body-parser'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

import { ConnectDB } from './Config/db.config.js'
import userRoutes from './Routes/user.routes.js'
import videoRoutes from './Routes/video.routes.js'
import commentRoutes from './Routes/comment.routes.js'
import { swaggerSpec, swaggerUi } from './Config/swagger.config.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }),
)

// Allow Angular dev server to call backend
app.use(
  cors({
    origin: ['http://localhost:4200'],
    credentials: true,
  }),
)

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'YouTube Clone API Documentation',
  customfavIcon: '/favicon.ico'
}))

// API Routes
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/video', videoRoutes)
app.use('/api/v1/comment', commentRoutes)

const PORT = Number(process.env.PORT) || 8000

// Connect to database and then start server
async function startServer() {
  try {
    // Wait for database connection
    await ConnectDB()
    
    // Start server only after database is connected
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`)
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
