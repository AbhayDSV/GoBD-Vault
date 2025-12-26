# Port 5000 Already in Use - Quick Fix

## Issue
The error `EADDRINUSE: address already in use :::5000` means there's already a Node.js process running on port 5000 from a previous backend start.

## Solution

### Option 1: Kill the Process (Recommended)
I've already killed the old processes for you. Now simply restart:

```bash
cd backend
npm run dev
```

### Option 2: If Port Still Busy
If you still get the error, run this command to kill all processes on port 5000:

```bash
lsof -ti:5000 | xargs kill -9
```

Then start the backend:
```bash
cd backend
npm run dev
```

### Option 3: Use a Different Port
Edit `backend/.env` and change:
```
PORT=5001
```

Then update `frontend/vite.config.js` proxy target to `http://localhost:5001`

## Expected Output

When the backend starts successfully, you should see:

```
✅ Connected to MongoDB
🚀 GoBD Digital Archive API running on port 5000
📋 Environment: development
🔒 Compliance: GoBD §146 AO, §147 AO
```

## Preventing This Issue

Always stop the backend with `Ctrl+C` before starting it again. Don't leave multiple instances running.

## Current Status

✅ MongoDB is running  
✅ Old processes killed  
✅ Port 5000 is free  
⏳ Ready to start backend  

**Next step**: Run `npm run dev` in the backend directory.
