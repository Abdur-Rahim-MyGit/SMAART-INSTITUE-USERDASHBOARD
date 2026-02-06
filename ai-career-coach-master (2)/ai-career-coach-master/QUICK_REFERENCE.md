# 🗂️ Quick Reference: Where is Everything?

## 🔍 Looking for the .env file?
**Location**: `ai-career-coach-master/.env` (ROOT directory, NOT in backend folder!)

## 📦 Package.json Files

### Backend package.json
- **Location**: `ai-career-coach-master/package.json` (ROOT)
- **Contains**: Express, MongoDB, JWT, bcrypt, etc.
- **Used for**: Backend server dependencies

### Frontend package.json  
- **Location**: `ai-career-coach-master/frontend/package.json`
- **Contains**: React, React Router, Axios, etc.
- **Used for**: Frontend React app dependencies

## 🚀 How to Start the Application

### Option 1: Start Backend Only
```bash
# Navigate to ROOT directory
cd ai-career-coach-master

# Make sure .env file exists in ROOT
# Install dependencies (if not done)
npm install

# Start backend server
npm run dev
```
**Backend runs on**: http://localhost:5001

### Option 2: Start Frontend Only
```bash
# Navigate to FRONTEND directory
cd ai-career-coach-master/frontend

# Install dependencies (if not done)
npm install

# Start React app
npm start
```
**Frontend runs on**: http://localhost:3000

### Option 3: Start Both Together
```bash
# Navigate to ROOT directory
cd ai-career-coach-master

# This runs both backend and frontend
npm run dev:full
```

## 📂 File Locations Cheat Sheet

| What you're looking for | Where it is |
|------------------------|-------------|
| `.env` file | `ai-career-coach-master/.env` ✅ ROOT |
| Backend package.json | `ai-career-coach-master/package.json` ✅ ROOT |
| Frontend package.json | `ai-career-coach-master/frontend/package.json` |
| Backend code | `ai-career-coach-master/backend/` folder |
| Frontend code | `ai-career-coach-master/frontend/src/` folder |
| Server entry point | `ai-career-coach-master/backend/server.js` |
| React entry point | `ai-career-coach-master/frontend/src/index.js` |
| API routes | `ai-career-coach-master/backend/routes/` |
| React components | `ai-career-coach-master/frontend/src/components/` |
| Database models | `ai-career-coach-master/backend/models/` |
| API service | `ai-career-coach-master/frontend/src/services/api.js` |

## ⚙️ Environment Variables (.env)

**IMPORTANT**: The `.env` file is in the ROOT directory, NOT in the backend folder!

```
ai-career-coach-master/
├── .env              ← HERE! (Backend uses this)
├── package.json      ← Backend dependencies
├── backend/          ← Backend code (no .env here!)
└── frontend/         ← Frontend code
```

### Current .env Configuration
```env
PORT=5001                                    # Backend port (changed from 5000)
MONGODB_URI=mongodb://localhost:27017/...   # Database connection
JWT_SECRET=your-secret-key                   # Authentication secret
OPENROUTER_API_KEY=your-api-key             # AI service key
FRONTEND_URL=http://localhost:3000          # Frontend URL for CORS
```

## 🔧 Common Confusion Points

### ❓ "Why is .env in the root and not in backend folder?"
**Answer**: This is a monorepo structure. The root `package.json` contains backend dependencies, and the backend code is in the `backend/` folder. The `.env` file is read by `backend/server.js` using `require('dotenv').config()` which looks in the root by default.

### ❓ "Why are there two node_modules folders?"
**Answer**: 
- `ai-career-coach-master/node_modules/` = Backend dependencies
- `ai-career-coach-master/frontend/node_modules/` = Frontend dependencies

They are separate because backend and frontend have different dependencies.

### ❓ "How do I add a new backend dependency?"
**Answer**: 
```bash
cd ai-career-coach-master  # Go to ROOT
npm install package-name
```

### ❓ "How do I add a new frontend dependency?"
**Answer**: 
```bash
cd ai-career-coach-master/frontend  # Go to FRONTEND
npm install package-name
```

### ❓ "Why did the port change to 5001?"
**Answer**: Port 5000 was occupied by AnyDesk. To avoid conflicts, we changed to 5001. You can change it back in `.env` if you stop AnyDesk or change its port.

## 🎯 Quick Troubleshooting

### Backend won't start
1. Check if `.env` exists in ROOT directory
2. Check if MongoDB is running
3. Check if port 5001 is free
4. Run `npm install` in ROOT directory

### Frontend won't connect to backend
1. Check if backend is running on port 5001
2. Check `frontend/package.json` has `"proxy": "http://localhost:5001"`
3. Check `frontend/src/services/api.js` has correct baseURL

### Can't find .env file
1. It's in the ROOT directory: `ai-career-coach-master/.env`
2. NOT in `backend/` folder
3. If it doesn't exist, copy from `.env.example`

## 📊 Visual Structure

```
ROOT (ai-career-coach-master/)
│
├── 🔐 .env                    ← Environment variables (BACKEND)
├── 📦 package.json            ← Backend dependencies
├── 📁 node_modules/           ← Backend packages
│
├── 📁 backend/                ← Backend code
│   ├── server.js              ← Entry point (reads .env from root)
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
│
└── 📁 frontend/               ← Frontend code
    ├── 📦 package.json        ← Frontend dependencies
    ├── 📁 node_modules/       ← Frontend packages
    └── src/
        ├── App.js
        ├── components/
        ├── pages/
        └── services/
```

## ✅ Summary

- ✅ `.env` is in ROOT (correct location)
- ✅ Backend package.json is in ROOT
- ✅ Frontend package.json is in `frontend/`
- ✅ Backend code is in `backend/` folder
- ✅ Frontend code is in `frontend/src/` folder
- ✅ This is the CORRECT structure for this project

**The folder structure is already properly organized!** 🎉
