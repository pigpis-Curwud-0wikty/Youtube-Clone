# MongoDB Atlas Connection Setup Guide

## Common Issues and Solutions

### 1. IP Whitelist Error
**Error:** `Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.`

**Solution:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Click on **Network Access** (or **IP Access List**)
4. Click **Add IP Address**
5. For development, you can:
   - Click **Add Current IP Address** (recommended)
   - Or add `0.0.0.0/0` to allow all IPs (⚠️ **Only for development, not production!**)
6. Click **Confirm**

### 2. SSL/TLS Connection Error
**Error:** `SSL routines:ssl3_read_bytes:tlsv1 alert internal error`

**Solution:**
1. Make sure your connection string includes `?retryWrites=true&w=majority` at the end
2. Ensure your connection string format is correct:
   ```
   mongodb+srv://<username>:<password>@cluster-name.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```
3. Check that your username and password don't contain special characters that need URL encoding
   - If they do, encode them (e.g., `@` becomes `%40`, `#` becomes `%23`)

### 3. Authentication Error
**Error:** Authentication failed

**Solution:**
1. Verify your username and password in the connection string
2. Make sure you've created a database user in MongoDB Atlas:
   - Go to **Database Access**
   - Click **Add New Database User**
   - Set username and password
   - Grant appropriate permissions (at least `readWrite`)

### 4. Connection String Format
Your `.env` file should contain:
```env
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```

**Important Notes:**
- Replace `username` with your MongoDB Atlas username
- Replace `password` with your MongoDB Atlas password (URL encode if needed)
- Replace `cluster-name` with your actual cluster name
- Replace `database-name` with your database name (e.g., `youtube-clone`)

### 5. Testing the Connection
After fixing the issues:
1. Restart your Node.js server
2. You should see: `Database Connected Successfully.`
3. If errors persist, check the console for specific error messages

### Quick Fix Checklist
- [ ] IP address is whitelisted in MongoDB Atlas
- [ ] Database user is created with correct credentials
- [ ] Connection string is correctly formatted
- [ ] Password is URL encoded if it contains special characters
- [ ] Network/firewall is not blocking the connection

