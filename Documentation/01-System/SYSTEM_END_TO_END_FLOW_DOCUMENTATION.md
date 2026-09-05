# SMAART Institute User Dashboard - Complete End-to-End System Flow Documentation

## System Overview
SMAART Institute User Dashboard is an educational platform with user registration, course enrollment, assessments, community features, AI career coaching, vision boards, and gamification.

## Technology Stack
- **Frontend**: React 19, Vite, TailwindCSS, Radix UI, React Router, Zustand
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Cloudinary
- **AI**: OpenAI, OpenRouter SDK
- **Other**: TensorFlow.js, Three.js, jsPDF, xlsx

## Architecture
```
Frontend (React) → API Service → Express Routes → Controllers → Models → MongoDB
```

## Entry Points
- **Frontend**: `front-end/src/main.jsx` → `App.jsx` → `AnimatedRoutes.jsx`
- **Backend**: `back-end/server.js` (Express server on port 5000)

---

## 1. Authentication & Authorization Flow

### Login Flow
```
User enters credentials → POST /api/auth/login
  ↓
Backend validates email/password → Generates JWT token
  ↓
Sets HttpOnly cookie + stores token in sessionStorage
  ↓
Updates user.currentSessionId (single session enforcement)
  ↓
Redirects to dashboard
```

### Token Renewal
```
Background check every 5 minutes
  ↓
If token expires within 1 hour → POST /api/auth/renew-token
  ↓
Issues new token → Updates sessionStorage
```

### Session Enforcement
```
Every protected request → Auth middleware checks token.sessionId vs user.currentSessionId
  ↓
If mismatch → 401 error (kicked out message)
```

### Logout Flow
```
User clicks logout → POST /api/auth/logout
  ↓
Backend clears currentSessionId → Frontend clears storage
  ↓
Broadcasts logout event to other tabs → Redirects to landing
```

---

## 2. User Registration Flow

### Step 1: Signup Initial
```
User enters name/email → POST /api/auth/send-signup-otp
  ↓
Backend validates email → Checks if exists → Generates 6-digit OTP
  ↓
Saves to LoginOtp model → Sends email via nodemailer
  ↓
Returns tempToken → Stores in sessionStorage → Navigates to /verify-otp
```

### Step 2: Verify OTP
```
User enters 6-digit OTP → POST /api/auth/verify-signup-otp
  ↓
Backend verifies OTP → Checks expiry (5 min) → Validates attempts (max 5)
  ↓
If valid → Marks verified → Navigates to /signup
```

### Step 3: Comprehensive Signup
```
Multi-step form (10 sections):
  1. Personal Details
  2. Education (10th, 12th, Higher)
  3. Extra-Curricular
  4. Work Experience
  5. Projects
  6. Certificates
  7. Job Preferences
  8. Sector Preferences
  9. Career Goals
  10. Personal Development Goals
  ↓
Each section: Form validation → File upload to Cloudinary → Save to state
  ↓
Final submission → POST /api/registrations
  ↓
Backend creates Registration document → Hashes password → Saves to MongoDB
  ↓
Sends welcome notification → Navigates to /signup-success
```

---

## 3. Dashboard Access Flow

### Dashboard Entry
```
User logs in → Auth middleware validates token
  ↓
UserContext loads user data → AnimatedRoutes determines route
  ↓
AssessmentFlowGuard checks baseline test status
  ↓
If baseline required → Redirect to /dashboard/assessments/baseline
  ↓
If completed → Navigate to /dashboard
```

### Dashboard Components
```
DashboardHome → HeroSection → CollegeBanners → LearningProgress → EventsSection → ToolsStrip
  ↓
VisionBoardSplash (first visit) → StudentOnboarding (new users)
```

### Protected Routes
```
Public: /, /institution/:id, /verify-certificate, /verify-badge
Signup: /signup-initial, /verify-otp, /signup, /signup-success
Protected: /dashboard/* (wrapped in AssessmentFlowGuard + DashboardLayout)
```

---

## 4. Course Enrollment & Learning Flow

### Enrollment
```
User browses courses → POST /api/courseEnrollments
  ↓
Backend creates CourseEnrollment → Initializes moduleProgress
  ↓
Sends notification → Returns enrollmentId
```

### Course Viewing
```
GET /api/courseEnrollments?student=userId
  ↓
Returns enrollments with course/college data
  ↓
Frontend displays course cards with progress
```

