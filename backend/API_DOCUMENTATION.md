# API Documentation Guide

## Swagger/OpenAPI Documentation

This project includes comprehensive API documentation using Swagger/OpenAPI.

## Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

**http://localhost:8000/api-docs**

## Files Structure

- `api-docs.yaml` - OpenAPI 3.0 specification file (YAML format)
- `Config/swagger.config.js` - Swagger configuration and schema definitions
- Route files contain JSDoc comments for automatic documentation generation

## Features

### Interactive API Testing
- Test all endpoints directly from the Swagger UI
- View request/response examples
- See all available parameters and their types
- Authenticate using JWT tokens

### Documentation Includes:
- **Users API**: Signup, login, profile management
- **Videos API**: Upload, view, update, delete videos
- **Comments API**: Add, update, delete, and view comments

## Using the API Documentation

### 1. Viewing Endpoints
- Navigate to http://localhost:8000/api-docs
- Browse endpoints by category (Users, Videos, Comments)
- Click on any endpoint to see details

### 2. Testing Endpoints
1. Click "Try it out" button on any endpoint
2. Fill in the required parameters
3. Click "Execute" to send the request
4. View the response below

### 3. Authentication
For protected endpoints:
1. First, login using `/api/v1/user/login` endpoint
2. Copy the `token` from the response
3. Click the "Authorize" button at the top of the Swagger UI
4. Enter: `Bearer <your-token>` (replace `<your-token>` with actual token)
5. Click "Authorize" and "Close"
6. Now you can test protected endpoints

### 4. File Uploads
For endpoints that require file uploads (like video upload):
- Use the Swagger UI's file upload feature
- Select files from your computer
- The UI handles multipart/form-data automatically

## API Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.youtubeclone.com` (update in swagger.config.js)

## Endpoints Overview

### Users (`/api/v1/user`)
- `POST /signup` - Register new user
- `POST /login` - User authentication
- `GET /profile` - Get user profile (protected)
- `PUT /update-profile` - Update profile (protected)
- `POST /subscribe` - Subscribe to channel (protected)

### Videos (`/api/v1/video`)
- `GET /all` - Get all videos
- `POST /upload` - Upload video (protected)
- `GET /:id` - Get video by ID (protected)
- `PUT /update/:id` - Update video (protected)
- `DELETE /delete/:id` - Delete video (protected)
- `POST /like` - Like video (protected)
- `POST /dislike` - Dislike video (protected)
- `GET /search?q=query` - Search videos
- `GET /tags/:tag` - Get videos by tag
- `GET /category/:category` - Get videos by category

### Comments (`/api/v1/comment`)
- `POST /new` - Add comment (protected)
- `GET /comment/:videoId` - Get comments for video
- `PUT /:commentId` - Update comment (protected)
- `DELETE /:commentId` - Delete comment (protected)

## Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Updating Documentation

To add or update API documentation:

1. **Add JSDoc comments** to route handlers:
```javascript
/**
 * @swagger
 * /api/v1/endpoint:
 *   get:
 *     tags: [TagName]
 *     summary: Endpoint summary
 *     description: Detailed description
 *     responses:
 *       200:
 *         description: Success response
 */
```

2. **Update schemas** in `Config/swagger.config.js` if needed

3. **Update YAML file** `api-docs.yaml` for static documentation

4. Restart the server to see changes

## Exporting Documentation

You can export the OpenAPI specification:

1. From Swagger UI, click the URL at the top (shows the JSON spec)
2. Or access: `http://localhost:8000/api-docs/swagger.json`
3. Save the JSON/YAML for external tools

## Integration with Other Tools

The OpenAPI specification can be used with:
- **Postman**: Import the spec to generate a Postman collection
- **Insomnia**: Import for API testing
- **Code Generation**: Generate client SDKs in various languages
- **API Testing Tools**: Use with tools like REST Assured, Karate, etc.

## Troubleshooting

### Documentation not loading?
- Ensure server is running on port 8000
- Check that swagger packages are installed: `npm list swagger-jsdoc swagger-ui-express`
- Verify routes are properly documented with JSDoc comments

### Authentication not working?
- Make sure you're using `Bearer <token>` format
- Token should be from a successful login
- Check token hasn't expired

### File uploads not working?
- Ensure `express-fileupload` is configured
- Check file size limits
- Verify multipart/form-data is being sent

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc for Swagger](https://github.com/Surnet/swagger-jsdoc)

