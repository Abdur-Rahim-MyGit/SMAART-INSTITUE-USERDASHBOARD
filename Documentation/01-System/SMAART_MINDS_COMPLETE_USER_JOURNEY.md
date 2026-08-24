# SMAART Minds Platform: Complete End-to-End User Journey

**Version**: 1.0  
**Last Updated**: February 3, 2026  
**Document Type**: Comprehensive User Flow & System Architecture

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Phase 1: Access & Authorization](#phase-1-access--authorization)
3. [Phase 2: Onboarding & Student DNA](#phase-2-onboarding--student-dna)
4. [Phase 3: T1 Baseline Assessment](#phase-3-t1-baseline-assessment)
5. [Phase 4: Dashboard & Core Tools](#phase-4-dashboard--core-tools)
6. [Phase 5: Learning Journey](#phase-5-learning-journey)
7. [Phase 6: Advanced Assessments](#phase-6-advanced-assessments)
8. [Phase 7: Certification & Recognition](#phase-7-certification--recognition)
9. [Technical Architecture](#technical-architecture)
10. [System Features Summary](#system-features-summary)

---

## 🎯 Platform Overview

**SMAART Minds** is a comprehensive learning management and assessment platform designed for educational institutions. It combines multi-quotient assessments, personalized learning paths, and career readiness tools to create a holistic student development ecosystem.

### Core Philosophy
- **Student-Centric**: Every feature is designed around student growth and success
- **Data-Driven**: Decisions based on comprehensive assessment data
- **Career-Ready**: Focus on employability and real-world skills
- **Holistic Development**: Cognitive, emotional, social, and professional growth

---

## Phase 1: Access & Authorization

**Goal**: Secure, institution-specific entry for legitimate students only.

### 1.1 Landing Page Experience

**Entry Point**: User arrives at the SMAART Minds landing page

**Key Elements**:
- Platform introduction and value proposition
- Institution partner logos
- "Get Started" call-to-action
- Feature highlights (Assessments, Courses, Certification)

### 1.2 Institution Selection (Mandatory)

**Process**:
1. User clicks "Get Started" or "Login"
2. **Institution Selection Modal** appears
3. User **must** select their college/institution from verified partner list
4. System validates institution partnership status

**Constraints**:
- ❌ Cannot proceed without valid institution selection
- ❌ Login restricted to selected institution's domain
- ✅ Only verified partner institutions appear in list
- ✅ Institution data pre-populates certain profile fields

**Technical Implementation**:
```javascript
// Institution validation
const selectedInstitution = sessionStorage.getItem('selectedInstitution');
if (!selectedInstitution) {
  navigate('/institution-selection');
  return;
}
```

### 1.3 First-Time Login Flow

**Step 1: Credential Entry**
- **Student ID** (or Username) - Provided by institution
- **Temporary Password** - Provided by institution admin
- "Remember Me" option
- "Forgot Password" link

**Step 2: OTP Verification**
1. System validates credentials against database
2. Time-Based OTP sent to registered email/mobile
3. User enters 6-digit OTP code
4. 5-minute expiration window
5. "Resend OTP" option available after 60 seconds

**Security Features**:
- Account lockout after 5 failed attempts
- Rate limiting on OTP requests
- Session tracking for security audit

**Step 3: Mandatory Password Change**
1. System detects first-time login flag
2. **Forces** password change before proceeding
3. Password requirements enforced:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 number
   - At least 1 special character
4. Password strength indicator shown
5. Confirmation password field

**Outcome**: 
- ✅ Account secured with personal password
- ✅ First-time login flag cleared
- ✅ Access granted to Onboarding phase

### 1.4 Forgot Password Flow

**Process**:
1. User clicks "Forgot Password"
2. Enters Student ID or Email
3. OTP sent to registered contact
4. User verifies OTP
5. Creates new password
6. Confirmation email sent

---

## Phase 2: Onboarding & "Student DNA"

**Goal**: Build comprehensive student profile for personalized experience.

### 2.1 Profile Wizard Overview

**Introduction Screen**:
- Welcome message
- Explanation of profile importance
- Progress indicator (12 steps)
- Estimated completion time: 15-20 minutes
- "You're good to go! Only a few steps left to get you career ready."

### 2.2 The 12-Step Profile Journey

#### **Step 1: Profile Photo**
- Upload professional image
- Max file size: 5MB
- Accepted formats: JPG, PNG
- Image preview with crop tool
- Cloudinary integration for storage

#### **Step 2: Personal Details**
**Fields**:
- Full Name (pre-filled from registration)
- Nickname/Preferred Name *
- Date of Birth * (Age validation: minimum 16 years)
- Gender * (Male/Female/Other)
- Mobile Number (pre-filled if available)
- Email (pre-filled, read-only)
- Institution (pre-filled from selection)
- Department
- Current Year of Study *
- Expected Year of Passing *
- Education Level/Domain * (UG Engineering, PG Engineering, UG Non-Engineering, PG Non-Engineering)

**Validations**:
- DOB cannot be in future
- Year of Passing must be after Year of Study
- All required fields must be filled

#### **Step 3: 10th Standard Details**
**Fields**:
- School Name *
- Year of Passing *
- Percentage/CGPA *
- Board (CBSE/ICSE/State/Other)
- Upload Marksheet * (PDF/Image)

**Validations**:
- Percentage: 0-100 range
- Year must be logical relative to DOB

#### **Step 4: 12th Standard Details**
**Fields**:
- School/College Name *
- Stream * (Science/Commerce/Arts)
- Year of Passing *
- Percentage/CGPA *
- Board
- Upload Marksheet * (PDF/Image)

#### **Step 5: Higher Education**
**Dynamic Multi-Entry** (Add multiple degrees):

For each degree:
- Qualification Level * (UG/PG/PhD)
- Degree Name * (B.Tech, M.Tech, BBA, etc.)
- Specialization/Branch *
- Institution Name *
- University *
- Year of Passing *
- CGPA/Percentage * (0-100 scale)
- Degree Status * (Pursuing/Completed)
- Upload Certificate *

**Features**:
- Add multiple degrees
- Remove degree entries
- Validation for each entry

#### **Step 6: Extra-Curricular Activities**
**Optional Section** (Can mark as "Not Applicable"):

For each activity:
- Activity Type (Sports/Cultural/Technical/Social Service)
- Description
- Level (School/College/State/National/International)
- Achievements/Awards
- Duration/Year

**Features**:
- Add multiple activities
- Remove entries
- Skip if not applicable

#### **Step 7: Job Preferences**
**Up to 4 Preferences**:

For each preference:
- Preferred Job Role *
- Job Type * (Full-Time/Internship/Part-Time)
- Preferred Location *
- Willing to Relocate * (Yes/No)
- Expected Salary Range * (0-3 LPA, 3-5 LPA, 5-8 LPA, 8-12 LPA, 12-18 LPA, 18-25 LPA, 25+ LPA)

#### **Step 8: Sector Preferences**
**Multi-Select Options**:
- IT/Software
- Core Engineering
- Finance
- Consulting
- Marketing
- Data Science
- Education
- Healthcare
- Government
- Startups
- Other (with text input)

**Validations**:
- At least 1 sector must be selected
- If "Other" selected, specification required

#### **Step 9: Career Goals**
**Three Time Horizons**:

1. **Short-term Goal (0-1 year)** *
   - Textarea with example placeholder
   - Example: "Secure a software developer role in a product-based company and master React by end of 2024."

2. **Medium-term Goal (1-3 years)** *
   - Example: "Become a Senior Developer, lead a small team, and contribute to open source projects."

3. **Long-term Goal (3-5 years)** *
   - Example: "Start my own tech venture solving educational problems or become a Solution Architect."

#### **Step 10: Work Experience**
**Optional Section**:

For each experience:
- Experience Type * (Internship/Full-Time/Part-Time/Freelance)
- Organization Name *
- Job Title *
- Industry *
- Start Date *
- End Date (or "Currently Working" checkbox)
- Description *
- Upload Certificate/Offer Letter *
- GitHub/Portfolio Link (optional)

#### **Step 11: Projects**
**Optional Section**:

For each project:
- Project Title *
- Done In * (College/Company/Personal)
- Institution/Company Name (conditional)
- Team Type * (Individual/Team)
- Start Date *
- End Date (or "Ongoing" checkbox)
- Description *
- Project URL/GitHub Link (optional)
- Technologies Used

#### **Step 12: Certifications**
**Optional Section**:

For each certificate:
- Certificate Title *
- Issuing Organization *
- Year of Completion
- Verification Type * (URL/QR Code/None)
- Verification URL (if URL selected)
- Upload Certificate File *

### 2.3 Profile Submission

**Process**:
1. User clicks "Submit Registration"
2. Loading animation displays
3. Data sent to `/api/users/register-details`
4. Files uploaded to Cloudinary
5. Profile saved to database

**Success Screen**:
- ✅ "Profile 100% Completed!" animation
- Checkmark icon with scale animation
- "Redirecting to assessment..." message
- 3-second countdown

**Critical Backend Update**:
```javascript
// Update session storage to prevent redirect loop
const currentUser = JSON.parse(sessionStorage.getItem('user'));
currentUser.hasRegistration = true;
currentUser.registrationCompleted = true;
sessionStorage.setItem('user', JSON.stringify(currentUser));
```

**Auto-Redirect**: After 3 seconds → T1 Baseline Assessment

---

## Phase 3: T1 Baseline Assessment

**Goal**: Establish the student's starting point across 6 key quotients.

### 3.1 Assessment Overview

**Assessment Code**: `ASM00001`  
**Assessment Name**: T1 Baseline Test  
**Question Count**: 36 Questions  
**Duration**: Untimed (minimum 5 seconds per question)  
**Question Selection**: Stratified Sampling across 6 quotients

### 3.2 The 6 Quotients Measured

1. **CRQ - Cognitive Readiness Quotient** (7 questions)
   - 🧠 Critical thinking & logical reasoning
   - Problem-solving abilities
   - Analytical skills

2. **SRQ - Self-Regulation & Drive Quotient** (6 questions)
   - ❤️ Motivation & resilience
   - Emotional control
   - Self-discipline

3. **LQ - Learning Agility Quotient** (6 questions)
   - 📚 Adaptability
   - Continuous learning mindset
   - Knowledge acquisition speed

4. **SIQ - Social Interaction Quotient** (6 questions)
   - 🤝 Collaboration skills
   - Empathy & communication
   - Teamwork abilities

5. **PEQ - Professional Execution Quotient** (7 questions)
   - 💼 Work ethic
   - Reliability & delivery
   - Professional conduct

6. **DAQ - Digital & AI Literacy Quotient** (4 questions)
   - 💻 Tech proficiency
   - AI readiness
   - Digital tool mastery

### 3.3 Assessment Experience

**Welcome Screen**:
- Assessment instructions
- Proctoring rules explained
- "Start Assessment" button

**Question Interface**:
- Clean, distraction-free design
- Question counter (e.g., "Question 5/36")
- Progress bar (based on answered questions)
- 4 multiple-choice options (A, B, C, D)
- Timer display (seconds elapsed)
- Selected answer highlighted

**Navigation Rules**:
- ✅ Can select/change answer anytime
- ✅ "Next" button enabled after 5-second minimum
- ❌ Cannot go back to previous questions (disabled)
- ✅ Can submit anytime (no forced completion)

**Proctoring Features** (Anti-Cheat):
1. **Right-click disabled** - Context menu blocked
2. **Copy/Paste disabled** - Clipboard actions prevented
3. **Screenshot detection** - PrintScreen key blocked
4. **Tab switching detection** - Warns if user leaves window
5. **Warning system**: 
   - 3 warnings maximum
   - Auto-submit after 3rd violation
6. **Exit prevention** - Browser back button blocked

### 3.4 Scoring & Calculation

**Real-Time Processing**:
```javascript
// For each question answered
isCorrect = (selectedAnswer === correctAnswer);
score = isCorrect ? 1 : 0;

// Quotient-wise aggregation
quotientScores = {
  CRQ: { earned: 5, total: 7 },  // 5 correct out of 7
  SRQ: { earned: 3, total: 6 },
  // ... etc
};

// Calculate percentages
CRQ_percentage = (5/7) × 100 = 71%

// Determine band for each quotient
if (percentage >= 81) → Advanced
if (percentage >= 61) → Strong
if (percentage >= 41) → Progressing
if (percentage >= 21) → Developing
else → Emerging

// Calculate baseline score (S_baseline)
baselineScore = average(all quotient percentages)
stageBand = determineBand(baselineScore)
```

**Band Classification System**:
```
🏆 Advanced    (81-100%) - Exceptional mastery
💪 Strong      (61-80%)  - Solid competence
📈 Progressing (41-60%)  - Developing skills
🌱 Developing  (21-40%)  - Early stage
🌟 Emerging    (0-20%)   - Beginning journey
```

### 3.5 Results Display

**Results Screen Layout**:

**Header Section**:
- ✨ "Baseline Established" title
- Rotating checkmark animation
- "This is your starting profile" subtitle

**Baseline Score Card**:
- Large display: "54/100"
- Stage Band badge: "PROGRESSING"
- Reference note: "Average across all quotients • Stored as S_baseline"
- Gradient background with animations

**Quotient Breakdown Grid** (2x3 layout):

Each quotient card shows:
- Icon (🧠 ❤️ 📚 🤝 💼 💻)
- Quotient code (CRQ, SRQ, etc.)
- Full name
- Description
- Large percentage score (e.g., "71%")
- Band level badge
- Performance ratio (e.g., "5/7 correct")
- Animated progress bar with threshold markers (20%, 40%, 60%, 80%)

**Band Legend**:
- All 5 levels displayed with icons and ranges
- Color-coded for easy reference

**Action Buttons**:
1. **📥 Download Report** - Generates detailed text file
2. **🏠 Go to Dashboard** - Navigate to main dashboard
3. **📋 All Assessments** - View other available tests

### 3.6 Download Report Content

**Report Format**: Plain text file with ASCII art formatting

**Report Sections**:
1. Header with student details
2. Baseline Readiness Index (score + band)
3. Quotient-wise breakdown (all 6 quotients)
4. Band classification system
5. Next steps and recommendations
6. Report metadata (ID, timestamp)

**File Name**: `FinalMinds_T1_Baseline_[StudentID]_[Timestamp].txt`

### 3.7 Database Storage

**Collection**: `BaseLineResult`

**Document Structure**:
```json
{
  "_id": "...",
  "userId": "ObjectId",
  "resultId": "ObjectId",
  "baselineScore": 54,
  "stageBand": "Progressing",
  "t1Profile": {
    "CRQ": {
      "rawScore": 71,
      "level": "Strong",
      "earned": 5,
      "possible": 7
    },
    "SRQ": { ... },
    "LQ": { ... },
    "SIQ": { ... },
    "PEQ": { ... },
    "DAQ": { ... }
  },
  "score": 24,
  "totalScore": 36,
  "percentage": 67,
  "assessmentType": "T1_BASELINE",
  "createdAt": "2026-01-27T...",
  "updatedAt": "2026-01-27T..."
}
```

---

## Phase 4: Dashboard & Core Tools

**Goal**: Central hub for daily engagement, progress tracking, and productivity tools.

### 4.1 First Dashboard Experience

**Vision Board Splash** (First-time login only):
- 3-second motivational animation
- Vision board imagery
- Smooth fade-in/fade-out
- Sets tone for platform experience
- Flag stored in `sessionStorage.visionSplashShown`

### 4.2 Dashboard Home Layout

**Hero Section** (Top Banner):
- Dark blue gradient background (#002147)
- Decorative pattern overlay
- Welcome message: "Welcome back, [FirstName]! 👋"
- Daily streak badge: "Daily Streak: 12 Days"
- Progress update: "You've completed 80% of your weekly goal"
- Call-to-action: "Resume Learning" button
- Motivational message about current module

**Left Column** (Main Content):

1. **Continue Learning Card**:
   - Featured course thumbnail
   - Video preview with play button
   - Course title and description
   - Module progress indicators
   - Completed modules (green checkmark)
   - Current module (highlighted)
   - Classmate avatars
   - "View Classmates" link

2. **Quick Access Grid** (5-6 icons):
   - My Notes
   - Resources (Library)
   - Discussions (Community)
   - Mentors
   - Support
   - Retest Baseline (Dev tool)

**Right Column** (Sidebar):

1. **Calendar Widget**:
   - Current month display
   - Month navigation (prev/next)
   - Day grid with date numbers
   - Today highlighted
   - Selected date highlighted
   - Event indicators (dots on dates with tasks)
   - Interactive date selection

2. **Active Tasks Panel**:
   - Task count badge
   - "Add Task" button
   - Task list with:
     - Time/deadline
     - Task title
     - Status indicator (pending/completed)
     - Completion checkbox
     - Delete button (on hover)
   - Real-time sync with backend
   - Filter tabs: All/Progress/Done

3. **Upgrade Card** (Premium):
   - Purple gradient background
   - Award icon
   - "Unlock Premium" message
   - Feature highlights
   - "Upgrade Now" button

### 4.3 Vision Boards Feature

**Purpose**: Goal visualization and aspiration tracking

**Access**: Dashboard → Vision Boards

**Features**:
- Create personal vision boards
- Add images, text, goals
- Categorize by timeframe (short/medium/long-term)
- Share with mentors (optional)
- Progress tracking against vision
- Motivational quotes integration

**Board Types**:
1. Career Vision
2. Academic Goals
3. Personal Development
4. Financial Goals
5. Custom Boards

### 4.4 SMAART Toolkit

**Full Name**: Specific, Measurable, Achievable, Action-oriented, Relevant, Time-bound Toolkit

**Access**: Dashboard → SMAART Toolkit

**Tools Included**:

1. **Goal Setting Framework**:
   - SMAART goal template
   - Goal breakdown wizard
   - Milestone tracking
   - Progress visualization

2. **Weekly Planner**:
   - 7-day view
   - Time blocking
   - Task prioritization
   - Habit tracking

3. **Monthly Planner**:
   - Calendar view
   - Goal alignment
   - Review checkpoints
   - Achievement tracking

4. **SWOT Analysis Tool**:
   - Strengths assessment
   - Weaknesses identification
   - Opportunities exploration
   - Threats analysis
   - Action plan generation

5. **Time Management Matrix**:
   - Urgent/Important quadrants
   - Task categorization
   - Priority recommendations

6. **Reflection Journal**:
   - Daily/weekly reflections
   - Learning logs
   - Growth tracking
   - Gratitude practice

### 4.5 Other Dashboard Features

**My Assessments**:
- List of all available assessments
- Completion status
- Scores and results
- Retake options
- Assessment history

**Skills Passport**:
- Consolidated view of all assessment results
- Growth tracking (T1 → T2 → T3 → T4)
- Skill visualization
- Downloadable portfolio

**Community**:
- Discussion forums
- Study groups
- Peer connections
- Mentor interactions

**Support**:
- Help center
- Support tickets
- FAQ section
- Live chat (if available)

**Mind Care Sessions**:
- Mental wellness resources
- Counseling booking
- Stress management tools
- Well-being tracking

---

## Phase 5: Learning Journey

**Goal**: Skill acquisition through structured, engaging course pathways.

### 5.1 My Courses Overview

**Access**: Dashboard → My Courses

**Course Pathway Display**:
- Visual roadmap of courses
- Locked/unlocked status based on:
  - T1 Baseline results
  - Prerequisite completion
  - Institution enrollment
- Progress indicators
- Estimated completion time
- Skill tags

### 5.2 Course Structure

**3-Day Learning Framework**:

Each course module follows a proven 3-day structure:

#### **Day 1: Cognitive Priming**
**Goal**: Orient and engage the learner

**Steps**:
- **Step 0**: Skill Orientation (2 min video)
  - What is the skill?
  - Why is it important?
  - Real-world applications
  
- **Step 1**: Story Episode (12 min video)
  - Narrative-based learning
  - Relatable scenarios
  - Problem introduction

#### **Day 2: Framework Application**
**Goal**: Teach the framework and apply it

**Steps**:
- **Step 2**: Framework Explanation (10 min video)
  - Core concepts
  - Step-by-step methodology
  - Visual diagrams
  
- **Step 3**: Domain-Specific Scenario (8 min video)
  - Engineering example
  - Business example
  - Healthcare example
  - (Based on student's domain)

#### **Day 3: Integration & Mastery**
**Goal**: Assess, reflect, and internalize

**Steps**:
- **Step 4**: Assessment Quiz
  - MCQ questions
  - Scenario-based questions
  - Immediate feedback
  
- **Step 5**: Evidence Submission
  - Upload work sample
  - Project demonstration
  - Peer review
  
- **Step 6**: Reflection Exercise
  - What did you learn?
  - How will you apply it?
  - Personal insights
  
- **Step 7**: Flashcard Review
  - Key concepts
  - Spaced repetition
  - Quick recall practice
  
- **Step 8**: Skill Mapping
  - Add to Skills Passport
  - LinkedIn integration
  - Resume builder
  
- **Step 9**: Next Steps
  - Related skills
  - Advanced modules
  - Career pathways

### 5.3 Module View Page

**Layout**:

**Left Sidebar**:
- Module list
- Day navigation
- Progress indicators
- Completion checkmarks

**Main Content Area**:
- Video player (primary)
- Video title and description
- Progress tracking
- Playback controls
- Transcription (if available)

**Right Sidebar**:
- Tasks/Assignments
- Resources
- Notes section
- Discussion thread

### 5.4 Video Player Features

**Functionality**:
- ✅ Play/Pause
- ✅ Volume control
- ✅ Playback speed (0.5x, 1x, 1.5x, 2x)
- ✅ Fullscreen mode
- ✅ Progress bar with seek
- ✅ Auto-save watch position
- ✅ Resume from last position
- ✅ Completion tracking (80% threshold)
- ✅ Prevent skipping (optional)

**Progress Tracking**:
```javascript
// Saves every 5 seconds
onProgressUpdate = (currentTime, isCompleted, duration) => {
  courseEnrollmentAPI.updateVideoProgress({
    moduleId,
    dayId,
    watchedTime: currentTime,
    completed: isCompleted,
    duration: duration
  });
};
```

**Video Sources**:
- Cloudinary hosted videos
- YouTube embeds
- Vimeo integration
- Direct MP4 links

### 5.5 Tasks & Assignments

**Task Types**:
1. **Multiple Choice Questions (MCQ)**
   - 4 options
   - Single correct answer
   - Immediate feedback
   - Points awarded

2. **Subjective Questions**
   - Text area input
   - File upload option
   - Manual grading by instructor

3. **Project Submissions**
   - File upload
   - URL submission
   - GitHub repository link
   - Rubric-based grading

4. **Peer Review**
   - Review others' work
   - Provide feedback
   - Earn points for quality reviews

**Task Completion Flow**:
1. View task description
2. Submit answer/file
3. Receive confirmation
4. Get feedback (auto or manual)
5. Points added to profile
6. Progress updated

### 5.6 Course Completion

**Requirements**:
- ✅ All videos watched (80%+ completion)
- ✅ All tasks submitted
- ✅ Minimum score achieved (if applicable)
- ✅ Final assessment passed

**Completion Rewards**:
- Certificate of completion
- Skill badges
- Points/Credits
- Unlock next course
- LinkedIn shareable credential

---

## Phase 6: Advanced Assessments

**Goal**: Deep profiling across multiple psychological and cognitive dimensions.

### 6.1 Assessment Suite

Beyond T1 Baseline, students can take:

1. **Big Five Personality Assessment**
   - Extraversion
   - Agreeableness
   - Conscientiousness
   - Neuroticism
   - Openness
   - Emotional Stability (derived)

2. **VAK Learning Style**
   - Visual learner score
   - Auditory learner score
   - Kinesthetic learner score
   - Dominant style identification

3. **EQ - Emotional Intelligence**
   - Self-awareness
   - Self-regulation
   - Motivation
   - Empathy
   - Social skills

4. **CQ - Creativity Quotient**
   - Divergent thinking
   - Originality
   - Flexibility
   - Elaboration

5. **SQ - Spiritual Quotient**
   - Purpose and meaning
   - Values alignment
   - Transcendence
   - Compassion

6. **ARQ - Adaptability & Resilience**
   - Change adaptability
   - Stress resilience
   - Recovery speed
   - Growth mindset

7. **AIQ - AI Literacy Quotient**
   - AI knowledge
   - AI tool usage
   - AI critical thinking
   - AI ethics awareness
   - AI self-efficacy

### 6.2 Skills Passport

**Purpose**: Consolidated view of all assessment results over time

**Features**:
- Timeline view (T1, T2, T3, T4)
- Growth charts
- Quotient comparisons
- Skill badges
- Downloadable PDF
- Shareable link
- LinkedIn integration

**Data Displayed**:
- All assessment scores
- Band progressions
- Skill acquisitions
- Course completions
- Certifications earned
- Projects completed

---

## Phase 7: Certification & Recognition

**Goal**: Recognize achievement and provide verifiable credentials.

### 7.1 Certificate Generation

**Trigger**: Course/Program completion

**Certificate Details**:
- Student name
- Course/Program title
- Completion date
- Institution name
- Unique certificate ID
- QR code for verification
- Digital signature
- SMAART Minds branding

**Format Options**:
- PDF download
- PNG image
- Shareable link
- LinkedIn credential

### 7.2 Certificate Verification

**Public Verification Page**:
- Access via QR code or URL
- Enter certificate ID
- View certificate details
- Verify authenticity
- Check issue date
- See issuing institution

**Security Features**:
- Blockchain-backed (optional)
- Tamper-proof
- Timestamped
- Cryptographic signature

### 7.3 Achievement Badges

**Badge System**:
- Course completion badges
- Skill mastery badges
- Assessment excellence badges
- Streak badges
- Community contribution badges

**Display**:
- Profile page
- Skills Passport
- Shareable on social media
- Embeddable on websites

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **3D Graphics**: Three.js + React Three Fiber

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + OTP-based login
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Winston + Morgan

### Key API Endpoints

**Authentication**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/verify-login-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

**Users**:
- `POST /api/users/register-details` - Complete profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

**Assessments**:
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/code/:code` - Get by code
- `POST /api/results/start` - Start assessment
- `POST /api/results/:resultId/answer` - Save answer
- `POST /api/results/:resultId/submit` - Submit assessment

**Courses**:
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/course-enrollment` - Enroll in course
- `PUT /api/course-enrollment/video-progress` - Update video progress
- `PUT /api/course-enrollment/task-progress` - Update task progress

**Certificates**:
- `GET /api/certificates/:userId` - Get user certificates
- `GET /api/certificates/verify/:certificateId` - Verify certificate

---

## System Features Summary

### ✅ Implemented Features

**Authentication & Security**:
- ✅ JWT-based authentication
- ✅ OTP verification
- ✅ Password encryption (bcrypt)
- ✅ Session management
- ✅ Rate limiting
- ✅ Account lockout
- ✅ Forced password change

**Profile Management**:
- ✅ 12-step comprehensive profile
- ✅ File upload (Cloudinary)
- ✅ Profile photo
- ✅ Academic history
- ✅ Work experience
- ✅ Projects
- ✅ Certifications

**T1 Baseline Assessment**:
- ✅ 36-question stratified sampling
- ✅ 6 quotient measurement
- ✅ Real-time scoring
- ✅ 5-band classification
- ✅ Beautiful results display
- ✅ Downloadable report
- ✅ Database persistence

**Dashboard**:
- ✅ Vision board splash
- ✅ Hero section
- ✅ Daily streaks
- ✅ Calendar widget
- ✅ Active tasks
- ✅ Quick access grid

**Learning Management**:
- ✅ Course pathway
- ✅ Module structure
- ✅ Video player
- ✅ Progress tracking
- ✅ Task system
- ✅ 3-day framework support

**Advanced Assessments**:
- ✅ Big Five Personality
- ✅ VAK Learning Style
- ✅ EQ, CQ, SQ, ARQ, AIQ
- ✅ Skills Passport

**Certification**:
- ✅ Certificate generation
- ✅ QR code verification
- ✅ PDF download
- ✅ Public verification page

---

## Complete User Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     SMAART MINDS USER JOURNEY                   │
└─────────────────────────────────────────────────────────────────┘

1. LANDING PAGE
   └─→ View platform introduction

2. INSTITUTION SELECTION
   └─→ Select college from verified list

3. LOGIN
   ├─→ Enter Student ID + Temporary Password
   ├─→ Receive OTP
   ├─→ Verify OTP
   └─→ Force Password Change

4. PROFILE ONBOARDING (12 Steps)
   ├─→ Profile Photo
   ├─→ Personal Details
   ├─→ 10th Grade
   ├─→ 12th Grade
   ├─→ Higher Education
   ├─→ Activities
   ├─→ Job Preferences
   ├─→ Sector Preferences
   ├─→ Career Goals
   ├─→ Work Experience
   ├─→ Projects
   └─→ Certifications

5. T1 BASELINE ASSESSMENT
   ├─→ 36 Questions (6 Quotients)
   ├─→ Real-time scoring
   ├─→ Results display
   └─→ Download report

6. DASHBOARD
   ├─→ Vision Board Splash
   ├─→ Welcome Hero
   ├─→ Continue Learning
   ├─→ Calendar & Tasks
   └─→ Quick Access Tools

7. SMAART TOOLKIT
   ├─→ Vision Boards
   ├─→ Goal Setting
   ├─→ Weekly/Monthly Planners
   ├─→ SWOT Analysis
   └─→ Reflection Journal

8. MY COURSES
   ├─→ Course Pathway
   ├─→ Module Selection
   └─→ 3-Day Learning Framework
       ├─→ Day 1: Cognitive Priming
       ├─→ Day 2: Framework Application
       └─→ Day 3: Integration & Mastery

9. VIDEO LEARNING
   ├─→ Watch videos
   ├─→ Track progress
   ├─→ Complete tasks
   └─→ Submit assignments

10. ADVANCED ASSESSMENTS
    ├─→ Big Five Personality
    ├─→ VAK Learning Style
    ├─→ EQ, CQ, SQ, ARQ, AIQ
    └─→ Skills Passport

11. CERTIFICATION
    ├─→ Complete courses
    ├─→ Generate certificate
    ├─→ Download PDF
    └─→ Verify online

12. CONTINUOUS ENGAGEMENT
    ├─→ Community discussions
    ├─→ Mind Care sessions
    ├─→ Support tickets
    └─→ Progress tracking
```

---

## Document Metadata

**Created**: February 3, 2026  
**Version**: 1.0  
**Author**: SMAART Minds Development Team  
**Status**: Complete & Production-Ready  
**Next Review**: March 2026

---

**End of Document**
