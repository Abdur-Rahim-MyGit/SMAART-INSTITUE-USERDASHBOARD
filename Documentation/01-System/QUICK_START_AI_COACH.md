# 🚀 QUICK START GUIDE - AI CAREER COACH

## ⚡ 3-MINUTE SETUP

### Step 1: Get Your FREE API Key (2 minutes)

1. Open: **https://openrouter.ai/keys**
2. Click **"Sign in with Google"** or **"Sign in with GitHub"**
3. Click **"Create Key"**
4. **Copy the API key** (starts with `sk-or-v1-...`)

---

### Step 2: Add API Key to Backend (30 seconds)

1. Open file: **`back-end/.env`**
2. Add these lines at the end:

```env
# OpenRouter AI Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here
AI_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

3. **Save the file**

---

### Step 3: Restart Backend (30 seconds)

1. Go to your backend terminal
2. Press **Ctrl+C** to stop the server
3. Run: **`npm start`**
4. Wait for "Server running" message

---

## ✅ THAT'S IT! YOU'RE READY!

### How to Access:

1. Go to: **http://localhost:5173/dashboard/smaart-toolkit**
2. Click on **"AI Career Coach"** card
3. Complete your profile
4. Start chatting!

---

## 🎯 WHAT TO TRY FIRST

### 1. Complete Your Profile
- Navigate to **Profile** section
- Add your skills (e.g., JavaScript, Python, Leadership)
- Fill in your experience and goals
- Click **"Analyze with AI"**

### 2. Chat with AI
- Go to **AI Career Chat**
- Try asking:
  - "How do I transition into data science?"
  - "What skills should I learn for my career?"
  - "How can I improve my resume?"

### 3. Get Recommendations
- Click **Career Paths**
- Click **"Get Recommendations"**
- See personalized career suggestions!

---

## 🎨 FEATURES AVAILABLE

✅ **AI Chat** - 24/7 career coaching
✅ **Profile Analysis** - AI-powered insights
✅ **Career Recommendations** - Personalized paths
✅ **Skill Management** - Track your skills
✅ **Goal Setting** - Define your career goals

---

## 🐛 TROUBLESHOOTING

### "AI service temporarily unavailable"
→ Check if you added the API key to `.env`
→ Restart the backend server

### "Failed to fetch profile"
→ Make sure you're logged in
→ Check if backend is running on port 5000

### Backend won't start
→ Run: `npm install uuid` in back-end folder
→ Check if MongoDB is running

---

## 💡 PRO TIPS

1. **Complete your profile first** for better AI responses
2. **Be specific in chat** - the more details, the better advice
3. **Try different questions** - the AI can help with many career topics
4. **Save your analysis** - it gets better as you add more info

---

## 🎉 ENJOY YOUR AI CAREER COACH!

You now have access to:
- Unlimited AI career conversations
- Personalized career guidance
- Professional profile analysis
- Career path recommendations

**All powered by FREE AI models!**

---

**Need help? Check `AI_CAREER_COACH_COMPLETE.md` for detailed documentation.**
