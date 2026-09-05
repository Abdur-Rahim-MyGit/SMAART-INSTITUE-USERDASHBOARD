# SMAART Minds - System Flow Documentation

**Version:** 1.0  
**Date:** January 2026  
**Platform:** SMAART Minds - Student Dashboard & Learning Management System

---

## 1. Overview

This document describes the complete user flow and data flow throughout the SMAART Minds platform, covering all major user journeys from registration to course completion.

---

## 2. User Journey Flows

### 2.1 First-Time User Registration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       REGISTRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

[Landing Page] → [Sign Up Tab] → [Initial Registration]
                                          ↓
                               ┌──────────────────────┐
                               │ Enter Basic Details  │
                               │ • Full Name          │
                               │ • Email              │
                               │ • Mobile Number      │
                               └──────────┬───────────┘
                                          ↓
                   ┌──────────────────────────────────────────┐
                   │        MULTI-STEP REGISTRATION           │
                   ├──────────────────────────────────────────┤
                   │ Step 1: Personal Details                 │
                   │   → Name, DOB, Gender, Address           │
                   │                                          │
                   │ Step 2: Academic Details                 │
                   │   → Course, Department, Year, Roll No.   │
                   │                                          │
                   │ Step 3: Marksheets                       │
                   │   → 10th, 12th, UG/PG marks upload       │
                   │                                          │
                   │ Step 4: Certificates                     │
                   │   → Upload multiple certificates         │
                   │                                          │
                   │ Step 5: ID Proof                         │
                   │   → ID type, number, document upload     │
                   │                                          │
                   │ Step 6: Password Setup                   │
                   │   → Create password, confirm password    │
                   └──────────────────┬───────────────────────┘
                                      ↓
                            [Submit Registration]
                                      ↓
                         ┌────────────────────────┐
                         │   Backend Processing   │
                         │ • Create User record   │
                         │ • Hash password        │
                         │ • Save registration    │
                         │ • Set status: pending  │
                         └───────────┬────────────┘
                                     ↓
                            [Success Page]
                                     ↓
                           [Redirect to Login]
```

---

### 2.2 User Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

[Login Page] → [Enter Email]
                     ↓
            [Click Request OTP]
                     ↓
         ┌───────────────────────┐
         │   Backend Process     │
         │ • Verify user exists  │
         │ • Generate OTP        │
         │ • Send OTP to email   │
         │ • Store OTP with TTL  │
         └───────────┬───────────┘
                     ↓
            [Enter OTP Modal]
                     ↓
            [Submit OTP]
                     ↓
         ┌───────────────────────┐
         │   OTP Verification    │
         │ • Compare OTP         │
         │ • Check expiration    │
         │ • Validate user       │
         └───────────┬───────────┘
                     ↓
              ┌──────┴──────┐
              │             │
         [First Time]  [Returning]
              │             │
              ↓             ↓
    [Change Password]  [Dashboard]
              │
              ↓
    [Set New Password]
              │
              ↓
    [Force Re-login]
              │
              ↓
    [Login with New Password]
              │
              ↓
      [Check Registration]
              │
        ┌─────┴─────┐
        │           │
   [Complete]  [Incomplete]
        │           │
        ↓           ↓
   [Dashboard] [Registration Form]
```

---

### 2.3 Assessment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ASSESSMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

