# SMAART Minds - Technical Functionalities Document

**Version:** 1.0  
**Date:** January 2026  
**Platform:** SMAART Minds - Student Dashboard & Learning Management System

---

## 1. Executive Summary

SMAART Minds is a comprehensive student learning management and development platform designed to enhance educational outcomes through personalized assessments, course management, community engagement, and holistic student development tracking.

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Storage** | Local uploads + Cloudinary |
| **State Management** | React Query, Zustand |
| **UI Components** | Radix UI, Framer Motion |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Pages     │ │  Components │ │     Services        ││
│  │  (39 views) │ │ (46+ comps) │ │ (API integrations)  ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼───────────────────────────────┐
│                   BACKEND (Node.js/Express)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Routes    │ │  Middleware │ │    Controllers      ││
│  │ (32 routes) │ │ (Auth, CORS)│ │  (Business Logic)   ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────┬───────────────────────────────┘
                          │ Mongoose ODM
┌─────────────────────────▼───────────────────────────────┐
│                    MongoDB Database                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │    Users    │ │   Courses   │ │    Assessments      ││
│  │Registration │ │ Enrollment  │ │     Results         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 3. Core Functionalities

### 3.1 User Authentication & Authorization

#### 3.1.1 Features
- **OTP-Based Login**: Secure login with email OTP verification
- **First-Time Password Change**: Mandatory password change for new users
- **Role-Based Access Control**: Student, Admin, Teacher roles
- **JWT Token Management**: Secure session handling
- **Institution Selection**: Multi-tenant support for different colleges

#### 3.1.2 Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT token expiration (24 hours)
- Rate limiting on login attempts
- Session storage for client-side tokens

### 3.2 User Registration System

#### 3.2.1 Multi-Step Registration Process
| Step | Section | Fields |
|------|---------|--------|
| 1 | Personal Details | Name, Email, Mobile, DOB, Gender, Address |
| 2 | Academic Details | Course, Department, Year, Roll Number |
| 3 | Marksheets | 10th, 12th, UG/PG Semester marks |
| 4 | Certificates | Multiple certificate uploads |
| 5 | ID Proof | ID type, number, document upload |
| 6 | Password | Password creation with confirmation |

#### 3.2.2 Data Validation
- Real-time password matching indicator
- Email format validation
- Mobile number verification
- File type and size restrictions

### 3.3 Assessment System

#### 3.3.1 Available Assessments

| Code | Assessment Name | Questions | Purpose |
|------|----------------|-----------|---------|
| ASM00001 | Base Line Test | 300 | Initial student assessment |
| EQ | Emotional Quotient | Variable | Emotional intelligence |
| AIQ | Artificial Intelligence Quotient | Variable | AI aptitude |
| SQ | Social Quotient | Variable | Social skills |
| CQ | Creativity Quotient | Variable | Creative thinking |
| ARQ | Adversity Response Quotient | Variable | Resilience measurement |
| VAK | Visual-Auditory-Kinesthetic | Variable | Learning style |
| Big Five | Personality Test | Variable | OCEAN personality traits |

#### 3.3.2 Assessment Features
- **Linear Progression**: One question at a time, no backward navigation
- **Progress Persistence**: Answers saved per-question in real-time
- **Resume Capability**: Return to exact question on revisit
- **Question Shuffling**: Randomized question order per attempt
- **Timed Tests**: Optional time limits per assessment
- **Result Analytics**: Detailed scoring and category breakdown

### 3.4 Course Management

#### 3.4.1 Course Structure
```
Course
├── Module 1 (Week 1)
│   ├── Video Lessons
│   ├── Reading Materials
│   └── Tasks/Quizzes
├── Module 2 (Week 2)
│   └── ...
├── Module 3 (Week 3)
│   └── ...
└── Module 4 (Week 4)
    └── ...
```

#### 3.4.2 Features
- **Video Player**: Custom video player with progress tracking
- **Course Enrollment**: Track enrolled courses per student
- **Progress Tracking**: Module-wise completion status
- **Pathway Visualization**: Interactive learning path display
- **Certificate Generation**: Automatic certificates on completion

### 3.5 Vision Board System

#### 3.5.1 Features
- Create personalized vision boards
- Upload custom images and goals
- Gallery view of all vision boards
- Edit and update functionality
- Splash screen integration

### 3.6 Community Platform

#### 3.6.1 Features
- **Posts**: Create, edit, delete posts
- **Comments**: Nested comment system
- **Likes/Reactions**: Post engagement metrics
- **Groups**: Community group creation and management
- **Notifications**: Badge count for new posts
- **Moderation**: Content filtering and NSFW detection

### 3.7 Support Ticket System

#### 3.7.1 Ticket Categories
- Technical Issues
- Account Problems
- Course Content
- Billing Inquiries
- Feedback
- Other

