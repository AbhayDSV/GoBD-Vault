# MongoDB Setup Guide

## Issue
The backend server cannot start because MongoDB is not installed or running.

## Solutions

### Option 1: Install MongoDB Locally (Recommended for Development)

#### macOS Installation
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb
```

After installation, MongoDB will run on `mongodb://localhost:27017`

The backend `.env` file is already configured with:
```
MONGODB_URI=mongodb://localhost:27017/gobd-vault
```

### Option 2: Use MongoDB Atlas (Cloud - Free Tier)

1. **Create Account**:
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create Cluster**:
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Configure Access**:
   - Click "Database Access" → "Add New Database User"
   - Create username and password (save these!)
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development

4. **Get Connection String**:
   - Click "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

5. **Update Backend .env**:
   ```bash
   cd backend
   nano .env  # or use any text editor
   ```
   
   Replace the MONGODB_URI line with:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/gobd-vault?retryWrites=true&w=majority
   ```

### Option 3: Use Docker (Alternative)

```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify it's running
docker ps | grep mongodb
```

## After MongoDB is Running

1. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify Connection**:
   You should see:
   ```
   ✅ Connected to MongoDB
   🚀 GoBD Digital Archive API running on port 5000
   ```

3. **Test the Application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5000

## Quick Start (Recommended)

For fastest setup, use MongoDB Atlas (Option 2):
- No local installation needed
- Free tier available
- Setup takes ~5 minutes
- Works from anywhere

## Troubleshooting

### Backend still not connecting?
1. Check MongoDB is running: `brew services list` or `docker ps`
2. Check connection string in `backend/.env`
3. Check backend terminal for error messages
4. Ensure port 27017 is not blocked by firewall

### Need to stop MongoDB?
```bash
# Homebrew
brew services stop mongodb-community

# Docker
docker stop mongodb
```
