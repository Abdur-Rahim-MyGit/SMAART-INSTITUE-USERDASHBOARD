# 🚀 Quick Start Guide - AI Career Coach

## Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB installed (or MongoDB Atlas account)
- [ ] OpenRouter API key (free from https://openrouter.ai/keys)

## Step-by-Step Setup (5 minutes)

### 1️⃣ Get OpenRouter API Key (FREE)
1. Visit: https://openrouter.ai/keys
2. Sign up with Google/GitHub
3. Click "Create Key"
4. Copy your API key

### 2️⃣ Configure Environment
Open `.env` file and update:
```env
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
MONGODB_URI=mongodb://localhost:27017/ai-career-coach
JWT_SECRET=change_this_to_random_string_123456
```

### 3️⃣ Install & Start Backend
```bash
# Install dependencies
npm install

# Seed database with career roles
npm run seed

# Start backend server
npm run dev
```
✅ Backend running at http://localhost:5000

### 4️⃣ Install & Start Frontend
Open a NEW terminal:
```bash
cd frontend
npm install
npm start
```
✅ Frontend running at http://localhost:3000

## 🎉 You're Ready!

### Test the Application
1. **Register**: http://localhost:3000/register
2. **Create account** with your email
3. **Go to Dashboard** to see your profile
4. **Chat with AI Coach** at /coach page

### Try These AI Prompts
- "I want to become a data scientist. What should I learn?"
- "Analyze my skills and suggest career paths"
- "Create a 6-month learning plan for backend development"
- "How can I improve my resume for tech jobs?"

## 🔧 Troubleshooting

### MongoDB Connection Error
**Local MongoDB:**
```bash
# Start MongoDB
mongod
```

**Or use MongoDB Atlas (Cloud - Free):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### AI Not Responding
- Check OpenRouter API key is correct
- Verify internet connection
- Try different model in `.env`:
  ```env
  AI_MODEL=mistralai/mistral-7b-instruct:free
  ```

## 📖 API Testing (Postman/Thunder Client)

### Register User
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123!"
}
```

### Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Test123!"
}
```

### Chat with AI (requires token)
```http
POST http://localhost:5000/api/ai/chat
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "How do I become a full stack developer?"
}
```

## 🎯 Next Steps

1. ✅ Complete your profile
2. ✅ Get AI analysis
3. ✅ Explore career roles
4. ✅ Generate learning plan
5. ✅ Build your resume

## 💡 Pro Tips

- **Use specific questions** with the AI coach for better responses
- **Complete your profile** for personalized recommendations
- **Try different AI models** to compare responses
- **Check the Dashboard** for career insights

## 📚 Documentation

- **Full README**: See `README.md`
- **API Docs**: Check backend routes in `backend/routes/`
- **Frontend Components**: See `frontend/src/pages/`

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review troubleshooting section
- Open an issue on GitHub

---

**Happy Career Coaching! 🚀**