[Dashboard] → [My Assessments]
                    ↓
         ┌──────────────────────┐
         │  Assessment Guard     │
         │ Check if Base Line   │
         │ Test is completed    │
         └──────────┬───────────┘
                    ↓
           ┌───────┴───────┐
           │               │
    [Not Completed]   [Completed]
           │               │
           ↓               ↓
    [Redirect to      [Show All
     Base Line Test]   Assessments]
                           ↓
                    [Select Assessment]
                           ↓
             ┌─────────────────────────┐
             │   Start Assessment      │
             │ POST /assessment/start  │
             └───────────┬─────────────┘
                         ↓
       ┌─────────────────────────────────────┐
       │         Backend Process              │
       │ • Check for in-progress session     │
       │ • If new: shuffle questions         │
       │ • If resuming: restore order        │
       │ • Return questions & responses      │
       └─────────────────┬───────────────────┘
                         ↓
              [Display Questions]
                         ↓
    ┌─────────────────────────────────────────┐
    │           QUESTION LOOP                  │
    ├─────────────────────────────────────────┤
    │  ┌───────────────────┐                  │
    │  │ Show Question     │                  │
    │  │ (one at a time)   │                  │
    │  └─────────┬─────────┘                  │
    │            ↓                            │
    │  ┌───────────────────┐                  │
    │  │ User Selects      │                  │
    │  │ Answer            │                  │
    │  └─────────┬─────────┘                  │
    │            ↓                            │
    │  ┌───────────────────┐                  │
    │  │ Save Answer       │ ← Auto-save     │
    │  │ POST /save-answer │                  │
    │  └─────────┬─────────┘                  │
    │            ↓                            │
    │  [Next Button Enabled]                  │
    │            ↓                            │
    │  ┌───────────────────┐                  │
    │  │ Click Next        │                  │
    │  └─────────┬─────────┘                  │
    │            ↓                            │
    │   ┌──────────────┐                     │
    │   │ Last Question?│                    │
    │   └──────┬───────┘                     │
    │          │                              │
    │     NO ──┴── YES                        │
    │     ↓        ↓                          │
    │  [Continue] [Submit Button]             │
    └─────────────┬───────────────────────────┘
                  ↓
        [Submit Assessment]
                  ↓
    ┌─────────────────────────────┐
    │     Score Calculation       │
    │ • Compare answers to key    │
    │ • Calculate per-question    │
    │ • Aggregate total score     │
    │ • Save to results           │
    │ • Create specialized        │
    │   result document           │
    └─────────────┬───────────────┘
                  ↓
          [Show Results]
                  ↓
        [Return to Assessments]
```

---

### 2.4 Course Learning Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COURSE LEARNING FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

[Dashboard] → [My Courses]
                   ↓
        ┌──────────────────────┐
        │  Display Enrolled    │
        │  Courses             │
        └──────────┬───────────┘
                   ↓
         [Select Course]
                   ↓
    ┌─────────────────────────────┐
    │      Course View            │
    │ ┌─────────────────────────┐ │
    │ │  Module 1 │ Module 2    │ │
    │ │  Week 1   │ Week 2      │ │
    │ ├───────────┼─────────────┤ │
    │ │  Module 3 │ Module 4    │ │
    │ │  Week 3   │ Week 4      │ │
    │ └─────────────────────────┘ │
    └─────────────┬───────────────┘
                  ↓
         [Select Module]
                  ↓
    ┌─────────────────────────────┐
    │      Module Content          │
    │                              │
    │  ┌──────────────────────┐   │
    │  │    Video Lesson      │   │
    │  │   (Custom Player)    │   │
    │  └──────────────────────┘   │
    │                              │
    │  ┌──────────────────────┐   │
    │  │  Reading Materials   │   │
    │  └──────────────────────┘   │
    │                              │
    │  ┌──────────────────────┐   │
    │  │    Module Tasks      │   │
    │  │   (Quiz/Assignment)  │   │
    │  └──────────────────────┘   │
    └─────────────┬───────────────┘
                  ↓
      [Complete Module Tasks]
                  ↓
    ┌─────────────────────────────┐
    │   Update Progress           │
    │ • Mark module complete      │
    │ • Update enrollment         │
    │ • Calculate % completion    │
    └─────────────┬───────────────┘
                  ↓
         ┌───────┴───────┐
         │               │
   [More Modules]  [All Complete]
         │               │
         ↓               ↓
   [Next Module]   [Generate Certificate]
```

---

### 2.5 Support Ticket Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPPORT TICKET FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

                     USER SIDE
    ┌────────────────────────────────────────┐
    │                                        │
[Dashboard] → [Help/Support]                 │
                    ↓                        │
           [View My Tickets]                 │
                    ↓                        │
     ┌──────────────┴──────────────┐         │
     │                             │         │
[Existing Tickets]           [New Ticket]    │
     │                             │         │
     ↓                             ↓         │