### Module Learning (Day Structure)
```
Each module has 6 course days + 2 catch-up days
  ↓
Each day has steps:
  1. Text Reading
  2. Video Content (tracked via POST /api/courseEnrollments/video-progress)
  3. Quiz/Assessment (POST /api/courseEnrollments/task-result)
  4. Reflection (POST /api/courseEnrollments/reflection)
  5. Flashcards
  6. Summary
```

### Progress Calculation
```
CourseEnrollment pre-save hook:
  - Counts completed days (videoProgress.isCompleted OR completedTasks)
  - Calculates progress = (completedDays / totalDays) * 100
  - Updates status: enrolled → in_progress → completed
  - Triggers badge checks and notifications
```

---

## 5. Assessment & Testing Flow

### Assessment Start
```
GET /api/results/assessment/:assessmentId/start?userId=userId
  ↓
Backend checks for in-progress result
  ↓
If exists → Resumes with saved question order
  ↓
If new → Selects questions by stage (T1-T4) → Shuffles deterministically
  ↓
Creates Result document → Returns questions
```

### Question Selection
```
Stage-based selection (T1-T4):
  - Stratifies by difficulty (easy/medium/hard)
  - Selects required count from each level
  - Shuffles deterministically per user ID
```

### Assessment Taking
```
User answers → Auto-save via POST /api/results/:resultId/save-progress
  ↓
Submit → POST /api/results/:resultId/submit
  ↓
Backend calculates scores (Big Five: openness, conscientiousness, etc.)
  ↓
Determines level (Advanced/Strong/Progressing/Developing/Emerging)
  ↓
Sends notification → Returns results
```

---

## 6. Community & Social Features Flow

### Post Creation
```
POST /api/community/posts
  ↓
Backend creates CommunityPost → Uploads media to Cloudinary
  ↓
Calculates quality score → Sends notification
```

### Post Interactions
```
Like: POST /api/community/posts/:postId/like
Reply: POST /api/community/posts/:postId/replies
Vote: POST /api/community/posts/:postId/vote
Mention: @username → Adds to mentions array → Sends notification
Bookmark: POST /api/community/posts/:postId/bookmark
```

### Moderation
```
User reports → POST /api/community/posts/:postId/report
  ↓
Backend flags post → Sets status to 'hidden'
  ↓
Moderator reviews via GET /api/moderation/queue
  ↓
Takes action via POST /api/moderation/actions/:postId
```

### Groups
```
Join: POST /api/groups/:groupId/join
Create: POST /api/groups
Chat: POST /api/groups/:groupId/messages
```

### Support Tickets
```
Create: POST /api/tickets
View: GET /api/tickets?status=open
Respond: POST /api/tickets/:ticketId/respond
```

---

## 7. Vision Board Flow

### Creation
```
POST /api/upload → Upload images to Cloudinary
  ↓
POST /api/vision-boards-pro → Create VisionBoardPro
  ↓
Saves images, notes, layout, positions
```

### Gallery
```
GET /api/vision-boards-pro?userId=userId
  ↓
Returns user's boards → Display in gallery
  ↓
Click board → GET /api/vision-boards-pro/:boardId → Load in editor
```

### Active Board
```
Set as active → PATCH /api/users/:userId { activeVisionBoardId }
  ↓
Dashboard displays active board via VisionBoardSplash
```

---

## 8. AI Career Coach Flow

### Profile Analysis
```
POST /api/ai-career-coach/profile/analyze
  ↓
Backend fetches profile/assessments/courses → Constructs AI prompt
  ↓
Calls OpenAI/OpenRouter → Saves to AIProfile
  ↓
Returns strengths, weaknesses, recommendations, career paths
```

### Career Recommendations
```
GET /api/ai-career-coach/recommendations
  ↓
Returns recommended roles, industry trends, salary expectations, required skills
```

### Skill Gap Analysis
```
POST /api/ai-career-coach/skill-gap
  ↓
Compares current vs required skills → Identifies gaps
  ↓
Returns missing skills, gap level, recommended courses, timeline
```

### Learning Plan
```
POST /api/ai-career-coach/learning-plan
  ↓
Generates structured plan with phases, courses, milestones
  ↓
Returns timeline with phases and deadlines
```

### Resume Building
```
POST /api/ai-career-coach/resume
  ↓
AI enhances resume content → Improves wording and structure
  ↓
Returns enhanced summary, bullet points, ATS score
```

