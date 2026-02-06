# 📘 AI Career Coach - Master Project Documentation

**Last Updated:** December 5, 2025
**Version:** 1.2.0
**Status:** Production-Ready / Active Development

---

## 1. 🚀 Project Overview

**AI Career Coach** is a comprehensive, full-stack web application designed to help students and professionals navigate their career paths using Artificial Intelligence. The platform provides personalized career analysis, skill gap identification, learning roadmaps, and a 24/7 AI career coach assistant.

### 🎯 Core Value Proposition
*   **Personalized Guidance:** Tailored advice based on user profile, skills, and experience.
*   **AI-Powered Insights:** Uses advanced LLMs (via OpenRouter) to analyze profiles and generate recommendations.
*   **Actionable Roadmaps:** Concrete steps and resources to achieve career goals.
*   **Modern Experience:** A futuristic, responsive, and engaging user interface.

---

## 2. 🛠️ Technology Stack

### **Frontend (Client-Side)**
*   **Framework:** React 19
*   **Routing:** React Router v6
*   **State Management:** React Context API
*   **Styling:** Vanilla CSS (Modern Dark Theme, Glassmorphism, CSS Variables)
*   **HTTP Client:** Axios
*   **Visualization:** Recharts (for analytics and scores)
*   **Icons:** React Icons

### **Backend (Server-Side)**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** JWT (JSON Web Tokens) + bcrypt (Password Hashing)
*   **Security:** Helmet.js, Rate Limiting, CORS
*   **AI Integration:** OpenRouter API (Access to Llama 3, Mistral, etc.)

---

## 3. ✅ Features & Implementation Status

| Feature Category | Feature Name | Status | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | User Registration | ✅ Completed | Secure sign-up with email/password. |
| | User Login | ✅ Completed | JWT-based login with session management. |
| | Password Security | ✅ Completed | Bcrypt hashing for password storage. |
| **Profile** | Profile Builder | ✅ Completed | Multi-step form for Education, Skills, Experience. |
| | Work Experience | ✅ Completed | Optional section for students/freshers. |
| | Profile Analysis | ✅ Completed | AI-driven analysis of profile strength & readiness. |
| **Dashboard** | Main Dashboard | ✅ Completed | Central hub showing stats, quick actions, and summary. |
| | Career Readiness | ✅ Completed | Visual score and stage detection (Explorer/Builder/Pro). |
| **AI Coach** | Chat Interface | ✅ Completed | Real-time chat with AI career assistant. |
| | Context Awareness | ✅ Completed | AI knows user's profile context during chat. |
| **Career Tools** | Role Explorer | ✅ Completed | Database of 20+ tech roles with market data. |
| | Skill Gap Analysis | ✅ Completed | AI identifies missing skills for target roles. |
| | Learning Plans | ✅ Completed | Custom 6-month study roadmaps. |
| | Resume Builder | ✅ Completed | Generates ATS-friendly resume content. |
| **Resources** | Resource Finder | ✅ Completed | **New:** Real-time AI search for learning resources. |

---

## 4. 🔄 Recent Updates & Fixes (Log)

### **1. Resources UI Overhaul (Dec 4, 2025)**
*   **Objective:** Modernize the Resources page and emphasize "Real-Time Search".
*   **Changes:**
    *   Replaced "Try Again" with a proactive **"Start Searching"** button.
    *   Updated loading state to **"AI Agent is scanning for real-time resources..."** for better feedback.
    *   Improved empty state UI to invite interaction.

### **2. Work Experience "Optional" Fix (Dec 4, 2025)**
*   **Issue:** Work Experience fields had asterisks (*) making them look mandatory.
*   **Fix:**
    *   Removed asterisks from "Job Title" and "Company" labels.
    *   Clarified section header as **"Work Experience (Optional)"**.
    *   Ensured validation logic allows skipping this section for students.

### **3. Dashboard & Navbar Refinement**
*   **Navbar:** Adjusted layout to prevent overflow and improved spacing.
*   **Dashboard:**
    *   Harmonized background with global dark theme.
    *   Refined card designs with futuristic "box design" (darker, glassmorphism).
    *   Added **Dynamic Personal Summary**: AI-generated text summarizing user's career standing.

### **4. Profile Analysis UI Upgrade**
*   **Visuals:** Implemented animated bars for "Career Readiness Score".
*   **Content:** Added AI-generated explanations for scores.
*   **Layout:** Compact cards for "Strengths" and "Improvements" with "View More" toggles.

---

## 5. 📂 Project Structure

```
ai-career-coach/
├── 📁 backend/                 # Server-side Code
│   ├── config/                 # DB Config
│   ├── controllers/            # Logic (Auth, Profile, AI)
│   ├── models/                 # MongoDB Schemas
│   ├── routes/                 # API Endpoints
│   ├── services/               # AI Service Integration
│   └── server.js               # Entry Point
│
├── 📁 frontend/                # Client-side Code
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Main Page Views
│   │   ├── services/           # API Calls
│   │   └── index.css           # Global Styles & Theme
│   └── package.json
│
├── 📄 .env                     # Environment Variables
├── 📄 PROJECT_SUMMARY.md       # General Summary
└── 📄 README.md                # Public Documentation
```

---

## 6. 🚀 How to Run

### **Prerequisites**
*   Node.js installed
*   MongoDB (Local or Atlas)
*   OpenRouter API Key

### **Step 1: Backend**
```bash
cd backend
npm install
# Ensure .env is configured with OPENROUTER_API_KEY and MONGODB_URI
npm run dev
# Server runs on http://localhost:5000
```

### **Step 2: Frontend**
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

---

## 7. 🔮 Future Roadmap

*   **[ ] PDF Export:** Allow users to download their AI-generated resume as PDF.
*   **[ ] Progress Tracking:** Visual timeline of completed learning goals.
*   **[ ] Job Board Integration:** Fetch real job listings based on profile.
*   **[ ] Community Features:** Peer-to-peer mentorship or forums.

---

**This document serves as the single source of truth for the project's current state.**