#### 3.7.2 Features
- Priority levels (Low, Medium, High)
- Status workflow (Open → In Progress → Resolved → Closed)
- File attachments (max 3 files, 5MB each)
- Admin response thread
- Rate limiting (10 tickets/hour)

### 3.8 Profile Management

#### 3.8.1 User Profile Features
- Avatar customization (3D avatar system)
- Personal information display
- Academic details view
- Skills passport visualization
- Activity history tracking

### 3.9 MindCare Sessions

#### 3.9.1 Features
- Coach booking system
- Session scheduling
- Mental wellness tracking
- Quiz-based assessments
- Session history

### 3.10 Skills Passport

#### 3.10.1 Features
- Comprehensive skill tracking
- Visual skill representation
- Progress over time
- Export capabilities

---

## 4. Database Schema Overview

### 4.1 Core Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User accounts | email, password, role, registrationCompleted |
| `registrations` | Registration details | personalDetails, academicDetails, documents |
| `courses` | Course catalog | title, modules, content |
| `courseenrollments` | Student enrollments | userId, courseId, progress |
| `assessments` | Assessment definitions | code, questions, scoring |
| `results` | Assessment attempts | userId, responses, score |
| `support` | Support tickets | ticketId, status, responses |
| `communityposts` | Community content | content, author, likes |
| `visionboards` | Vision boards | userId, images, goals |

### 4.2 Result Collections

| Collection | Assessment Type |
|------------|-----------------|
| `baselineresults` | Base Line Test T1 |
| `eqresults` | Emotional Quotient |
| `aiqresults` | AI Quotient |
| `sqresults` | Social Quotient |
| `cqresults` | Creativity Quotient |
| `arqresults` | Adversity Response |
| `vakresults` | Learning Style |
| `big5results` | Big Five Personality |

---

## 5. API Endpoints Summary

### 5.1 Authentication Routes
```
POST /api/auth/login          - User login with email
POST /api/auth/verify-otp     - OTP verification
POST /api/auth/register       - New user registration
POST /api/auth/first-login-change-password - Password reset
```

### 5.2 User Routes
```
GET  /api/users/:id           - Get user details
PUT  /api/users/:id           - Update user
POST /api/users/register-details - Save registration
GET  /api/users/register-details/:email - Get registration
```

### 5.3 Assessment Routes
```
GET  /api/assessments/:id/start    - Start assessment
POST /api/results/save-answer      - Save individual answer
POST /api/results/:id/submit       - Submit assessment
GET  /api/results/user/:userId     - Get user results
```

### 5.4 Course Routes
```
GET  /api/courses                  - List all courses
GET  /api/courses/:id              - Get course details
POST /api/courseenrollments        - Enroll in course
PUT  /api/courseenrollments/:id    - Update progress
```

### 5.5 Ticket Routes
```
POST /api/tickets                  - Create ticket
GET  /api/tickets                  - Get user's tickets
GET  /api/tickets/all              - Get all (admin)
PUT  /api/tickets/:id              - Update ticket
POST /api/tickets/:id/response     - Add response
```

---

## 6. Security Implementation

### 6.1 Authentication Security
- JWT tokens with 24-hour expiry
- HTTP-only cookie options
- CORS configuration for API access
- Rate limiting on sensitive endpoints

### 6.2 Data Security
- Password hashing (bcrypt, 12 rounds)
- Input sanitization
- SQL injection prevention (NoSQL)
- XSS protection
- File upload validation

### 6.3 Authorization
- Role-based middleware
- Resource ownership verification
- Admin-only route protection

---

## 7. Performance Optimizations

### 7.1 Frontend
- Code splitting with React.lazy
- Image optimization
- Caching with React Query
- Debounced search inputs

### 7.2 Backend
- Database indexing on frequently queried fields
- Pagination for list endpoints
- Compound indexes for complex queries
- Connection pooling

---

## 8. Third-Party Integrations

| Service | Purpose |
|---------|---------|
| Cloudinary | Image/file storage |
| MongoDB Atlas | Cloud database (optional) |
| Lottie Files | Animations |
| MediaPipe | Vision/ML features |
| TensorFlow.js | AI features |

---

## 9. Environment Configuration

### 9.1 Required Environment Variables

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/minds_db
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000
```

---

## 10. Deployment Requirements

### 10.1 System Requirements
- Node.js v14 or higher
- MongoDB 4.4 or higher
- 2GB RAM minimum
- 10GB storage minimum

### 10.2 Production Considerations
- Use MongoDB Atlas for production
- Enable HTTPS
- Set up proper CORS origins
- Implement logging and monitoring
- Regular database backups

---

**Document End**

*This document provides a comprehensive overview of the SMAART Minds platform technical functionalities. For specific implementation details, refer to the respective component documentation.*