### AI Chat
```
POST /api/ai-career-coach/chat
  ↓
Backend adds user message → Constructs context from history
  ↓
Calls AI → Saves response to ChatMessage
  ↓
Returns reply with sessionId
```

---

## 9. Career Intelligence Flow

### Report Generation
```
POST /api/career-intelligence/generate
  ↓
Backend loads Excel data → Filters by parameters
  ↓
Performs statistical analysis → Calls AI for insights
  ↓
Saves to CareerIntelligence → Returns comprehensive report
```

### Excel Data
```
GET /api/career-intelligence/excel-data
  ↓
Reads Excel file → Parses sheets (sectors, roles) → Caches in memory
```

### Simulation
```
POST /api/career-intelligence/simulate
  ↓
Uses simulation engine (no AI cost)
  ↓
Calculates salary progression, skill requirements, promotion probability
  ↓
Returns multiple scenarios (optimistic, realistic, conservative)
```

---

## 10. Badge & Achievement System Flow

### Badge Awarding
```
Action triggers check → utils/badgeUtils.js
  ↓
checkCourseCompletionBadges, checkSkillCompletionBadges, etc.
  ↓
If criteria met → Create UserBadge → Add to user.badges
  ↓
Award XP → Send notification → Trigger celebration
```

### Badge Categories
- Learning: First Course (Bronze), Course Master (Silver), Learning Champion (Gold)
- Consistency: 7-Day Streak (Bronze), 30-Day Streak (Silver), 90-Day Streak (Gold)
- Social: First Post (Bronze), Helpful Peer (Silver), Community Leader (Gold)
- Assessment: Baseline Complete (Bronze), High Scorer (Silver), Perfect Score (Gold)

### XP System
```
Bronze: 10 XP, Silver: 25 XP, Gold: 50 XP
  ↓
Levels: 1 (0-100), 2 (101-250), 3 (251-500), 4 (501-1000), 5 (1000+)
```

### Verification
```
Public URL: /verify-badge/:badgeId
  ↓
GET /api/badges/:badgeId/verify
  ↓
Returns badge details with user info → Displays certificate
```

---

## 11. Notification System Flow

### Creation
```
Event occurs → services/notificationService.js
  ↓
Creates Notification document → Sets recipient, type, priority
  ↓
Sends email if enabled → Saves in-app notification
```

### Display
```
GET /api/notifications?userId=userId
  ↓
Returns unread/read notifications → Display in /notifications
  ↓
Click notification → Mark as read → Navigate to action link
```

### Real-time
```
Poll every 30 seconds or WebSocket event
  ↓
Update notification count → Show toast → Update bell icon
```

### Preferences
```
User toggles in settings → PATCH /api/users/:userId
  ↓
Future notifications respect preferences
```

---

## 12. Key Database Models

### User
```javascript
{
  userId, fullName, email, mobile, password, role,
  college, department, subject, status, profileImage,
  activeVisionBoardId, currentSessionId, lastLogin,
  badges: [{ badgeId, title, tier, xp, category, earnedAt }]
}
```

### Registration
```javascript
{
  userId, fullName, email, mobile, dob, gender,
  tenthDetails, twelfthDetails, higherEducation[],
  extracurricular[], workExperience[], projects[],
  certificates[], jobPreferences[], sectorPreferences,
  careerGoals, personalDevelopmentGoals,
  streakData: { streakCycleDay, streakCyclesCompleted, totalStreakDays }
}
```

### Course
```javascript
{
  courseCode, title, description, duration, banner,
  modules: [{
    title, duration, days: [{
      dayNumber, dayType, textReading, videoContent,
      tasks, steps, summaryVideo, keyTakeaways
    }],
    videos, quizzes, reflectionQuestions, handouts
  }],
  createdBy, status, enrollmentCount, completionRate
}
```

### CourseEnrollment
```javascript
{
  student, course, college, status, progress,
  moduleProgress: [{
    module, status, videoProgress[], completedTasks[],
    taskResults[], quizzesTaken[], reflectionsSubmitted[]
  }],
  preAssessmentScore, postAssessmentScore, overallScore,
  certificateIssued, completionDate, totalTimeSpent
}
```

