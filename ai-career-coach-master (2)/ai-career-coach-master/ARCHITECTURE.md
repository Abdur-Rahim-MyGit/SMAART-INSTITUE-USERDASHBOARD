# 🏗️ AI Career Coach - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│                    (Web Browser)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components:                                          │  │
│  │  • Navbar (Navigation)                                │  │
│  │  • Home (Landing Page)                                │  │
│  │  • Login/Register (Auth)                              │  │
│  │  • Dashboard (Analytics)                              │  │
│  │  • AI Coach (Chat Interface)                          │  │
│  │  • Profile Builder                                    │  │
│  │  • Resume Generator                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  State Management:                                    │  │
│  │  • AuthContext (User state)                           │  │
│  │  • API Service (Axios)                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Layer:                                    │  │
│  │  • Helmet (Security Headers)                          │  │
│  │  • CORS (Cross-Origin)                                │  │
│  │  • Rate Limiter (100 req/15min)                       │  │
│  │  • JWT Auth (Token Verification)                      │  │
│  │  • Validators (Input Sanitization)                    │  │
│  │  • Error Handler (Centralized)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes & Controllers:                                │  │
│  │  • /api/auth      → authController                    │  │
│  │  • /api/profile   → profileController                 │  │
│  │  • /api/ai        → aiController                      │  │
│  │  • /api/roles     → roleController                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services:                                            │  │
│  │  • AI Agent (OpenRouter Integration)                  │  │
│  │    - Profile Analysis                                 │  │
│  │    - Career Recommendations                           │  │
│  │    - Learning Plan Generation                         │  │
│  │    - Skill Gap Analysis                               │  │
│  │    - Resume Content Generation                        │  │
│  │    - Conversational Chat                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             │                           │
             ▼                           ▼
┌─────────────────────────┐   ┌──────────────────────────────┐
│   DATABASE (MongoDB)    │   │   AI SERVICE (OpenRouter)    │
│  ┌──────────────────┐   │   │  ┌────────────────────────┐  │
│  │ Collections:     │   │   │  │ Free Models:           │  │
│  │ • users          │   │   │  │ • Llama 3.2 3B         │  │
│  │ • profiles       │   │   │  │ • Mistral 7B           │  │
│  │ • roles          │   │   │  │ • Gemma 2 9B           │  │
│  └──────────────────┘   │   │  │ • Qwen 2 7B            │  │
│                          │   │  └────────────────────────┘  │
│  Indexes:                │   │                              │
│  • email (unique)        │   │  Capabilities:               │
│  • user_id               │   │  • Text Generation           │
│  • skills.name           │   │  • Analysis                  │
│  • career_goals          │   │  • Recommendations           │
└─────────────────────────┘   └──────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration & Login Flow

```
User → Frontend → Backend → MongoDB
  │                  │
  │                  ├─ Hash Password (bcrypt)
  │                  ├─ Create User Record
  │                  ├─ Generate JWT Token
  │                  └─ Return User + Token
  │
  └─ Store Token in localStorage
  └─ Redirect to Dashboard
```

### 2. AI Profile Analysis Flow

```
User → Dashboard → "Analyze Profile" Button
  │
  ├─ Frontend: GET /api/profile
  │   └─ Backend: Fetch profile from MongoDB
  │
  ├─ Frontend: POST /api/profile/analyze
  │   │
  │   └─ Backend:
  │       ├─ Get user profile
  │       ├─ Call AI Agent Service
  │       │   │
  │       │   └─ OpenRouter API:
  │       │       ├─ Send profile data
  │       │       ├─ AI analyzes strengths/weaknesses
  │       │       └─ Return recommendations
  │       │
  │       ├─ Save analysis to profile.aiAnalysis
  │       └─ Update user.careerStage
  │
  └─ Display results on Dashboard
```

### 3. AI Chat Flow

```
User → AI Coach Page → Type Message → Send
  │
  ├─ Frontend: POST /api/ai/chat
  │   Body: { message: "How do I become a data scientist?" }
  │
  └─ Backend:
      ├─ Get user context (career stage, goals)
      ├─ Call AI Agent Service
      │   │
      │   └─ OpenRouter API:
      │       ├─ Compose system prompt with context
      │       ├─ Add user message
      │       ├─ AI generates response
      │       └─ Return message
      │
      └─ Return to frontend
          └─ Display in chat interface
```

### 4. Learning Plan Generation Flow

