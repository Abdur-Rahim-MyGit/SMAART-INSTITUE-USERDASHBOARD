# Final Minds: End-to-End User Journey

This document outlines the complete, definitive user flow for the Final Minds platform, covering the specific path from Landing Page to Certification.

---

## Phase 1: Access & Authorization
**Goal:** Secure, institution-specific entry for legitimate students.

### 1. Landing & Institution Selection
*   **Landing Page**: The user arrives at the main landing page.
*   **College Selection**: The user **must** select their specific college/institution from a verified list.
    *   *Constraint*: Users cannot proceed without selecting a valid partner institution. Login is restricted to the selected institution's domain.

### 2. First-Time Login
*   **Credentials**: User enters their **Student ID** (or Username) and temporary Password provided by the institution.
*   **Forgot Password (Optional)**: If needed, the "Forgot Password" flow triggers an email/SMS reset link.
*   **OTP Verification**: Upon entering valid credentials, a Time-Based OTP is sent to the registered email/mobile. User must enter this to verify identity.

### 3. Mandatory Password Change
*   **Force Change**: Immediately after the first successful login + OTP, the system **forces** the user to change their password.
    *   *Action*: User helps secure their account by setting a new, private password.
    *   *Outcome*: Access granted to the Onboarding phase.

---

## Phase 2: Onboarding & "Student DNA"
**Goal:** Build a comprehensive profile to personalize the experience.

### 4. Comprehensive Profile Filling
User enters the 12-stage Profile Wizard. This data forms their "Digital Twin".
1.  **Profile Photo**: Upload professional image.
2.  **Personal Details**: DOB, Gender, Domain.
3.  **Academic History**: 10th & 12th Grade details (Marks, Uploads).
4.  **Higher Education**: Degree, CGPA, Backlogs, Upload Certificates.
5.  **Activities**: Co-curricular & Extra-curricular.
6.  **Job Preferences**: Role, Location, Salary expectations.
7.  **Sector Preferences**: Target industries.
8.  **Career Goals**: Short/Medium/Long-term text.
9.  **Work Experience**: Internships/Jobs history.
10. **Projects**: Academic/Personal projects.
11. **Certificates**: External certifications (Verification via URL/QR).
12. **Submission**: Profile locks and saves.

---

## Phase 3: The T1 Baseline Assessment
**Goal:** Establish the starting point for the student's growth.

### 5. T1 Baseline Test
*   **Start**: User is directed to the Baseline Assessment (`ASM00001`).
*   **Execution**: 36 Questions testing 6 key Quotients.
*   **Scoring & Calculation**:
    *   Real-time processing of answers.
    *   **Quotients Calculated**: CRQ, SRQ, LQ, SIQ, PEQ, DAQ.
    *   **Score**: Overall score out of 100.
    *   **Band Determination**: Emerging, Developing, Progressing, Strong, or Advanced.
*   **Output**: User sees their baseline profile and detailed quotient breakdown immediately.

---

## Phase 4: The Dashboard & Toolkit
**Goal:** The central hub for daily engagement and tools.

### 6. Dashboard Home
*   **Vision Splash**: A motivational "Vision Board" animation plays on entry.
*   **Main View**:
    *   **Hero Section**: Welcome message & Status.
    *   **Daily Streaks**: Activity tracking.
    *   **Calendar**: Upcoming deadlines.
    *   **Active Tasks**: Pending assignments/todos.

### 7. Core Features & Tools
*   **Vision Boards**: Users create and view their personalized vision boards (goals, aspirations).
*   **SMAART Toolkit**: Access to specific productivity and planning tools:
    *   *S*pecific, *M*easurable, *A*chievable, *A*ction-oriented, *R*elevant, *T*ime-bound goal setting tools.
    *   Weekly/Monthly Planners.
    *   SWOT Analysis tools.

---

## Phase 5: The Learning Journey
**Goal:** Skill acquisition through structured pathways.

### 8. My Courses & Structure
*   **Course Pathway**: User views their roadmap. Courses are unlocked based on the T1 Baseline and previous completions.
*   **Course Structure**:
    *   **Modules**: Each course is broken down into specific modules (e.g., "Cognitive Skills", "Digital Literacy").
    *   **Video Watching**: Interactive video player with progress tracking.
    *   **Reading Material**: PDFs and text resources.

### 9. Skills & Assessments
*   **Skill Acquisition**: As modules are completed, specific skills are added to the user's "Skills Passport".
*   **Module Assessments**: Mini-quizzes after chapters to verify knowledge.

---

## Phase 6: Conclusion & Certification
**Goal:** Recognizing achievement.

### 10. Certification
*   **Completion**: Once all required courses and assessments are done.
*   **Certificate Generation**:
    *   System generates a verifiable Digital Certificate.
    *   Available for download from the Dashboard.
    *   Contains unique ID/QR classification.

---

## Summary of Flow
`Landing` -> `Select College` -> `Login (ID/Pass)` -> `OTP` -> `Force Password Change` -> `Profile Fill` -> `T1 Assessment` -> `Dashboard (Home)` -> `Vision/SMAART Tools` -> `My Courses (Videos/Modules)` -> `Certification`