### Assessment
```javascript
{
  assessmentCode, assessmentName, description, questionCategory,
  questions: [{ questionText, type, options, quotient, points }],
  duration, createdBy, status, randomizeQuestions, maxAttempts,
  responses: [{ user, answers, score, percentage, timeTaken }]
}
```

### Result
```javascript
{
  userId, assessmentId, assessmentCode, assessmentName,
  questionOrder, responses: [{ questionId, selectedValue, score }],
  startedAt, submittedAt, timeTaken, completionStatus,
  scores: { openness, conscientiousness, extraversion, agreeableness, neuroticism }
}
```

### CommunityPost
```javascript
{
  title, content, channelType, author, category, college, tags,
  likes, peerVotes, reactions, mentions, replies,
  views, qualityScore, isPinned, isBookmarkedBy, status,
  media, reports, moderation: { flagReason, moderatorId, resolution }
}
```

---

## 13. API Routes Structure

### Authentication
- POST /api/auth/send-signup-otp
- POST /api/auth/verify-signup-otp
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/renew-token

### Users
- GET /api/users/:id
- PATCH /api/users/:id
- GET /api/users/register-details/:email

### Courses
- GET /api/courses
- GET /api/courses/:id
- GET /api/courses/code/:code
- GET /api/courses/:courseId/modules

### Course Enrollments
- GET /api/courseEnrollments
- POST /api/courseEnrollments
- POST /api/courseEnrollments/video-progress
- POST /api/courseEnrollments/task-progress
- POST /api/courseEnrollments/task-result

### Assessments
- GET /api/assessments
- POST /api/assessments
- GET /api/results/assessment/:assessmentId/start
- POST /api/results/:resultId/submit

### Community
- GET /api/community/posts
- POST /api/community/posts
- POST /api/community/posts/:postId/like
- POST /api/community/posts/:postId/replies
- GET /api/moderation/queue

### Vision Boards
- GET /api/vision-boards-pro
- POST /api/vision-boards-pro
- PATCH /api/vision-boards-pro/:id

### AI Career Coach
- POST /api/ai-career-coach/profile/analyze
- GET /api/ai-career-coach/recommendations
- POST /api/ai-career-coach/skill-gap
- POST /api/ai-career-coach/chat

### Career Intelligence
- POST /api/career-intelligence/generate
- GET /api/career-intelligence/reports
- POST /api/career-intelligence/simulate

### Badges
- GET /api/badges
- GET /api/badges/:badgeId/verify

### Notifications
- GET /api/notifications
- PATCH /api/notifications/:id

---

## 14. Security Features

- **Password Policy**: 8+ chars, uppercase, lowercase, number, special char
- **Rate Limiting**: Login limiter (5/15min), OTP limiter
- **Account Locking**: Auto-lock after failed OTP attempts
- **Single Session**: Only one active session per user
- **Token Expiry**: JWT with configurable expiry
- **HttpOnly Cookies**: Prevents XSS
- **CORS**: Restricted to allowed origins
- **Device Fingerprinting**: Tracks device info
- **Input Validation**: express-validator on all inputs
- **Helmet**: Security headers

---

## 15. Error Handling

### Frontend
- ErrorBoundary component catches React errors
- API errors handled in api.js with timeout and retry
- User-friendly error messages via toast notifications
- 401 redirects to login with session expiry message

### Backend
- Global error handler middleware (middleware/errorMiddleware)
- 404 handler for unknown routes
- Winston logging for errors
- Graceful degradation for external API failures

---

## 16. Deployment Flow

### Development
```bash
# Backend
cd back-end
npm install
npm run dev  # nodemon server.js

# Frontend
cd front-end
npm install
npm run dev  # Vite dev server
```

### Production
```bash
# Backend
cd back-end
npm install
npm start  # node server.js

# Frontend
cd front-end
npm install
npm run build  # Vite build
# Serve dist/ with nginx or similar
```

### Environment Variables
**Backend (.env)**:
- MONGODB_URI
- JWT_SECRET
- FRONTEND_URL
- OPENAI_API_KEY
- OPENROUTER_API_KEY
- CLOUDINARY_URL
- EMAIL_SERVICE_CONFIG

**Frontend (.env)**:
- VITE_API_URL

---

## Summary

This system flows from user registration through authentication, into the dashboard where users can enroll in courses, take assessments, participate in the community, use AI career coaching, create vision boards, and earn badges. All data flows through a RESTful API to a MongoDB database, with comprehensive security, error handling, and notification systems throughout.
