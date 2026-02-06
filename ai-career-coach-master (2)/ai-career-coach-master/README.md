# 🚀 AI Career Coach - MERN Stack Application

A comprehensive AI-powered career coaching platform built with the MERN stack, featuring intelligent career analysis, personalized learning paths, skill gap analysis, and resume generation using OpenRouter's free AI models.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Profile Analysis** - Intelligent assessment of skills, strengths, and weaknesses
- **Career Path Recommendations** - Personalized career suggestions based on your profile
- **Skill Gap Analysis** - Identify exactly what skills you need for your target role
- **Learning Plan Generation** - Custom 6-month learning roadmaps with courses and projects
- **Resume Builder** - ATS-optimized resume generation tailored to target roles
- **24/7 AI Coach** - Conversational AI assistant for career guidance

### 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

### 🎨 UI/UX
- Modern dark theme design
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Intuitive navigation
- Real-time chat interface

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenRouter API** - AI integration (free models)
- **Helmet** - Security middleware
- **Express Rate Limit** - API protection

### Frontend
- **React 19** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **Context API** - State management

### AI Models (via OpenRouter)
- **Llama 3.2 3B** (default, free)
- **Mistral 7B** (free alternative)
- **Gemma 2 9B** (free alternative)

## 📋 Prerequisites

- **Node.js** v16+ and npm
- **MongoDB** (local or Atlas)
- **OpenRouter API Key** (free at https://openrouter.ai/keys)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
cd ai-career-coach-master
```

### 2. Backend Setup

```bash
# Install backend dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file:**
```env
PORT=5001
NODE_ENV=development

# MongoDB (use local or Atlas)
MONGODB_URI=mongodb://localhost:27017/ai-career-coach

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# OpenRouter API (get free key from https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_openrouter_api_key_here
AI_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Seed the database with roles:**
```bash
npm run seed
```

**Start backend server:**
```bash
npm run dev
```

Backend will run on **http://localhost:5001**

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

Frontend will run on **http://localhost:3000**

### 4. Run Both Simultaneously (Optional)

From the root directory:
```bash
npm run dev:full
```

## 🔑 Getting OpenRouter API Key (FREE)

1. Go to https://openrouter.ai/keys
2. Sign up with Google/GitHub
3. Create a new API key
4. Copy and paste into `.env` file

**Free Models Available:**
- `meta-llama/llama-3.2-3b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`
- `qwen/qwen-2-7b-instruct:free`

## 📁 Project Structure

```
ai-career-coach/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── profileController.js  # Profile management
│   │   ├── aiController.js       # AI features
│   │   └── roleController.js     # Career roles
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Error handling
│   │   └── validators.js         # Input validation
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Profile.js            # Profile schema
│   │   └── Role.js               # Role schema
│   ├── routes/
│   │   ├── auth.js               # Auth routes
│   │   ├── profile.js            # Profile routes
│   │   ├── ai.js                 # AI routes
│   │   └── roles.js              # Role routes
│   ├── services/
│   │   └── aiAgent.js            # OpenRouter AI service
│   ├── data/
│   │   └── roles.json            # Seed data
│   ├── scripts/
│   │   └── seedData.js           # Database seeding
│   └── server.js                 # Express server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js         # Navigation
│   │   │   └── Navbar.css
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state
│   │   ├── pages/
│   │   │   ├── Home.js           # Landing page
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Register.js       # Registration
│   │   │   ├── Dashboard.js      # User dashboard
│   │   │   ├── AICoach.js        # AI chat
│   │   │   └── *.css             # Styles
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   ├── App.js                # Main app
│   │   ├── index.js              # Entry point
│   │   └── index.css             # Global styles
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/update` - Update user (protected)

### Profile
- `GET /api/profile` - Get user profile (protected)
- `POST /api/profile` - Create/update profile (protected)
- `POST /api/profile/analyze` - AI profile analysis (protected)
- `POST /api/profile/education` - Add education (protected)
- `POST /api/profile/experience` - Add experience (protected)
- `PUT /api/profile/skills` - Update skills (protected)

### AI Features
- `POST /api/ai/chat` - Chat with AI coach (protected)
- `GET /api/ai/recommendations` - Get career recommendations (protected)
- `POST /api/ai/learning-plan` - Generate learning plan (protected)
- `POST /api/ai/skill-gap` - Analyze skill gap (protected)
- `POST /api/ai/resume` - Generate resume content (protected)

### Roles
- `GET /api/roles` - Get all roles (public)
- `GET /api/roles/:id` - Get single role (public)
- `GET /api/roles/categories` - Get categories (public)

## 🧪 Testing the Application

### 1. Register a New User
- Go to http://localhost:3000/register
- Fill in your details
- Click "Create Account"

### 2. Complete Your Profile
- Navigate to Profile page
- Add your education, experience, and skills
- (Note: Full profile builder UI is in development, use API directly for now)

### 3. Get AI Analysis
- Go to Dashboard
- Click "Analyze Profile"
- View your strengths, weaknesses, and career recommendations

### 4. Chat with AI Coach
- Navigate to AI Coach page
- Ask questions like:
  - "How do I transition into data science?"
  - "What skills should I learn for backend development?"
  - "How can I improve my resume?"

### 5. Explore Career Roles
- Browse available roles
- View required skills and salary ranges
- Get skill gap analysis

## 🔧 Configuration

### Change AI Model
Edit `.env`:
```env
# Use a different free model
AI_MODEL=mistralai/mistral-7b-instruct:free
```

### MongoDB Atlas (Cloud Database)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-career-coach
```

### Production Deployment
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running: `mongod --version`
- Verify `.env` file exists and has correct values
- Check port 5001 is not in use (or change PORT in .env)

### Frontend won't connect to backend
- Ensure backend is running on port 5001
- Check `proxy` in `frontend/package.json` is set to `http://localhost:5001`

### AI responses failing
- Verify OpenRouter API key is correct
- Check you have internet connection
- Try a different free model

### Database connection error
- Start MongoDB: `mongod` (local) or check Atlas connection string
- Verify `MONGODB_URI` in `.env`

## 📚 Next Steps

### Planned Features
- [ ] Full profile builder UI
- [ ] Resume PDF export
- [ ] Job board integration
- [ ] Assessment engine
- [ ] Progress tracking dashboard
- [ ] Email notifications
- [ ] Social sharing
- [ ] Admin panel

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- OpenRouter for free AI model access
- MongoDB for database
- React team for amazing frontend library
- All open-source contributors

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review API documentation

---

**Built with ❤️ using MERN Stack + AI**

Happy Career Coaching! 🚀
