# 📁 Project Structure Guide

## Overview
This project uses a **monorepo structure** where both backend and frontend code live in the same repository but are organized separately.

## Directory Layout

```
ai-career-coach-master/
│
├── 📄 .env                          ← BACKEND ENVIRONMENT VARIABLES (ROOT LEVEL)
├── 📄 .env.example                  ← Template for .env file
├── 📄 package.json                  ← BACKEND dependencies
├── 📄 package-lock.json             ← Backend dependency lock file
├── 📁 node_modules/                 ← Backend dependencies installed here
│
├── 📁 backend/                      ← BACKEND CODE (No package.json here!)
│   ├── 📁 config/
│   │   └── db.js                    ← MongoDB connection
│   ├── 📁 controllers/
│   │   ├── authController.js        ← Authentication logic
│   │   ├── profileController.js     ← Profile management
│   │   ├── aiController.js          ← AI features
│   │   └── roleController.js        ← Career roles
│   ├── 📁 middleware/
│   │   ├── auth.js                  ← JWT verification
│   │   ├── errorHandler.js          ← Error handling
│   │   └── validators.js            ← Input validation
│   ├── 📁 models/
│   │   ├── User.js                  ← User schema
│   │   ├── Profile.js               ← Profile schema
│   │   └── Role.js                  ← Role schema
│   ├── 📁 routes/
│   │   ├── auth.js                  ← Auth routes
│   │   ├── profile.js               ← Profile routes
│   │   ├── ai.js                    ← AI routes
│   │   └── roles.js                 ← Role routes
│   ├── 📁 services/
│   │   └── aiAgent.js               ← OpenRouter AI service
│   ├── 📁 data/
│   │   ├── roles.json               ← Seed data (global)
│   │   └── roles_india.json         ← Seed data (India-specific)
│   ├── 📁 scripts/
│   │   └── seedData.js              ← Database seeding script
│   └── 📄 server.js                 ← Express server entry point
│
└── 📁 frontend/                     ← FRONTEND CODE (Separate React app)
    ├── 📄 package.json              ← FRONTEND dependencies
    ├── 📄 package-lock.json         ← Frontend dependency lock file
    ├── 📁 node_modules/             ← Frontend dependencies installed here
    ├── 📁 public/
    │   ├── index.html
    │   └── favicon.ico
    └── 📁 src/
        ├── 📁 components/
        │   ├── Navbar.js
        │   └── Navbar.css
        ├── 📁 context/
        │   └── AuthContext.js       ← Auth state management
        ├── 📁 pages/
        │   ├── Home.js
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── Profile.js
        │   ├── AICoach.js
        │   ├── CareerExplorer.js
        │   ├── LearningPath.js
        │   └── ResumeBuilder.js
        ├── 📁 services/
        │   └── api.js               ← Axios API client
        ├── App.js                   ← Main React component
        ├── index.js                 ← React entry point
        └── index.css                ← Global styles
```

## 🔑 Key Points

### 1. **Environment Variables (.env)**
- **Location**: Root directory (`ai-career-coach-master/.env`)
- **Used by**: Backend only
- **Contains**: PORT, MONGODB_URI, JWT_SECRET, OPENROUTER_API_KEY, etc.

### 2. **Backend Dependencies**
- **package.json location**: Root directory
- **node_modules location**: Root directory
- **Code location**: `backend/` folder
- **Entry point**: `backend/server.js`

### 3. **Frontend Dependencies**
- **package.json location**: `frontend/` folder
- **node_modules location**: `frontend/` folder
- **Code location**: `frontend/src/` folder
- **Entry point**: `frontend/src/index.js`

## 🚀 How to Run

### Backend
```bash
# From root directory
npm install              # Install backend dependencies
npm run dev              # Start backend server (uses backend/server.js)
```

### Frontend
```bash
# From frontend directory
cd frontend
npm install              # Install frontend dependencies
npm start                # Start React development server
```

### Both Together
```bash
# From root directory
npm run dev:full         # Runs both backend and frontend concurrently
```

## 📝 Important Files

### Backend Configuration
- **`.env`** (root) - Environment variables
- **`package.json`** (root) - Backend dependencies
- **`backend/server.js`** - Server entry point

### Frontend Configuration
- **`frontend/package.json`** - Frontend dependencies
- **`frontend/src/services/api.js`** - API configuration
- **`frontend/src/App.js`** - Main React component

## ⚙️ Current Configuration

### Ports
- **Backend**: Port 5001 (changed from 5000 to avoid AnyDesk conflict)
- **Frontend**: Port 3000 (React default)

### API URLs
- Backend API: `http://localhost:5001/api`
- Frontend: `http://localhost:3000`

## 🔧 Why This Structure?

This monorepo structure is intentional:

✅ **Advantages:**
- Single repository for full-stack app
- Shared version control
- Easy deployment
- Consistent environment variables

❌ **Potential Confusion:**
- Backend has no separate package.json
- .env is at root, not in backend folder
- Two separate node_modules folders

## 📌 Quick Reference

| What you need | Where to find it |
|--------------|------------------|
| Backend dependencies | Root `package.json` |
| Frontend dependencies | `frontend/package.json` |
| Environment variables | Root `.env` |
| Backend code | `backend/` folder |
| Frontend code | `frontend/src/` folder |
| Start backend | `npm run dev` (from root) |
| Start frontend | `npm start` (from frontend/) |
| Database config | `backend/config/db.js` |
| API routes | `backend/routes/` |
| React components | `frontend/src/components/` |

## 🎯 Common Tasks

### Add Backend Dependency
```bash
# From root directory
npm install package-name
```

### Add Frontend Dependency
```bash
# From frontend directory
cd frontend
npm install package-name
```

### Update Environment Variables
```bash
# Edit root .env file
code .env  # or use any text editor
```

### Check Backend Logs
```bash
# Backend runs from root, check terminal where you ran 'npm run dev'
```

### Check Frontend Logs
```bash
# Frontend runs from frontend/, check terminal where you ran 'npm start'
```

---

**This structure is working as designed!** The .env file in the root is correct for this monorepo setup.