[View Details]           ┌───────────────┐   │
                         │ Ticket Form   │   │
                         │ • Title       │   │
                         │ • Category    │   │
                         │ • Priority    │   │
                         │ • Description │   │
                         │ • Attachments │   │
                         └───────┬───────┘   │
                                 ↓           │
                         [Submit Ticket]     │
                                 ↓           │
                      [Ticket Created]       │
                      [Status: Open]         │
    └────────────────────────────────────────┘

                     ADMIN SIDE
    ┌────────────────────────────────────────┐
    │                                        │
[Admin Panel] → [Tickets Dashboard]          │
                       ↓                     │
         ┌─────────────────────────┐         │
         │    Statistics Cards     │         │
         │ Open | In Progress |    │         │
         │ Resolved | Total        │         │
         └───────────┬─────────────┘         │
                     ↓                       │
              [Ticket List]                  │
              [With Filters]                 │
                     ↓                       │
            [Select Ticket]                  │
                     ↓                       │
    ┌───────────────────────────────┐        │
    │       Ticket Detail Modal     │        │
    │                               │        │
    │  Actions:                     │        │
    │  • View full details          │        │
    │  • Change status              │        │
    │  • Add response               │        │
    │  • View attachments           │        │
    │  • Delete ticket              │        │
    └───────────────┬───────────────┘        │
                    ↓                        │
            [Save Changes]                   │
                    ↓                        │
         [Status Updated]                    │
         [User Notified]                     │
    └────────────────────────────────────────┘
```

---

### 2.6 Community Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMMUNITY FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

[Dashboard] → [Community Button (Floating)]
                        ↓
              [Community Page]
                        ↓
    ┌───────────────────────────────────────┐
    │           Community Feed              │
    │                                       │
    │  ┌─────────────────────────────────┐  │
    │  │  [Create Post]                  │  │
    │  │  • Text content                 │  │
    │  │  • Image upload (optional)      │  │
    │  │  • Category selection           │  │
    │  └─────────────────────────────────┘  │
    │                                       │
    │  ┌─────────────────────────────────┐  │
    │  │  Post 1                         │  │
    │  │  ├─ Author info                 │  │
    │  │  ├─ Content                     │  │
    │  │  ├─ Like/React                  │  │
    │  │  └─ Comments                    │  │
    │  └─────────────────────────────────┘  │
    │                                       │
    │  ┌─────────────────────────────────┐  │
    │  │  Post 2                         │  │
    │  │  └─ ...                         │  │
    │  └─────────────────────────────────┘  │
    └───────────────────────────────────────┘

    MODERATION FLOW:
    ┌───────────────────────────────────────┐
    │  Post Creation                        │
    │            ↓                          │
    │  Content Check (NSFW detection)       │
    │            ↓                          │
    │     ┌──────┴──────┐                   │
    │     │             │                   │
    │  [Safe]      [Flagged]                │
    │     │             │                   │
    │     ↓             ↓                   │
    │  [Publish]   [Escalate to Admin]      │
    └───────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Registration Data Flow

```
Frontend (ComprehensiveSignup.jsx)
         │
         │ Collects all form data
         │
         ▼
POST /api/users/register-details
         │
         │ Request body contains:
         │ {
         │   email, fullName, mobileNumber,
         │   password, personalDetails,
         │   academicDetails, marksheets,
         │   certificates, idProof
         │ }
         │
         ▼
Backend (routes/users.js)
         │
         ├─→ Validate required fields
         │
         ├─→ Hash password (bcrypt)
         │
         ├─→ Create/Update User document
         │        │
         │        ▼
         │   users collection
         │   {
         │     email, fullName, mobileNumber,
         │     password (hashed), role,
         │     registrationCompleted: true
         │   }
         │
         └─→ Create Registration document
                  │
                  ▼
             registrations collection
             {
               userId, email, fullName,
               personalDetails, academicDetails,
               marksheets, certificates, idProof,
               status: 'pending'
             }
```

### 3.2 Assessment Results Data Flow

```
Frontend (BaseLineTest.jsx)
         │
         │ Per-question answer save
         │
         ▼
POST /api/results/save-answer
         │
         │ { resultId, questionId, selectedValue }
         │
         ▼