```
User → Request Learning Plan for "Backend Developer"
  │
  ├─ Frontend: POST /api/ai/learning-plan
  │   Body: { targetRole: "Backend Developer" }
  │
  └─ Backend:
      ├─ Get user profile (skills, experience)
      ├─ Call AI Agent Service
      │   │
      │   └─ OpenRouter API:
      │       ├─ Analyze current skills vs target role
      │       ├─ Generate 6-month plan:
      │       │   • Month-by-month breakdown
      │       │   • Courses to take
      │       │   • Projects to build
      │       │   • Skills to learn
      │       │   • Milestones
      │       └─ Return structured plan
      │
      └─ Return plan to frontend
          └─ Display formatted roadmap
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Transport Layer                                      │
│     • HTTPS (production)                                 │
│     • CORS (configured origins)                          │
│                                                          │
│  2. Application Layer                                    │
│     • Helmet.js (security headers)                       │
│     • Rate Limiting (100 req/15min)                      │
│     • Input Validation (express-validator)               │
│     • XSS Protection                                     │
│                                                          │
│  3. Authentication Layer                                 │
│     • JWT Tokens (7-day expiry)                          │
│     • Password Hashing (bcrypt, 10 rounds)               │
│     • Protected Routes (middleware)                      │
│     • Token in Authorization header                      │
│                                                          │
│  4. Data Layer                                           │
│     • MongoDB Schema Validation                          │
│     • Sensitive data exclusion (password)                │
│     • Indexed queries (performance)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed, excluded from responses),
  phone: String,
  location: String,
  headline: String,
  careerStage: Enum,
  profileCompleted: Boolean,
  lastActive: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Profiles Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, unique, indexed),
  education: [{
    degree, institution, fieldOfStudy,
    startYear, endYear, grade, current
  }],
  experience: [{
    company, role, startDate, endDate,
    current, description, achievements, skills
  }],
  skills: [{
    name (indexed), level (1-10),
    category, verified
  }],
  interests: [String],
  careerGoals: {
    shortTerm, longTerm,
    targetRoles (indexed), targetIndustries
  },
  constraints: {
    preferredLocations, salaryExpectation,
    workType, availability
  },
  assessmentScores: {
    technical, behavioral, cognitive, lastAssessed
  },
  resumeUrl: String,
  resumeParsed: { skills, experience, education, parsedAt },
  aiAnalysis: {
    strengths: [{ skill, evidence, score }],
    weaknesses: [{ skill, severity, recommendation }],
    recommendedPaths: [{ role, matchScore, reasoning, timeline }],
    lastAnalyzed: Date
  },
  progress: {
    coursesCompleted, projectsCompleted, assessmentsPassed
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Roles Collection
```javascript
{
  _id: ObjectId,
  title: String (indexed),
  category: Enum (indexed),
  seniority: Enum (indexed),
  description: String,
  requiredSkills: [{
    name (indexed), importance (1-10), category
  }],
  salary: { min, max, currency, period },
  marketData: { demand, growth, openings },
  learningPath: [{
    phase, duration, skills, resources
  }],
  relatedRoles: [String],
  careerProgression: { previous, next },
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Request/Response Flow

```
Client Request
    ↓
Express Middleware Stack
    ├─ Helmet (Security Headers)
    ├─ CORS (Origin Check)
    ├─ Rate Limiter (Request Count)
    ├─ Body Parser (JSON)
    ├─ JWT Auth (if protected route)
    └─ Validators (Input Validation)
    ↓
Route Handler
    ↓
Controller
    ├─ Business Logic
    ├─ Database Queries
    ├─ AI Service Calls (if needed)
    └─ Response Formatting
    ↓
Error Handler (if error)
    ↓
JSON Response to Client
```

---

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────────────────┐
│                    Production Setup                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend:                                              │
│  • Vercel / Netlify (Static Hosting)                   │
│  • CDN (Global Distribution)                            │
│  • HTTPS (SSL Certificate)                              │
│                                                         │
│  Backend:                                               │
│  • Heroku / Railway / Render                            │
│  • Environment Variables (Secrets)                      │
│  • Auto-scaling                                         │
│  • Health Checks                                        │
│                                                         │
│  Database:                                              │
│  • MongoDB Atlas (Cloud)                                │
│  • Automated Backups                                    │
│  • Replica Sets                                         │
│  • Monitoring                                           │
│                                                         │
│  AI Service:                                            │
│  • OpenRouter API (Managed)                             │
│  • API Key in Environment                               │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

1. **Database**
   - Indexed fields (email, user_id, skills.name)
   - Lean queries (exclude unnecessary fields)
   - Connection pooling

2. **API**
   - Rate limiting (prevent abuse)
   - Caching (future: Redis)
   - Compression (gzip)

3. **Frontend**
   - Code splitting (React.lazy)
   - Image optimization
   - Lazy loading
   - Memoization (React.memo)

4. **AI**
   - Request batching
   - Response caching
   - Model selection (balance speed/quality)

---

**This architecture is designed to be:**
- ✅ Scalable
- ✅ Secure
- ✅ Maintainable
- ✅ Production-ready