Backend (routes/results.js)
         │
         └─→ Update responses array in Result doc
                  │
                  ▼
             results collection (in-progress)
             {
               userId, assessmentId,
               questionOrder: [ObjectIds],
               responses: [
                 { questionId, selectedValue }
               ],
               completionStatus: 'in-progress'
             }

         ... User completes all questions ...

Frontend submits assessment
         │
         ▼
POST /api/results/:id/submit
         │
         ▼
Backend (routes/results.js)
         │
         ├─→ Score each response
         │   (compare to correct answers)
         │
         ├─→ Update Result document
         │        │
         │        ▼
         │   results collection (completed)
         │   {
         │     responses: [
         │       { questionId, selectedValue, 
         │         score, isCorrect }
         │     ],
         │     completionStatus: 'completed'
         │   }
         │
         └─→ Create specialized result
                  │
                  ▼
             baselineresults / eqresults / etc.
             {
               userId, score, totalScore,
               percentage, completedAt
             }
```

---

## 4. State Management Flow

### 4.1 Session State

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION STATE FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

    Login Success
         ↓
    Store in sessionStorage:
    ├─ token (JWT)
    ├─ user { id, email, name, role }
    └─ registration { data }
         ↓
    On Each API Call:
    ├─ Read token from sessionStorage
    └─ Attach to Authorization header
         ↓
    On Logout:
    ├─ Clear sessionStorage
    └─ Redirect to login
```

### 4.2 React Query State

```
┌─────────────────────────────────────────────────────────────────────┐
│                   REACT QUERY CACHING                                │
└─────────────────────────────────────────────────────────────────────┘

    API Call Initiated
         ↓
    Check Query Cache
         ↓
    ┌───────┴───────┐
    │               │
 [Cached]       [Not Cached]
    │               │
    ↓               ↓
 Return           Fetch from API
 Cached Data           ↓
                  Store in Cache
                       ↓
                  Return Data
```

---

## 5. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

    API Request
         ↓
    ┌───────────────────────────┐
    │    Backend Processing     │
    │                           │
    │  Try:                     │
    │    Execute operation      │
    │                           │
    │  Catch:                   │
    │    Log error              │
    │    Format error response  │
    └───────────────┬───────────┘
                    ↓
         ┌──────────┴──────────┐
         │                     │
    [Success]              [Error]
         │                     │
         ↓                     ↓
    { success: true,      { success: false,
      data: {...} }         error: "message",
                            statusCode: 4xx/5xx }
         │                     │
         ▼                     ▼
    Frontend handles      Frontend shows
    success response      error toast/modal
```

---

## 6. File Upload Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

    User Selects File
         ↓
    Frontend Validation:
    ├─ Check file type (allowed types)
    ├─ Check file size (max 5MB)
    └─ Check file count (max 3)
         ↓
    Create FormData Object
    ├─ Append file(s)
    └─ Append other form data
         ↓
    POST to Multer-enabled endpoint
         ↓
    Backend Processing:
    ├─ Multer middleware processes file
    ├─ Validate server-side
    ├─ Save to uploads/ directory
    └─ Store file path in database
         ↓
    Return file metadata:
    {
      filename: "generated_name.ext",
      originalName: "user_file.pdf",
      path: "/uploads/generated_name.ext",
      mimetype: "application/pdf",
      size: 1234567
    }
```

---

## 7. Real-time Features

### 7.1 Assessment Progress Persistence

```
    User answers question
            ↓
    Immediate API call:
    POST /save-answer
            ↓
    Server saves to MongoDB
            ↓
    Response confirms save
            ↓
    User can safely:
    ├─ Refresh page
    ├─ Close browser
    └─ Return later
            ↓
    On return:
    ├─ Fetch saved responses
    └─ Resume from last question
```

### 7.2 Community Notification Badge

```
    New post created
            ↓
    Stored in database
    with timestamp
            ↓
    User opens app
            ↓
    Query: posts since last visit
            ↓
    Display count on
    floating button badge
            ↓
    User clicks community
            ↓
    Update last visit time
            ↓
    Badge resets to 0
```

---

**Document End**

*This document outlines the complete flow of all major user interactions within the SMAART Minds platform. For implementation details, refer to the Technical Functionalities Document.*
