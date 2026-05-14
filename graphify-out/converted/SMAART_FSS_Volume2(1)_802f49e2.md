<!-- converted from SMAART_FSS_Volume2(1).docx -->


SMAART MINDS
AI-Powered Learning & Career Readiness Platform

VOLUME 2
FUNCTIONAL SCREEN SPECIFICATION
Screen-by-Screen  |  Click-Level Flows  |  UX Interaction Bible


SMAART Institute  |  Screen Specification  |  Confidential


This Functional Screen Specification (FSS) is Volume 2 of the SMAART Minds product documentation. It is a screen-by-screen, click-by-click operating manual for every page across all three dashboards. Each screen is assigned a unique Screen ID for traceability.


Each screen entry includes: Screen ID, Name, Route, Entry Points, Layout Description, Components, all Click Flows (what happens when each button/element is clicked), all Screen States (normal, loading, empty, error, permission denied), and API dependencies.

## Platform Sitemap Overview



Route: / (public)  |  Role: Unauthenticated users  |  Entry Point: Direct URL or shared link

### Layout & Components
- Hero section: SMAART Minds logo, value proposition headline, partner institution logos strip
- CTA Button: "Get Started" — primary call to action in hero
- Navigation bar: Logo + Login link + About link
- Institution Selection Modal (auto-triggers on page load or "Get Started" click)
- Modal contents: Searchable dropdown of verified partner institutions, "Confirm" button, "Can't find your college?" link

### Click Flows
Click: "Get Started" button

Click: Institution selected + "Confirm"

Click: "Can't find your college?"

### Screen States


Route: /login (public)  |  Role: All users  |  Entry Point: From institution selection, direct URL, or session expiry redirect

### Layout & Components
- Left panel: SMAART Minds branding, selected institution name display, motivational tagline
- Right panel: Login form
- Form fields: Student ID / Email (text input), Password (password input with show/hide toggle)
- "Remember Me" checkbox (note: currently stores in sessionStorage only — TASK-16 bug)
- "Forgot Password?" link below password field
- "Login" submit button (primary CTA)
- Institution change link: "Not [Institution Name]? Change institution"

### Click Flows
Click: "Login" (submit form)

Click: "Forgot Password?"

Click: "Not [Institution]? Change institution"

### Screen States


Route: /otp-verify (public, reached after successful credential entry)  |  Role: All users mid-login

### Layout & Components
- Header: "Verify Your Identity"
- Info text: "A 6-digit code has been sent to [masked email/phone]"
- OTP input: 6 individual digit boxes (auto-focus, auto-advance on input)
- "Verify" button (primary CTA)
- "Resend Code" link (disabled with countdown for 60 seconds, then enabled)
- Countdown timer: "Resend available in [XX] seconds"

### Click Flows
Click: "Verify" button

Click: "Resend Code" (enabled after 60s)


Route: /forgot-password (public)  |  Role: All users
### Layout & Components
- Email input field with "Send Reset Link" button
- Back to Login link
### Click Flows
Click: "Send Reset Link"


Route: /change-password (JWT-gated, first-time flag required)  |  Role: Any user on first login
### Layout & Components
- Explanation banner: "This is your first login. Please set a new password."
- New password field with strength indicator (Weak / Fair / Strong / Very Strong)
- Confirm password field
- "Set Password" button
### Validation Rules
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- New password cannot match the temporary password
- Confirm password must match new password exactly
### Click Flows
Click: "Set Password"


The onboarding wizard (STU-006 through STU-006L) is a single multi-step flow at the /onboarding route. Each "step" is a sub-state of the same page, not a separate route. A progress bar at the top shows which of the 12 steps the student is on. Navigation between steps uses "Next" and "Back" buttons within the page.


Route: /onboarding (JWT-gated, requires profile incomplete flag)  |  Role: Student only  |  Estimated time: 15–20 minutes

### Persistent Elements (visible on all 12 steps)
- Top progress bar: "Step X of 12" with named milestone labels
- Step title and description
- Back / Next navigation buttons (Back disabled on Step 1)
- Auto-save indicator: "Progress saved" appears after each completed step
- "Save & Exit" option — saves current step and allows return later


### Step 1 — Profile Photo Click Flows
Click: Upload Photo

Click: Crop tool confirm

### Step 5 — Higher Education Multi-Entry Flows
Click: "Add Another Degree"

Click: Delete degree entry (trash icon)

### Final Step — Review & Submit
Click: "Submit Profile"

### Onboarding Screen States



Route: /assessment (JWT-gated)  |  Role: Student  |  This screen appears before any of the 4 assessments and informs the student what to expect.

### Layout & Components
- Assessment title and type (T1 Baseline / T2 Capacity / T3 Capability / T4 Leadership)
- Prerequisites checklist (green ticks for met, grey for pending)
- Assessment details card: number of questions, quotients covered, approximate time, pass threshold
- Rules & guidelines accordion: anti-cheat rules explained
- "Begin Assessment" button (primary CTA) — disabled if prerequisites not met
- "Return to Dashboard" link

### Click Flows
Click: "Begin Assessment"


Route: /assessment/active (JWT-gated, assessment-session-gated)  |  Role: Student  |  This is the distraction-free proctored assessment environment.

### Layout & Components
- Full-screen forced layout — no sidebar, no header, no navigation
- Question counter: "Question 7 of 36"
- Quotient tag: "CRQ — Cognitive Readiness" label on each question
- Question text (large, readable font)
- 4 answer option buttons (A/B/C/D) — radio-style selection with highlight on click
- Minimum timer indicator: 5-second countdown before "Next Question" enables
- "Next Question" button (disabled for 5 seconds after question loads)
- Progress bar: linear fill showing % of questions answered
- Warning banner (shown after 1st violation): "Warning 1/3: Leaving the assessment window is not permitted"
- "Submit Assessment" button — appears only on final question

### Click Flows
Click: Answer option (A/B/C/D)

Click: "Next Question" (after 5-second delay)

Click: "Submit Assessment" (final question)

System Event: Tab Switch Detected

### Assessment Screen States


Route: /assessment/results/:stage (JWT-gated)  |  Role: Student  |  Shown immediately after assessment submission.

### Layout & Components
- Animated score reveal: overall percentage with circular progress animation
- Stage Band badge: "Advanced / Strong / Progressing / Developing / Emerging"
- Quotient breakdown table: each quotient with score, ratio (e.g., 5/7), animated progress bar, band label
- For T2–T4: PLVI card showing growth velocity band (Fast/Steady/Developing)
- Certificate card (T2–T4 only): "🎉 C1 Certificate Issued!" with download button (if eligible)
- "Download Report" button (generates TXT/PDF report)
- "Go to Dashboard" button
- "View Skills Passport" button

### Click Flows
Click: "Download Report"

Click: "Download Certificate" (T2–T4 eligible)



Route: /dashboard (JWT-gated, requires profile complete + T1 done)  |  Role: Student  |  The primary hub screen students land on after login.

### Layout — Three-Zone Structure
- Zone A — Hero: personalised greeting, streak counter, weekly goal bar, Resume Learning CTA
- Zone B — Left Column: Continue Learning card + Quick Access Grid (6 shortcuts)
- Zone C — Right Column: Calendar widget + Active Tasks + Premium upgrade card

### Hero Zone Click Flows
Click: "Resume Learning" button

Click: Streak counter

### Quick Access Grid Click Flows

### Continue Learning Card Click Flows
Click: Course thumbnail or "Continue" button

### Right Column — Calendar Widget
Click: Calendar event dot

### Dashboard Home Screen States


Route: /dashboard/profile (JWT-gated)  |  Role: Student  |  Allows students to view and edit their profile data from the 12-step wizard.

### Layout & Components
- Profile header: avatar, name, institution, department, year of study, edit button
- Tab navigation: Personal | Education | Experience | Goals | Preferences
- Each tab renders the corresponding wizard step data in view mode
- Edit mode toggle: clicking Edit on any section opens the relevant wizard step inline
- "Save Changes" button per section (in edit mode)
- "Change Profile Photo" button on avatar

### Click Flows
Click: Edit button (any section)

Click: "Save Changes"


Route: /dashboard/skills-passport (JWT-gated)  |  Role: Student  |  The consolidated professional identity document.

### Layout & Components
- Header: Student name, institution, programme, passport ID
- SRI Score ring chart (large, animated on load)
- Growth timeline: T1 → T2 → T3 → T4 score progression line chart (Recharts)
- Skill Radar Chart: 7-axis (CRQ, SRQ, LQ, SIQ, PEQ, DAQ, SEQ) — NOTE: currently missing SEQ (TASK-12 bug)
- Certificate stack section: C1 / C2 / C3 cards with issue dates and download buttons
- Quotient breakdown bars: 7 quotients with score, band, and description
- Badge gallery: all earned badges with dates
- PLVI card: growth velocity band and calculation
- "Download Passport" button (PDF)
- "View Reports" button — currently non-functional (TASK-11 bug)
- "Share Profile" button — currently non-functional (TASK-11 bug)

### Click Flows
Click: "Download Passport" button

Click: Certificate "Download" on C1/C2/C3 card

Click: Certificate QR code (scan simulation)


Route: /dashboard/courses (JWT-gated)  |  Role: Student  |  Lists all courses the student is enrolled in.

### Layout & Components
- Course cards grid: thumbnail, course name, module count, completion %, current module, Continue button
- Filter tabs: All Courses / In Progress / Completed
- Phase indicators: Capacity / Capability / Leadership phase labels
- "Start Course" button (if not yet begun)

### Click Flows
Click: Course card or "Continue" button


Route: /dashboard/course/:courseId (JWT-gated)  |  Role: Student  |  Shows the full module list for a course with progression logic.

### Layout & Components
- Course header: title, difficulty, phase, total modules, completion %
- Module list: numbered, each module shows status (locked/available/in-progress/completed)
- Module card: module name, phase tag (Day 1/2/3), completion status icon, "Start" or "Continue" or lock icon
- Current module highlighted with "Resume" CTA
- Completed modules: green checkmark, clickable for review
- Locked modules: grey lock icon, hover shows "Complete [Module X] to unlock"

### Click Flows
Click: Available/in-progress module

Click: Locked module


Route: /dashboard/course/:courseId/module/:moduleId (JWT-gated)  |  Role: Student  |  The core learning experience screen.

### Layout & Components
- Left sidebar: Step list (Step 0 through Step 9) with completion status icons
- Main content area: changes per step type
- Video player (Step 0–3, 7): custom player with play/pause, volume, speed (0.5x–2x), fullscreen, progress bar, 80% completion threshold indicator
- Quiz component (Step 4): MCQ questions with scenario-based options, submit button
- Evidence task uploader (Step 5): task instructions, file upload area, rubric download link, submit evidence button
- Reflection form (Step 6): Likert scale sliders, forced-choice prompts, submit reflection
- Flashcard viewer (Step 8): PDF preview embed, download PDF button
- Step completion indicator: progress dots in sidebar update on completion
- "Next Step" button (disabled until current step completion threshold met)

### Video Player Click Flows
Video reaches 80% watched threshold

Every 5 seconds during playback

Click: "Next Step" button

Click: Step 4 Quiz "Submit Answers"

Click: Step 5 "Submit Evidence Task"

### Module Completion Event
Student completes Step 9 (final step in module)


Route: /dashboard/vision-board (JWT-gated)  |  Role: Student

### Layout & Components
- Board gallery: grid of existing boards with category labels and cover images
- "Create New Board" button (primary CTA)
- Board categories filter: Career Vision / Academic / Personal / Financial / Custom
- Each board card: cover, title, last edited, "Open" button

### Click Flows
Click: "Create New Board"

Click: Board card "Open"


Route: /dashboard/toolkit (JWT-gated)  |  Role: Student  |  Hub for all AI-powered and standard productivity tools.

### Layout & Components
- Tools grid: cards for each tool with icon, name, short description, "Open" button
- Categories: AI Tools / Planning Tools / Wellness Tools / Reference Tools
- NOTE: AI Career Chat card currently missing from toolkit (TASK-17 bug)



Route: /dashboard/toolkit/ai-chat (JWT-gated)  |  Role: Student  |  NOTE: Currently not linked from toolkit (TASK-17). Chat history lost on server restart (TASK-03).

### Layout & Components
- Left panel: conversation history list (previous chats — currently empty due to in-memory storage bug)
- "New Conversation" button
- Main area: chat thread with user/AI message bubbles
- Input bar: text field + send button + optional file attachment
- AI model indicator: "Powered by Deepseek r1058 + NVIDIA Nemotron"
- Context indicators: shows student's profile data being used as context

### Click Flows
Click: Send message

Click: "New Conversation"


Route: /dashboard/toolkit/resume-builder (JWT-gated)  |  Role: Student

### Layout & Components
- Step 1: Target role selector — searchable dropdown of 3000+ roles
- Step 2: Profile review — shows which profile sections will be used (education, skills, experience)
- Step 3: Generate — "Generate Resume" button with loading state
- Step 4: Resume preview — rendered ATS-optimised resume
- Step 5: Download options — PDF / DOCX / Copy text

### Click Flows
Click: "Generate Resume"


Route: /dashboard/skills-vault (JWT-gated)  |  Role: Student  |  NOTE: This route currently renders DashboardHome (TASK-07/TASK-23 bug). The SkillsVault component does not exist yet.

### Intended Layout (Design Spec for Build)
- Tab 1 — My Certificates: All issued C1/C2/C3 certificates + externally uploaded certificates
- Tab 2 — My Badges: Full badge collection with earn date and description
- Tab 3 — Flashcards: Skill flashcards (currently hardcoded — TASK-13 bug, should be API-fetched)
- Tab 4 — External Certs: Upload and manage external credentials with verification mode
- Certificate distinction: "SMAART Verified" green badge vs "Self-Reported" grey badge

### Click Flows — Tab 4: Upload External Certificate
Click: "Upload Certificate" button

Inside modal: Fill cert details + upload + click Submit


Route: /dashboard/mindcare (JWT-gated)  |  Role: Student

### Layout & Components
- Domain tabs: Academic / Career / Mental Health / Personal
- Available coaches list per domain: avatar, name, specialisation, availability slots
- "Book Session" button on each coach card
- My Upcoming Sessions section: booked sessions with date, time, coach name, cancel option
- My Past Sessions: completed sessions with feedback prompt if feedback pending

### Click Flows
Click: "Book Session" on coach card

Click: Select time slot + "Confirm Booking"



Route: /career (JWT-gated)  |  Role: Student  |  Entry point to the AI Career Intelligence subsystem.

### Layout & Components
- Hero: "Discover Your Career Path" headline with value proposition
- CTA: "Start Career Analysis" button (primary)
- If analysis exists: "View My Career Report" button (secondary)
- Career readiness score teaser card (if profile exists)
- How it works: 3-step visual explainer (Profile → Analysis → Roadmap)

### Click Flows
Click: "Start Career Analysis" (first time)

Click: "View My Career Report" (returning user)


Route: /career/onboarding (JWT-gated)  |  Role: Student



Route: /career/processing (JWT-gated, shown during analysis)  |  Role: Student

### Layout & Components
- Full-screen loading animation with 6 step indicators:
- Step 1: "Analysing your education profile..."
- Step 2: "Matching career directions..."
- Step 3: "Calculating skill alignment scores..."
- Step 4: "Running AI enhancement..."
- Step 5: "Building your career roadmap..."
- Step 6: "Finalising your report..."
- Progress bar advancing through steps (simulated + real)

### System Flow During This Screen
- Profile hash generated → cache check in /records directory
- If cache hit: skip engine, load cached report
- If no cache: run processCareerIntelligence(studentData) in engine.js
- Direction data fetched from MongoDB career_agent_data collection
- Role data fetched from MongoDB careerroles collection
- Direction scores calculated: Degree Match (35%) + Skill Match (45%) + Experience Match (20%)
- Zones determined: Green (≥0.6) / Amber (≥0.3) / Red (<0.3)
- ML Service called: POST /parse-resume → POST /predict-success (success probability 0.1–0.95)
- Claude API enrichment: POST to Anthropic API for intelligence enhancement
- 5-tab role report generated for each of 3 career paths
- Auto-redirect to /career/dashboard on completion


Route: /career/dashboard (JWT-gated)  |  Role: Student  |  The main career intelligence report screen with 3 career paths and 5 tabs each.

### Layout & Components
- Header: "Your Career Intelligence Report" with last generated date and "Refresh Analysis" button
- Career path tabs: Primary / Secondary / Tertiary (top navigation)
- Zone indicator: Green / Amber / Red zone badge for each path
- ML Success Probability score for each path
- 5 content tabs per career path (Tab 1–5)

### Tab Content & Click Flows

### Click Flows
Click: Primary / Secondary / Tertiary career path tab

Click: "Start Learning" on a skill gap item (Tab 4)

Click: "Refresh Analysis"


Route: /career/role/:roleName (JWT-gated)  |  Role: Student  |  Deep-dive into a specific career role.

### Layout & Components
- Role header: title, sector, job family, zone badge
- Salary range: chart showing min/median/max
- Employer showcase: company logos/names with "View on LinkedIn" links
- Skill tree: visual hierarchy of required skills
- Similar roles: 3 related role cards with alignment scores
- "Add to Watchlist" button
- "Share Role" button (copy link)



Route: /admin/dashboard (JWT-gated, Super Admin role only)  |  Role: Super Admin

### Layout & Components
- KPI banner row: Total Students, Active Colleges, Total Certificates Issued, Open Escalations
- Chart section: Daily Active Users (line chart), College Onboarding Progress (bar chart), Certificate Distribution (pie chart)
- Recent activity feed: Last 10 admin actions across the platform
- Quick action buttons: Onboard New College, Add Question, View All Escalations, Generate Report
- System status panel: API health, DB status, AI service status, email service

### Click Flows
Click: "Onboard New College" quick action

Click: KPI card (e.g., Total Students number)


Route: /college/dashboard (JWT-gated, College Admin role)  |  Role: College Admin  |  Scoped to single institution — cannot see other colleges.

### Layout & Components
- College name and code header
- KPI cards: Active Students, Avg Completion Rate, Avg PPI Score, Open Escalations
- Department comparison bar chart
- Student engagement heatmap (last 30 days)
- Quick actions: Add Student, Upload CSV, View At-Risk Students, Generate Report

### Click Flows
Click: "View At-Risk Students"


Route: /admin/users (JWT-gated, role-dependent scope)  |  Role: Super Admin (all users) | College Admin (own college only)

### Layout & Components
- Paginated data table: User ID, Name, Email, Role, College, Status, Last Login, Actions
- Search bar: search by name, email, user ID
- Filters: Role / College / Status (Active/Inactive/Pending) / Date Joined
- "Add User" button (Super Admin / College Admin)
- "Bulk Upload CSV" button
- Row actions: View Detail / Edit / Deactivate / Reset Password / Kill Session

### Click Flows
Click: User row → "View Detail"

Click: "Deactivate" on user row

Click: "Reset Password"

Click: "Bulk Upload CSV" button


Route: /colleges/onboard (JWT-gated, Super Admin / Consultant role)  |  Role: Super Admin, Consultant  |  4-tab wizard.


### Click Flows
Click: "Save & Proceed" on Tab 1

Click: "Activate College" on Tab 4


Route: /colleges (JWT-gated, Super Admin / Consultant)  |  Role: Super Admin, Consultant

### Layout & Components
- Colleges data table: College Code, Name, Type, Status, Student Count, Active Students, Admin Name, Subscription Expiry, Actions
- Status filter: All / Draft / Verified / Active / Suspended
- "Onboard New College" CTA button
- Row actions: View Details / Edit / Suspend / Delete (Draft only) / Extend Subscription

### Click Flows
Click: "Suspend" on a college row


Route: /admin/students/:studentId (JWT-gated, role-scoped)  |  Role: College Admin, Teacher, Coach, Super Admin

### Layout & Components
- Student header: photo, name, ID, college, department, year, programme, PPI score badge
- Tab navigation: Overview / Assessments / Courses / Certificates / Case Logs / Escalations
- Overview tab: profile summary, streak, completion rate, skills radar chart
- Assessments tab: T1–T4 scores, band progression, PLVI score, quotient breakdown per stage
- Courses tab: enrolled courses, module completion status per module, evidence submissions
- Certificates tab: C1/C2/C3 status, integrity flag status
- Case Logs tab: full timestamped activity trail
- Escalations tab: open/resolved escalations with forum thread

### Admin Action Buttons on Student Detail


Route: /admin/questions (JWT-gated, Super Admin only)  |  Role: Super Admin

### Layout & Components
- Question bank overview: total questions by quotient with target vs actual counts
- Quotient filter: All / CRQ / SRQ / LQ / SIQ / PEQ / DAQ / SEQ
- Difficulty filter: All / Easy / Medium / Hard
- Questions list: question text preview, quotient, difficulty, type, actions
- "Add New Question" button
- "Bulk Import" button (CSV)

### Click Flows
Click: "Add New Question"

Inside question creation modal — click "Save Question"


Route: /admin/analytics (JWT-gated, role-scoped)  |  Role: Super Admin (global) | College Admin (college-scoped)

### Layout & Components
- Date range selector: This Week / This Month / This Quarter / Custom Range
- Metric tabs: Students / Courses / Assessments / Certificates / Escalations
- Charts: Recharts + Chart.js — line graphs, bar charts, pie charts, heatmaps
- "Generate Export" button: creates CSV or PDF report for selected metrics and date range
- Delta Comparison card: T1 vs T4 score delta for the cohort

### Click Flows
Click: "Generate Export"


Route: /admin/escalations (JWT-gated, role-scoped)  |  Role: College Admin, Coach, Super Admin

### Layout & Components
- Escalations list: Student Name, Trigger Type (automated/manual), Status (Open/In Progress/Resolved), Assigned Coach, Created Date
- Filter: Status / Trigger Type / College
- Each row: "View Escalation" link

### Escalation Detail Page (ADM-009a)
- Student info header
- Trigger details: what triggered the escalation, timestamp
- Internal forum thread: timestamped notes from Admin and Coach
- "Add Note" text area + submit
- "Mark as Resolved" button (requires note documenting action taken)
- "Reassign Coach" dropdown

### Click Flows
Click: "Mark as Resolved"


Route: /coach/dashboard (JWT-gated, Coach role)  |  Role: Coach

### Layout & Components
- Today's schedule: upcoming sessions for today with student names and domains
- Open escalations assigned to this coach
- Pending feedback: sessions without post-session feedback form completed
- Session calendar: monthly view with all scheduled sessions

### Click Flows
Click: Session card → "Open Session"

Click: "Complete Session" + submit feedback form


## Student Dashboard — Full Sitemap

## AI Career Agent — Full Sitemap

## Admin Dashboard — Full Sitemap





SMAART MINDS — Functional Screen Specification v1.0
Volume 2  |  Screen-by-Screen, Click-by-Click  |  Use with Master BRD v2.0 (Volume 1)
Classification: Confidential — Internal Use Only  |  SMAART Institute 2026
| Field | Details |
| --- | --- |
| Document Type | Functional Screen Specification (FSS) — Volume 2 |
| Companion To | SMAART Minds Master BRD v2.0 (Volume 1) |
| Screen Coverage | Student Dashboard + AI Career Agent + Admin Dashboard |
| Total Screens Documented | 50+ screens across all three dashboards |
| Version | 1.0 — April 2026 |
| Classification | Confidential — Internal Use Only |
| Audience | Product Managers, UI/UX Designers, Frontend Developers, QA |
| HOW TO READ THIS DOCUMENT |
| --- |
| Screen ID Format | Dashboard | Example |
| --- | --- | --- |
| STU-XXX | Student Dashboard | STU-001 = Landing Page |
| AGT-XXX | AI Career Agent | AGT-001 = Career Agent Home |
| ADM-XXX | Admin Dashboard | ADM-001 = Super Admin Home |
| Dashboard | Total Screens | Route Prefix | Access |
| --- | --- | --- | --- |
| Student Dashboard | 25 screens | /dashboard/* | JWT-authenticated students only |
| AI Career Agent | 8 screens | /career/* | JWT-authenticated students only |
| Admin Dashboard | 20 screens | /admin/* and role-specific routes | JWT-authenticated admins (role-gated) |
| PART 1 — AUTHENTICATION SCREENS (ALL USERS) |
| --- |
| STU-001 | Landing Page & Institution Selection Modal |
| --- | --- |
| User Action | User clicks "Get Started" in the hero section |
| --- | --- |
| System Response | Institution Selection Modal opens as an overlay. Background blurs. Modal slides in with animation. |
| Navigates To | Institution Selection Modal (inline — no route change) |
| Data Loaded | GET /api/colleges/list → loads verified active colleges into searchable dropdown |
| Validation | Institution must be selected from verified list. Cannot proceed without selection. |
| Error State | If API fails to load colleges: "Unable to load institutions. Please refresh." with retry button. |
| User Action | User selects institution from dropdown and clicks Confirm |
| --- | --- |
| System Response | Institution code and name stored in sessionStorage. Modal closes. Redirect to /login. |
| Navigates To | /login (STU-002) |
| Data Loaded | College metadata pre-loaded into session for profile pre-population |
| Validation | Institution must be from the verified active list. Status check runs on backend. |
| Error State | "This institution is not currently active on the platform. Please contact your administrator." |
| User Action | User clicks help link |
| --- | --- |
| System Response | Info message appears: "SMAART Minds is an institutional platform. Contact your college administrator to verify partnership status." |
| Navigates To | No navigation — informational modal within the institution selector |
| Data Loaded | No API call |
| Validation | None |
| Error State | None |
| State | What User Sees |
| --- | --- |
| Normal | Landing page with hero, institution modal auto-opens on first visit |
| Loading | Skeleton shimmer in institution dropdown while colleges load |
| Empty (no colleges) | "No institutions found" — show "Contact Support" link |
| Error (API fail) | "Unable to load institutions. Please refresh." with retry button |
| STU-002 | Login Page |
| --- | --- |
| User Action | User enters Student ID + password and clicks Login |
| --- | --- |
| System Response | Form validation runs client-side. If valid: POST /api/auth/login called. Button shows spinner. Fields disabled. |
| Navigates To | If valid → /otp-verify (STU-003). If invalid → error shown inline. |
| Data Loaded | POST /api/auth/login → validates credentials across users/teachers/students collections |
| Validation | Both fields required. Email format validated. Min 8 chars for password. |
| Error State | Wrong credentials: "Invalid Student ID or password. [X] attempts remaining." | Account locked: "Your account has been locked after 5 failed attempts. Please contact your administrator." | Network error: "Connection failed. Please check your internet and try again." |
| User Action | User clicks forgot password link |
| --- | --- |
| System Response | Navigates to /forgot-password page. Email input shown. |
| Navigates To | /forgot-password (STU-004) |
| Data Loaded | No data loaded on arrival |
| Validation | None on click |
| Error State | None |
| User Action | User clicks institution change link |
| --- | --- |
| System Response | sessionStorage institution data cleared. Redirect to / with institution modal re-opening automatically. |
| Navigates To | / (STU-001) with modal open |
| Data Loaded | Colleges list re-fetched |
| Validation | None |
| Error State | None |
| State | What User Sees |
| --- | --- |
| Normal | Login form with institution name shown, all fields editable |
| Submitting | Login button shows spinner, fields disabled, no double-submit possible |
| Error — Wrong Credentials | Red error banner below form with attempt count remaining |
| Error — Account Locked | Red banner, login button disabled, contact admin message |
| Success | Redirect to OTP verification page (no state shown on this page) |
| STU-003 | OTP Verification Page |
| --- | --- |
| User Action | User enters 6-digit OTP and clicks Verify |
| --- | --- |
| System Response | POST /api/auth/verify-login called with email + OTP. Button shows spinner. |
| Navigates To | First-time login → /change-password (STU-005) | Returning user → /dashboard (STU-010) | Profile incomplete → /onboarding (STU-006) |
| Data Loaded | JWT token returned; user role, profile status, first-time flag extracted |
| Validation | All 6 digits must be entered. Numeric only. |
| Error State | Invalid OTP: "Incorrect code. Please try again." | Expired OTP: "This code has expired. Please request a new one." | Too many attempts: Back to login with lockout message. |
| User Action | User clicks Resend Code |
| --- | --- |
| System Response | POST /api/auth/resend-otp called. Countdown resets to 60 seconds. Success toast shown. |
| Navigates To | No navigation — same page |
| Data Loaded | New OTP generated and emailed/SMS'd |
| Validation | Can only resend once countdown reaches 0 |
| Error State | "Failed to send OTP. Please try again." with retry option. |
| STU-004 | Forgot Password Page |
| --- | --- |
| User Action | User enters email and clicks Send Reset Link |
| --- | --- |
| System Response | POST /api/auth/forgot-password. Email sent with reset token. Success message shown. |
| Navigates To | Same page — success state shown |
| Data Loaded | Reset token generated, hashed, stored with expiry |
| Validation | Valid email format required. Email must exist in the system. |
| Error State | If email not found: Generic message "If this email is registered, a reset link will be sent." (security — no account enumeration) |
| STU-005 | Mandatory Password Change Page |
| --- | --- |
| User Action | User fills both fields and clicks Set Password |
| --- | --- |
| System Response | PATCH /api/auth/change-password called. first_time_login flag cleared in DB. Success animation (3 seconds). |
| Navigates To | /onboarding (STU-006) if profile incomplete | /dashboard (STU-010) if returning user |
| Data Loaded | Password hashed with bcrypt (10 rounds) and stored |
| Validation | All validation rules enforced before API call |
| Error State | If old temp password is reused: "You cannot reuse your temporary password." | Complexity fail: Inline error highlighting which requirement is missing. |
| PART 2 — STUDENT ONBOARDING SCREENS |
| --- |
| STU-006 | Onboarding Wizard — 12-Step Profile Builder |
| --- | --- |
| Step | Name | Required? | Key Actions / Clicks |
| --- | --- | --- | --- |
| Step 1 | Profile Photo | Yes | Upload photo → crop tool opens → crop & confirm → Cloudinary upload → Next |
| Step 2 | Personal Details | Yes | Fill form fields → domain dropdown → "Other" triggers custom field → Next |
| Step 3 | Secondary Education (10th) | Yes | Fill school details → marksheet upload → validate % range → Next |
| Step 4 | Higher Secondary (12th) | Yes | Fill school details → marksheet upload → stream dropdown → Next |
| Step 5 | Higher Education | Yes | Add degree entry → multi-entry form (up to 3) → certificate upload per entry → Next |
| Step 6 | Extracurricular Activities | No | "Mark as Not Applicable" checkbox OR add activities → participation level → Next |
| Step 7 | Job Preferences | Yes | Search 3000+ job roles (primary/secondary/tertiary) → location multi-select (max 3) → salary range → Next |
| Step 8 | Sector Preferences | Yes | Select up to 3 sectors from 15 options → industry toggle chips → Next |
| Step 9 | Career Goals | Yes | Text areas for 3 time horizons → short-term / medium / long-term → character count → Next |
| Step 10 | Work Experience | No | "Not Applicable" OR add entries → document upload (offer/experience letter) → Next |
| Step 11 | Projects | No | "Not Applicable" OR add entries → GitHub/Google Docs URL validation → Next |
| Step 12 | Certifications | No | "Not Applicable" OR add certs → verification mode (URL/QR/Unverified) → Review & Submit |
| User Action | User clicks upload area or "Choose File" button |
| --- | --- |
| System Response | File picker opens. Only JPG/PNG accepted. Max 5MB enforced. |
| Navigates To | If valid → Image crop tool renders inline below the upload area. |
| Data Loaded | No API call yet — local file read via FileReader |
| Validation | File type: JPG/PNG only. Size: max 5MB. No future dates in other fields. |
| Error State | "File too large (max 5MB)" | "Unsupported format — use JPG or PNG" |
| User Action | User adjusts crop handles and clicks Confirm Crop |
| --- | --- |
| System Response | Cropped image preview renders. Upload progress bar appears. POST to Cloudinary via /api/upload/photo. |
| Navigates To | Same step — photo preview replaces upload area |
| Data Loaded | Cloudinary URL returned and stored in formData.profilePhoto |
| Validation | Crop area must be at least 100x100px |
| Error State | "Upload failed. Please try again." with retry button. |
| User Action | User clicks Add Another Degree after filling first entry |
| --- | --- |
| System Response | New blank degree entry form appends below existing entries. |
| Navigates To | Same step — scrolls to new entry |
| Data Loaded | No API call |
| Validation | Previous entry must have required fields (qualification, degree name, university, year) before adding another |
| Error State | "Please complete the current entry before adding another." |
| User Action | User clicks trash icon on a degree entry |
| --- | --- |
| System Response | Confirmation prompt: "Remove this degree entry?" with Yes/No buttons. |
| Navigates To | On Yes: entry removed from formData, form re-renders without it |
| Data Loaded | No API call — local state update |
| Validation | Must have at least 1 degree entry to proceed |
| Error State | None |
| User Action | User clicks Submit Profile on Step 12 |
| --- | --- |
| System Response | Loading spinner overlay. All form data + file URLs sent to POST /api/users/register-details. 3-second success animation. |
| Navigates To | /assessment/t1 (STU-008) — auto-redirect after success animation |
| Data Loaded | Complete Student DNA profile written to MongoDB students collection. Career Intelligence Engine activates asynchronously. |
| Validation | All mandatory steps complete. All required file uploads confirmed. |
| Error State | Validation error: scroll to first failed step and highlight missing fields. | API error: "Profile save failed. Your progress is saved — please try again." | Partial save: system saves what was uploaded so far. |
| State | What User Sees |
| --- | --- |
| Normal | Current step form, progress bar, Back/Next navigation |
| Auto-saving | "Saving..." indicator in top corner, Next button briefly disabled |
| Returning User (partial) | Wizard opens at last incomplete step with previous data pre-filled |
| Upload in progress | Progress bar on file upload, Next button disabled until complete |
| Validation fail | Red border on missing fields, scroll to first error, toast "Please complete all required fields" |
| Submission loading | Full-screen overlay spinner: "Creating your profile..." |
| Success | 3-second animated success screen → auto-redirect to T1 assessment |
| PART 3 — ASSESSMENT SCREENS |
| --- |
| STU-007 | Assessment Landing / Gate Screen |
| --- | --- |
| User Action | Student clicks Begin Assessment |
| --- | --- |
| System Response | GET /api/assessment/questions?stage=T1 fetches stratified question set. Full-screen assessment environment launches. Right-click disabled. Copy/paste blocked. Tab-switch monitoring activates. |
| Navigates To | /assessment/active (STU-008) |
| Data Loaded | Question set for the stage loaded (36 questions for T1, 34 for T2/T3). Timer starts (if applicable). |
| Validation | Student must have completed all prerequisites for that stage. |
| Error State | "You must complete [prerequisite module] before taking this assessment." | If API fails: "Failed to load assessment. Please try again." |
| STU-008 | Active Assessment Screen |
| --- | --- |
| User Action | Student clicks an answer option |
| --- | --- |
| System Response | Selected option highlighted. Answer stored in local state. Does not submit to API yet. |
| Navigates To | No navigation — stays on same question |
| Data Loaded | Answer stored locally in answersArray[questionIndex] |
| Validation | Must select an option before clicking Next Question |
| Error State | None — selection is always valid |
| User Action | Student clicks Next Question |
| --- | --- |
| System Response | Current answer + timestamp saved to session. PATCH /api/assessment/progress called (saves progress every question). Next question loads. |
| Navigates To | Next question loads on same screen |
| Data Loaded | Progress payload: {questionId, selectedAnswer, timeSpent} → BaseLineResult collection updated incrementally |
| Validation | 5-second minimum must have elapsed. Answer must be selected. |
| Error State | If API save fails: answer buffered locally, retry on next question save. |
| User Action | Student clicks Submit Assessment on last question |
| --- | --- |
| System Response | Confirmation modal: "Are you sure you want to submit? You cannot change answers after submission." Accept/Cancel. |
| Navigates To | On Accept: POST /api/assessment/submit → scoring engine runs → /assessment/results (STU-009) |
| Data Loaded | Full question set submitted. Scoring: binary per question. Weighted quotient scores calculated. PLVI calculated (T2–T4). Certificate eligibility checked. |
| Validation | All 36 questions must have answers. Final question timer must have elapsed. |
| Error State | If submit fails: "Submission failed. Your answers are saved. Please try again." with retry. |
| User Action | Student navigates away from assessment window (tab switch, window minimize, PrintScreen) |
| --- | --- |
| System Response | Warning banner appears on return. Violation count incremented in DB. PATCH /api/assessment/integrity logged. |
| Navigates To | Same screen — warning overlay |
| Data Loaded | Integrity violation logged: {userId, violationType, timestamp, questionIndex} |
| Validation | After 3 violations: auto-submit triggered immediately |
| Error State | None (violation is the error state itself) |
| State | What User Sees |
| --- | --- |
| Normal | Question text, 4 options, progress bar, 5s timer countdown, Next button |
| Answer selected | Option highlighted in blue, Next button enabled (after 5s) |
| Warning 1 | Yellow banner: "Warning 1 of 3 — do not leave this window" |
| Warning 2 | Orange banner: "Warning 2 of 3 — one more violation will auto-submit" |
| Warning 3 | Red banner: "Auto-submitting due to integrity violations..." |
| Network drop | "Connection lost. Your progress is saved. Reconnecting..." — answers buffered locally |
| Submitting | Full-screen spinner: "Calculating your results..." |
| STU-009 | Assessment Results Screen |
| --- | --- |
| User Action | Student clicks Download Report |
| --- | --- |
| System Response | GET /api/assessment/report/:stage/:userId → generates named report file. Download triggers automatically. |
| Navigates To | No navigation — file download |
| Data Loaded | Report file: FinalMinds_T1_Baseline_[StudentID]_[Timestamp].txt — contains metadata, readiness index, quotient breakdown, strategic recommendations |
| Validation | Assessment must be completed |
| Error State | "Report generation failed. Please try again." |
| User Action | Student clicks Download Certificate |
| --- | --- |
| System Response | GET /api/certificates/:certId/download → PDF generated with student name, programme, date, QR code, unique cert ID. |
| Navigates To | No navigation — PDF download triggered |
| Data Loaded | Certificate PDF generated from certificates collection record |
| Validation | Integrity status must be clean. Previous prerequisite certificates must be held. |
| Error State | "Certificate is pending integrity review. Contact your administrator." |
| PART 4 — STUDENT DASHBOARD SCREENS |
| --- |
| STU-010 | Dashboard Home |
| --- | --- |
| User Action | Student clicks Resume Learning |
| --- | --- |
| System Response | GET /api/courses/current → fetches active course and last accessed module. |
| Navigates To | /dashboard/course/:courseId/module/:moduleId (STU-015) |
| Data Loaded | Last watch position, module completion status, current step loaded |
| Validation | Student must have an active course enrolled |
| Error State | "No active course found. Browse courses to get started." with Browse button. |
| User Action | Student clicks on the streak flame icon or number |
| --- | --- |
| System Response | Streak detail drawer opens from the right side. |
| Navigates To | Drawer overlay on same page |
| Data Loaded | GET /api/user/streak → current streak, best streak, streak history last 30 days |
| Validation | None |
| Error State | If no streak data: "Start your learning streak today!" |
| Grid Icon | Navigates To | API Called |
| --- | --- | --- |
| My Notes | /dashboard/notes (STU-020) | GET /api/notes?userId= |
| Resources Library | /dashboard/library (STU-021) | GET /api/library/resources |
| Discussions | /dashboard/community (STU-022) | GET /api/community/posts |
| Mentors | /dashboard/mindcare (STU-023) | GET /api/coaches/available |
| Support | /dashboard/support (STU-024) | GET /api/tickets?userId= |
| Assessments | /assessment (STU-007) | GET /api/assessment/status |
| User Action | Student clicks the Continue Learning card |
| --- | --- |
| System Response | GET /api/courses/current to confirm active course and module. |
| Navigates To | /dashboard/courses (STU-013) → auto-selects current course → opens module player |
| Data Loaded | Course metadata, module list, completion status, last watch position |
| Validation | Student must have active enrolled course |
| Error State | If no course: empty state with "Start your first course" CTA |
| User Action | Student clicks an event indicator on the calendar |
| --- | --- |
| System Response | Event detail popover opens showing event name, time, type (session/assessment/deadline). |
| Navigates To | Popover inline on dashboard |
| Data Loaded | GET /api/calendar/events?date= loads event details |
| Validation | None |
| Error State | None |
| State | What User Sees |
| --- | --- |
| First login (post-T1) | 3-second Vision Board animation plays before dashboard renders |
| Normal | All zones populated with live data |
| Loading | Skeleton loaders in each zone while APIs resolve |
| No active course | "Continue Learning" card shows "Start your first course" empty state |
| Streak broken | Hero shows "Restart your streak" with encouragement copy |
| API error (stats) | Stats cards show "--" with "Data unavailable" label |
| No internet | Toast: "You're offline. Some features may not load." |
| STU-011 | Student Profile Page |
| --- | --- |
| User Action | Student clicks Edit on a profile section |
| --- | --- |
| System Response | That section's form fields become editable. Save / Cancel buttons appear. |
| Navigates To | Same page — inline edit mode |
| Data Loaded | Current field values pre-populated from student profile in MongoDB |
| Validation | Same validation rules as original wizard step |
| Error State | Validation errors shown inline. Save retry on API fail. |
| User Action | Student clicks Save Changes in edit mode |
| --- | --- |
| System Response | PATCH /api/users/profile with changed fields. Success toast: "Profile updated." |
| Navigates To | Same page — view mode restored with new data |
| Data Loaded | Only changed fields sent in PATCH payload |
| Validation | All required fields of that section must be valid |
| Error State | "Save failed. Please try again." — fields remain editable. |
| STU-012 | Skills Passport (ICAS) |
| --- | --- |
| User Action | Student clicks Download Passport |
| --- | --- |
| System Response | GET /api/skills-passport/:userId/pdf → jsPDF generates complete passport document. Download triggers. |
| Navigates To | No navigation — PDF download |
| Data Loaded | All assessment results, certificates, PLVI, badges, quotient scores |
| Validation | Student must have completed at least T1 to generate passport |
| Error State | "Passport generation failed. Please try again." |
| User Action | Student clicks Download on a specific certificate card |
| --- | --- |
| System Response | GET /api/certificates/:certId/download → certificate PDF generated with QR code. |
| Navigates To | No navigation — PDF download |
| Data Loaded | Certificate data: name, programme, date, institution, unique ID, QR verification URL |
| Validation | Certificate must exist and integrity status must be clean |
| Error State | "This certificate is pending review. Contact your administrator." |
| User Action | Student or employer scans/clicks the QR on a certificate |
| --- | --- |
| System Response | Public verification page opens at /verify/:certId — no authentication required. |
| Navigates To | /verify/:certId (public page) |
| Data Loaded | GET /api/certificates/verify/:certId → returns public certificate data |
| Validation | None — public endpoint |
| Error State | "Certificate not found. This may be invalid or expired." |
| STU-013 | My Courses Page |
| --- | --- |
| User Action | Student clicks on a course card |
| --- | --- |
| System Response | GET /api/courses/:courseId/modules → loads module list with completion status. |
| Navigates To | /dashboard/course/:courseId (STU-014) |
| Data Loaded | Course metadata, module list, completion status per module, current module pointer |
| Validation | Student must be enrolled in the course |
| Error State | "Course data unavailable. Please try again." |
| STU-014 | Course Detail Page |
| --- | --- |
| User Action | Student clicks on an unlocked module |
| --- | --- |
| System Response | GET /api/courses/:courseId/modules/:moduleId → loads steps for that module. |
| Navigates To | /dashboard/course/:courseId/module/:moduleId (STU-015) |
| Data Loaded | All 10 steps metadata, video URLs, completion status per step, last watch position |
| Validation | Module must be unlocked (previous module completed or is first module) |
| Error State | "Complete the previous module to unlock this one." |
| User Action | Student clicks on a locked module |
| --- | --- |
| System Response | Tooltip appears: "Complete [Module Name] to unlock this module." No navigation. |
| Navigates To | No navigation — tooltip only |
| Data Loaded | No API call |
| Validation | None |
| Error State | None |
| STU-015 | Module Player Screen (3-Day Learning Framework) |
| --- | --- |
| User Action | System event: video playback reaches 80% mark |
| --- | --- |
| System Response | PATCH /api/progress/video → marks video step as complete. "Next Step" button enables. Green checkmark on step in sidebar. |
| Navigates To | No navigation — same screen |
| Data Loaded | Progress: {userId, courseId, moduleId, stepId, completed: true, watchPercentage: 80+} |
| Validation | Must actually watch (seek-forward prevention active) |
| Error State | None — threshold completion triggers automatically |
| User Action | Background system event: 5-second interval timer fires |
| --- | --- |
| System Response | PATCH /api/progress/heartbeat → saves current watch position. |
| Navigates To | No navigation — background call |
| Data Loaded | {userId, courseId, moduleId, stepId, watchPosition: seconds} |
| Validation | None |
| Error State | If API fails: buffered locally, retry on next interval |
| User Action | Student clicks Next Step (after step completion threshold met) |
| --- | --- |
| System Response | Current step marked complete in DB. Next step content loads in main area. Sidebar updates. |
| Navigates To | Same route — next step loads in same player |
| Data Loaded | PATCH /api/progress/step-complete → step marked done. GET /api/courses/.../step/:nextStepId |
| Validation | Current step must meet its completion threshold (80% video / quiz pass / evidence submission) |
| Error State | "Complete this step first before moving on." |
| User Action | Student selects MCQ answers and clicks Submit |
| --- | --- |
| System Response | POST /api/assessment/micro-quiz → score calculated. Pass (≥70%): step marked complete, Next Step enables. Fail: feedback shown, retry allowed. |
| Navigates To | Pass: next step unlocks | Fail: retry state with feedback |
| Data Loaded | Answers sent, scored. Minimum pass: 70%. Score and attempt logged. |
| Validation | All questions must be answered |
| Error State | "Quiz submission failed. Please try again." |
| User Action | Student uploads file and clicks Submit Evidence |
| --- | --- |
| System Response | File uploaded to Cloudinary. POST /api/evidence/submit. Step marked complete. Reviewer notification sent (if manual review enabled). |
| Navigates To | Step complete, Next Step enables |
| Data Loaded | Evidence file URL, task rubric ID, userId, moduleId stored |
| Validation | File must be uploaded. Accepted formats: PDF, DOCX, image. |
| Error State | "Upload failed. File too large or unsupported format." |
| User Action | Student completes the last step of a module |
| --- | --- |
| System Response | Module marked complete in DB. Badge awarded if applicable. Confetti animation. Next module unlocked. POST /api/progress/module-complete. |
| Navigates To | Completion modal overlay → "Continue to Next Module" or "Return to Course" |
| Data Loaded | Module completion status updated. Badge record created if milestone reached. Next module status set to available. |
| Validation | All 9 steps (Step 0 through Step 8) must be completed |
| Error State | None — completion is triggered by step state |
| STU-016 | Vision Board Page |
| --- | --- |
| User Action | Student clicks Create New Board |
| --- | --- |
| System Response | Modal opens: board name input, category selector, cover image upload. |
| Navigates To | Modal overlay on same page |
| Data Loaded | POST /api/vision-boards → creates new board record |
| Validation | Board name required. Category must be selected. |
| Error State | "Board creation failed. Please try again." |
| User Action | Student clicks Open on a board |
| --- | --- |
| System Response | Board editor opens with existing content (images, text, goals). |
| Navigates To | /dashboard/vision-board/:boardId |
| Data Loaded | GET /api/vision-boards/:boardId → board content, goals, time horizons |
| Validation | None |
| Error State | "Board not found. It may have been deleted." |
| STU-017 | SMAART Toolkit Page |
| --- | --- |
| Tool Card | Click Action | Destination Route |
| --- | --- | --- |
| AI Career Chat | Opens AI chat interface (currently undiscoverable — TASK-17) | /dashboard/toolkit/ai-chat |
| AI Profile Analysis | Triggers profile analysis → loading → results | /dashboard/toolkit/profile-analysis |
| AI Resume Builder | Opens role-selection → resume generation flow | /dashboard/toolkit/resume-builder |
| SWOT Analysis | Opens guided SWOT wizard | /dashboard/toolkit/swot |
| Weekly Planner | Opens time-blocking calendar | /dashboard/toolkit/planner |
| Monthly Planner | Opens monthly view planner | /dashboard/toolkit/planner/monthly |
| Time Matrix | Opens Urgent/Important quadrant tool | /dashboard/toolkit/time-matrix |
| Reflection Journal | Opens journal with daily/weekly prompts | /dashboard/toolkit/journal |
| Mind Care | Opens session booking flow | /dashboard/mindcare (STU-023) |
| Knowledge Library | Opens book search (TASK-25: no backend) | /dashboard/toolkit/library |
| Dictionary | Opens dictionary/thesaurus (external API) | /dashboard/toolkit/dictionary |
| STU-018 | AI Career Chat Screen |
| --- | --- |
| User Action | Student types message and clicks Send (or presses Enter) |
| --- | --- |
| System Response | Message appears immediately in thread. "AI is typing..." indicator shows. POST /api/chatbot/message called with message + conversation history. |
| Navigates To | Same screen — AI response appended to thread |
| Data Loaded | Student profile data injected as system context. Conversation history (limited to in-memory session — TASK-03). |
| Validation | Message cannot be empty |
| Error State | If AI API unavailable: "AI features are temporarily unavailable. Please try again in a few minutes." (TASK-29) |
| User Action | Student clicks New Conversation |
| --- | --- |
| System Response | Confirmation if current conversation is non-empty: "Start a new conversation? Current chat will be lost." (Due to TASK-03 bug.) |
| Navigates To | New empty thread opens |
| Data Loaded | New conversationId generated |
| Validation | None |
| Error State | None |
| STU-019 | AI Resume Builder Screen |
| --- | --- |
| User Action | Student selects target role and clicks Generate Resume |
| --- | --- |
| System Response | POST /api/toolkit/resume-builder with studentId + targetRole. AI processes profile data. Loading animation 15–30 seconds. |
| Navigates To | Resume preview rendered on same page |
| Data Loaded | Student DNA profile data + target role sent to AI. Action + Task + Result format applied. ATS keywords for role injected. |
| Validation | Target role must be selected. Profile must have education data. |
| Error State | "Resume generation failed. The AI service may be temporarily unavailable." (TASK-29) |
| STU-020 | SMAART Wallet / Skills Vault Screen |
| --- | --- |
| User Action | Student clicks Upload Certificate |
| --- | --- |
| System Response | UserCertificateUploadModal opens. |
| Navigates To | Modal overlay on same page |
| Data Loaded | None — modal loads immediately |
| Validation | None on open |
| Error State | None |
| User Action | Student fills certificate name, issuing body, date, verification URL/QR, uploads file, clicks Submit |
| --- | --- |
| System Response | POST /api/user-certificates → file to Cloudinary → cert record created in MongoDB. |
| Navigates To | Modal closes. New certificate appears in External Certs tab. |
| Data Loaded | Certificate: name, issuer, date, verificationMode, fileUrl, userId, verificationStatus |
| Validation | Certificate name required. File required. |
| Error State | "Upload failed. Please check your file and try again." |
| STU-021 | Mind Care / Coaching Booking Screen |
| --- | --- |
| User Action | Student clicks Book Session |
| --- | --- |
| System Response | Calendar/time slot picker modal opens for selected coach. |
| Navigates To | Booking modal overlay |
| Data Loaded | GET /api/coaches/:coachId/availability → available slots for next 30 days |
| Validation | None on open |
| Error State | "No available slots. Check back later." |
| User Action | Student selects slot and confirms |
| --- | --- |
| System Response | POST /api/mindcare/book → session record created. Calendar events created for both student and coach. Email notifications sent to both. |
| Navigates To | Modal closes. Booking appears in My Upcoming Sessions. |
| Data Loaded | Session: studentId, coachId, domain, dateTime, status:scheduled |
| Validation | Slot must be available (not already booked). Student must not have conflicting session. |
| Error State | "This slot was just booked by another student. Please select another time." |
| PART 5 — AI CAREER AGENT SCREENS |
| --- |
| AGT-001 | Career Agent Landing / Onboarding Entry |
| --- | --- |
| User Action | Student clicks Start Career Analysis with no existing profile |
| --- | --- |
| System Response | Redirects to 6-step career profile onboarding wizard. |
| Navigates To | /career/onboarding (AGT-002) |
| Data Loaded | No data loaded — blank wizard |
| Validation | Student must be logged in |
| Error State | None |
| User Action | Student clicks View My Career Report |
| --- | --- |
| System Response | GET /api/career/analysis/:userId → loads cached analysis. |
| Navigates To | /career/dashboard (AGT-005) |
| Data Loaded | Full career intelligence report with 3 career paths (primary/secondary/tertiary) |
| Validation | Analysis must exist in cache/DB |
| Error State | "Report not found. Please run a new analysis." |
| AGT-002 | Career Profile Onboarding (6-Step Wizard) |
| --- | --- |
| Step | Fields | Click Action |
| --- | --- | --- |
| 1 — Personal Details | Full name, email, phone, registration number | Fill → Next → POST /api/student/profile (upsert) |
| 2 — Education | Up to 3 degrees: level, domain, degree group, specialisation, university, graduation year, pursuing? | Cascading dropdowns from educationData.json → Next |
| 3 — Primary Career Preference | Sector → Job Family → Role (cascading dropdowns) → Career Direction ID | Select → Next |
| 4 — Secondary Career Preference | Same structure as Step 3 | Select → Next |
| 5 — Tertiary Career Preference | Same structure as Step 3/4 | Select → Next |
| 6 — Skills | Multi-select skill tags or free-text entry → Review & Submit | POST /api/onboarding → triggers engine → loading screen |
| AGT-003 | Career Analysis Processing Screen |
| --- | --- |
| AGT-004 | Career Dashboard (Report View) |
| --- | --- |
| Tab | Content | Interactive Elements |
| --- | --- | --- |
| Tab 1 — Role Overview | Role description, typical employers list, salary range (min/max), AI impact on role | "Explore employers" — expands employer detail cards |
| Tab 2 — Skills Required | Must-have skills tags (red), nice-to-have tags (blue), AI tool requirements | "Add to Learning Plan" button on each missing skill |
| Tab 3 — AI & Human Skills | AI tools breakdown, human differentiator skills, automation risk % | Automation risk bar chart (Recharts) |
| Tab 4 — Skill Gap & Roadmap | Missing skills vs matched skills. Coverage %. Learning roadmap timeline. | "Start Learning" links each missing skill to relevant SMAART module |
| Tab 5 — Future Scope | 5-year growth projection, market demand trend, job posting volume | Line chart showing projected demand (Recharts) |
| User Action | Student clicks a different career path tab |
| --- | --- |
| System Response | Report content switches to selected path. Zone badge updates. All 5 content tabs reload for new path. |
| Navigates To | Same page — tab content swaps |
| Data Loaded | Data already in memory from initial analysis load |
| Validation | None |
| Error State | None |
| User Action | Student clicks Start Learning next to a missing skill |
| --- | --- |
| System Response | Navigates to the relevant SMAART module that teaches that skill. |
| Navigates To | /dashboard/course/:courseId/module/:moduleId (STU-015) |
| Data Loaded | Skill → module mapping resolved from 75-skills framework |
| Validation | Student must be enrolled in the relevant course |
| Error State | "Enrol in [Course Name] to access this module." with Enrol button. |
| User Action | Student clicks Refresh Analysis |
| --- | --- |
| System Response | Confirmation: "Run a new analysis? This will update your career report." POST /api/onboarding re-triggered with current profile. |
| Navigates To | /career/processing (AGT-003) |
| Data Loaded | Latest profile data fetched, cache invalidated for this user |
| Validation | None |
| Error State | If processing fails: "Analysis failed. Your previous report is still available." with retry. |
| AGT-005 | Detailed Role View |
| --- | --- |
| PART 6 — ADMIN DASHBOARD SCREENS |
| --- |
| ADM-001 | Super Admin Home Dashboard |
| --- | --- |
| User Action | Super Admin or Consultant clicks Onboard New College |
| --- | --- |
| System Response | Navigates to college onboarding wizard. |
| Navigates To | /colleges/onboard (ADM-004) |
| Data Loaded | No data loaded — blank wizard form |
| Validation | Role must be Super Admin or Consultant |
| Error State | None |
| User Action | Admin clicks a KPI card |
| --- | --- |
| System Response | Drills down to detailed view of that metric. |
| Navigates To | /admin/analytics?metric=students (ADM-009) |
| Data Loaded | GET /api/analytics/global?metric=students → detailed breakdown by college, department, date |
| Validation | Super Admin only |
| Error State | "Analytics unavailable. Please try again." |
| ADM-002 | College Admin Dashboard |
| --- | --- |
| User Action | College Admin clicks View At-Risk Students |
| --- | --- |
| System Response | Navigates to filtered student list showing at-risk criteria. |
| Navigates To | /college/students?filter=at-risk (ADM-006) |
| Data Loaded | GET /api/analytics/college/:collegeId/at-risk → students with completion rate <30% OR consecutive assessment fails OR open escalation |
| Validation | College Admin can only see their own college's students |
| Error State | "No at-risk students identified currently." |
| ADM-003 | User Management Page |
| --- | --- |
| User Action | Admin clicks View Detail on a user row |
| --- | --- |
| System Response | Navigates to user detail page. |
| Navigates To | /admin/users/:userId (ADM-003a) |
| Data Loaded | GET /api/users/:userId → full user schema, activity logs, associated tickets, security history |
| Validation | Must have access to that user's college scope |
| Error State | "User not found or you do not have permission to view this profile." |
| User Action | Admin clicks Deactivate |
| --- | --- |
| System Response | Confirmation modal: "Deactivate [Name]? They will lose all platform access." Confirm / Cancel. |
| Navigates To | Same page — user status updates to Inactive in table |
| Data Loaded | PATCH /api/users/:userId/status with status: inactive |
| Validation | Cannot deactivate yourself. Cannot deactivate Super Admins (from lower roles). |
| Error State | "You do not have permission to deactivate this user." |
| User Action | Admin clicks Reset Password |
| --- | --- |
| System Response | Confirmation: "Send password reset email to [email]?" POST /api/auth/admin-reset → temp password generated, emailed, first_time_login flag set. |
| Navigates To | Success toast: "Password reset email sent to [email]" |
| Data Loaded | Temp password hashed, stored. first_time_login: true set. |
| Validation | Admin must have permission over that user's scope |
| Error State | "Failed to reset password. Please try again." |
| User Action | Admin clicks Bulk Upload CSV |
| --- | --- |
| System Response | File picker opens. CSV accepted. After upload: column-mapping interface shows to match CSV headers to system fields. |
| Navigates To | Column mapping modal on same page |
| Data Loaded | CSV parsed client-side. Preview shown before submission. |
| Validation | CSV must have required columns: name, email, student_id, department, year |
| Error State | "Could not parse CSV. Please use the provided template." with download template link. |
| ADM-004 | College Onboarding Wizard |
| --- | --- |
| Tab | Fields & Actions | Validation |
| --- | --- | --- |
| Tab 1 — Institution Identity | Official name, type (College/University), governance (Private/Govt), affiliated university, email, website, contact, address, pincode, logo upload | Name + email globally unique. Logo: image file only. |
| Tab 2 — Coordinator & Admin | Coordinator: name, email, phone. College Admin account: name, email, mobile, initial password | Admin account created once only. Email must be unique in system. |
| Tab 3 — Compliance Documents | MoU/Auth Letter (PDF), Registration Proof (PDF), Chairman Introduction Video (MP4), NDA (optional PDF) | All PDFs required. MP4 required. Max file sizes enforced. |
| Tab 4 — Configuration | Max faculty accounts (default 100), max student accounts (default 1000), subscription duration (default 1 year), activate toggle | Numeric only. Max within platform limits. |
| User Action | Admin clicks Save & Proceed after Tab 1 |
| --- | --- |
| System Response | POST /api/colleges (draft) → saves institution identity. Auto-generates institution code (CLG00012 format). Proceeds to Tab 2. |
| Navigates To | Tab 2 renders |
| Data Loaded | College record created with status: draft. Institution code generated. |
| Validation | Name and email globally unique check. All required fields filled. |
| Error State | "A college with this name/email already exists." | "Please complete all required fields." |
| User Action | Admin clicks Activate College after completing all 4 tabs |
| --- | --- |
| System Response | PUT /api/colleges/:collegeId/activate → status changes Draft → Verified → Active. College Admin account created. Welcome email sent. |
| Navigates To | /colleges (ADM-005) — college appears in active list |
| Data Loaded | Full college record finalised. College Admin credentials emailed to admin account. |
| Validation | All 4 tabs must be complete. All required documents uploaded. |
| Error State | "Please complete all tabs before activating." | "Document upload failed. Please re-upload and try again." |
| ADM-005 | Colleges Management List |
| --- | --- |
| User Action | Super Admin clicks Suspend |
| --- | --- |
| System Response | Modal: "Suspend [College Name]? Students will lose access. Data is preserved." Confirm / Cancel. |
| Navigates To | Same page — college status updates to Suspended in table |
| Data Loaded | PATCH /api/colleges/:collegeId with status: suspended. All active sessions for college users killed. |
| Validation | Super Admin only |
| Error State | "Failed to suspend college. Please try again." |
| ADM-006 | Student Detail Page (Drill-Down) |
| --- | --- |
| Button | Action | Who Can Use |
| --- | --- | --- |
| Reset Password | Sends temp password to student email | College Admin, Super Admin |
| Force Logout | Kills all active sessions for this student | College Admin, Super Admin |
| Clear Integrity Flag | Resolves assessment integrity violation, unblocks certificate | Super Admin only |
| Create Escalation | Manually creates an escalation record for this student | College Admin, Coach |
| Assign Coach | Assigns a specific coach to this student | College Admin, Super Admin |
| Deactivate Account | Deactivates student account | College Admin, Super Admin |
| ADM-007 | Assessment Question Bank Manager |
| --- | --- |
| User Action | Super Admin clicks Add New Question |
| --- | --- |
| System Response | Question creation form modal opens. |
| Navigates To | Modal overlay on same page |
| Data Loaded | No data loaded — blank form |
| Validation | None on open |
| Error State | None |
| User Action | Admin fills question text, 4 options, correct answer, quotient, difficulty and clicks Save |
| --- | --- |
| System Response | POST /api/questions → question saved to question bank. |
| Navigates To | Modal closes. Question appears in list. |
| Data Loaded | Question: text, options[4], correctAnswer, quotient, difficulty, type, createdBy, createdAt |
| Validation | All fields required. Exactly one correct answer. Question text min 20 chars. |
| Error State | "Question save failed. Please try again." | "Correct answer must be selected." |
| ADM-008 | Analytics & Reporting Page |
| --- | --- |
| User Action | Admin selects date range + metric, clicks Generate Export |
| --- | --- |
| System Response | POST /api/analytics/export with params. Report generated on backend. Download triggered. |
| Navigates To | No navigation — file download (CSV or PDF) |
| Data Loaded | Aggregated data for selected scope and date range pulled from MongoDB |
| Validation | Date range must be selected. Metric type must be selected. |
| Error State | "Export failed. Please try again." with retry. |
| ADM-009 | Escalations Management Page |
| --- | --- |
| User Action | Admin/Coach clicks Mark as Resolved |
| --- | --- |
| System Response | If resolution note is empty: "Please document the action taken before resolving." If note exists: PATCH /api/escalations/:id with status: resolved, resolvedBy, resolvedAt, resolutionNote. |
| Navigates To | Escalation moves to Resolved filter. Forum locked. |
| Data Loaded | Escalation: status, resolvedBy, resolvedAt, resolutionNote updated |
| Validation | Resolution note field must not be empty |
| Error State | "Resolution failed. Please try again." |
| ADM-010 | Coach / Mentor Dashboard |
| --- | --- |
| User Action | Coach clicks on an upcoming session |
| --- | --- |
| System Response | Session detail page opens. |
| Navigates To | /coach/session/:sessionId |
| Data Loaded | GET /api/mindcare/sessions/:sessionId → student profile, session domain, past session history with this student |
| Validation | None |
| Error State | "Session not found." |
| User Action | Coach marks session complete and fills feedback form |
| --- | --- |
| System Response | PATCH /api/mindcare/sessions/:sessionId/complete → session status updated. Student notified to fill their feedback form. |
| Navigates To | Session marked complete. Removed from Today's schedule. |
| Data Loaded | Coach feedback: sessionGoals, outcomeSummary, followUpActions, studentEngagementRating, nextSessionRecommended |
| Validation | All coach feedback fields required |
| Error State | "Feedback submission failed. Please try again." |
| PART 7 — NAVIGATION ARCHITECTURE & SITEMAP |
| --- |
| Route | Screen ID | Screen Name | Auth Required |
| --- | --- | --- | --- |
| / | STU-001 | Landing Page + Institution Selection | No |
| /login | STU-002 | Login Page | No |
| /otp-verify | STU-003 | OTP Verification | No (mid-login) |
| /forgot-password | STU-004 | Forgot Password | No |
| /change-password | STU-005 | Mandatory Password Change | JWT (first-time flag) |
| /onboarding | STU-006 | Student DNA Wizard (12 Steps) | JWT (profile incomplete) |
| /assessment | STU-007 | Assessment Gate Screen | JWT |
| /assessment/active | STU-008 | Active Assessment (Proctored) | JWT + assessment session |
| /assessment/results/:stage | STU-009 | Assessment Results | JWT |
| /dashboard | STU-010 | Dashboard Home | JWT + profile + T1 done |
| /dashboard/profile | STU-011 | Student Profile | JWT |
| /dashboard/skills-passport | STU-012 | Skills Passport (ICAS) | JWT |
| /dashboard/courses | STU-013 | My Courses | JWT |
| /dashboard/course/:id | STU-014 | Course Detail | JWT |
| /dashboard/course/:id/module/:id | STU-015 | Module Player (3-Day Framework) | JWT |
| /dashboard/vision-board | STU-016 | Vision Board | JWT |
| /dashboard/toolkit | STU-017 | SMAART Toolkit Hub | JWT |
| /dashboard/toolkit/ai-chat | STU-018 | AI Career Chat | JWT |
| /dashboard/toolkit/resume-builder | STU-019 | AI Resume Builder | JWT |
| /dashboard/skills-vault | STU-020 | Skills Vault (NOT BUILT — TASK-23) | JWT |
| /dashboard/mindcare | STU-021 | Mind Care Booking | JWT |
| /dashboard/community | STU-022 | Community Platform | JWT |
| /dashboard/support | STU-023 | Support Tickets | JWT |
| /dashboard/notifications | STU-024 | Notifications Centre | JWT |
| /verify/:certId | STU-025 | Public Certificate Verification | No (public) |
| Route | Screen ID | Screen Name | Auth Required |
| --- | --- | --- | --- |
| /career | AGT-001 | Career Agent Landing | JWT |
| /career/onboarding | AGT-002 | Career Profile Wizard (6 Steps) | JWT |
| /career/processing | AGT-003 | Analysis Processing Screen | JWT |
| /career/dashboard | AGT-004 | Career Intelligence Report | JWT |
| /career/role/:roleName | AGT-005 | Detailed Role View | JWT |
| /career/roadmap | AGT-006 | Career Roadmap Visualisation | JWT |
| /career/skills-gap | AGT-007 | Skill Gap Analysis Detail | JWT |
| /career/market | AGT-008 | Market Intelligence View | JWT |
| Route | Screen ID | Screen Name | Roles |
| --- | --- | --- | --- |
| /admin/dashboard | ADM-001 | Super Admin Home | Super Admin |
| /college/dashboard | ADM-002 | College Admin Dashboard | College Admin |
| /admin/users | ADM-003 | User Management | Super Admin, College Admin |
| /admin/users/:id | ADM-003a | User Detail Page | Super Admin, College Admin, Teacher, Coach |
| /colleges/onboard | ADM-004 | College Onboarding Wizard | Super Admin, Consultant |
| /colleges | ADM-005 | Colleges Management List | Super Admin, Consultant |
| /admin/students/:id | ADM-006 | Student Detail Drill-Down | All admin roles (scoped) |
| /admin/questions | ADM-007 | Question Bank Manager | Super Admin |
| /admin/analytics | ADM-008 | Analytics & Reporting | Super Admin, College Admin |
| /admin/escalations | ADM-009 | Escalations Management | College Admin, Coach, Super Admin |
| /coach/dashboard | ADM-010 | Coach Dashboard | Coach |
| /teacher/dashboard | ADM-011 | Teacher Dashboard | Teacher |
| /consultant/dashboard | ADM-012 | Consultant Dashboard | Consultant |
| /admin/courses | ADM-013 | Course Management | Super Admin |
| /admin/courses/create | ADM-014 | Course Builder (Drag & Drop) | Super Admin |
| /admin/community | ADM-015 | Community Moderation | Super Admin, College Admin |
| /admin/notifications | ADM-016 | Notification Management | Super Admin |
| /admin/settings | ADM-017 | Platform Settings | Super Admin |
| /admin/audit-logs | ADM-018 | Audit Logs | Super Admin |
| /admin/certificates | ADM-019 | Certificate Management | Super Admin, College Admin |
| PART 8 — OPEN BUGS AFFECTING SCREENS (COMPLETE TASK LIST) |
| --- |
| Task ID | Priority | Screen(s) Affected | Bug Description | Fix Required |
| --- | --- | --- | --- | --- |
| TASK-01 | RED | All (auth middleware) | Admin secret logged to server console on every API request | Delete lines 14–19 from auth.js |
| TASK-02 | RED | All (CORS failure) | FRONTEND_URL missing → all API calls fail in production | Add FRONTEND_URL to backend .env |
| TASK-03 | RED | STU-018 (AI Chat) | Chatbot history in-memory only — lost on server restart | Migrate to MongoDB ChatHistory model |
| TASK-04 | YELLOW | Backend security | Real API keys potentially committed to git repository | Git audit + rotate keys + use secrets manager |
| TASK-05 | YELLOW | All API routes | Global rate limiter defined but not applied to /api routes | Add generalLimiter to server.js |
| TASK-06 | YELLOW | Admin analytics | PPI cron job fails silently with no alert or retry | Add error email + retry in cronJobs.js |
| TASK-07 | YELLOW | STU-020 (Vault) | skills-vault route renders DashboardHome (wrong page) | Build SkillsVault.jsx and wire route |
| TASK-08 | YELLOW | STU-010 (Home) | Dashboard.jsx shows hardcoded fake stats (12/5/28) | Wire to live API or delete legacy file |
| TASK-09 | YELLOW | Backend logs | Deprecated Mongoose options create console noise | Remove useNewUrlParser/useUnifiedTopology |
| TASK-10 | RED | All frontend API | VITE_API_URL missing → localhost fallback fails in prod | Add VITE_API_URL to frontend .env |
| TASK-11 | YELLOW | STU-012 (Passport) | "View Reports" and "Share Profile" buttons have no onClick | Wire buttons to report view and clipboard copy |
| TASK-12 | YELLOW | STU-012 (Passport) | SEQ quotient missing from radar chart (6 axes not 7) | Add SEQ to quotientsInfo + update RadarChart to 7 axes |
| TASK-13 | YELLOW | STU-020 (Wallet) | Flashcards are hardcoded for every user (not personalised) | Fetch from API by enrolled course, fallback to defaults |
| TASK-14 | YELLOW | STU-010 (Home) | Old Dashboard.jsx reads sessionStorage directly (not useUser) | Replace with useUser() hook from UserContext |
| TASK-15 | YELLOW | All dashboard routes | AssessmentFlowGuard re-fetches on every route change (perf) | Move fetch to mount only, not location.pathname |
| TASK-16 | YELLOW | STU-002 (Login) | "Remember Me" non-functional — sessionStorage clears on tab close | Implement localStorage fallback for auth token |
| TASK-17 | YELLOW | STU-017 (Toolkit) | AI Career Chat not listed as a card in toolkit hub | Add AI Career Chat card to toolkitSections[] |
| TASK-20 | RED | All admin routes | Admin bypass uses plain-text secret header (security risk) | Remove bypass header mechanism entirely |
| TASK-21 | YELLOW | Auth system | JWT secret should be rotated and secured | Generate new strong JWT secret, update all envs |
| TASK-23 | RED | STU-020 (Vault) | SkillsVault page component does not exist at all | Build SkillsVault.jsx from scratch |
| TASK-24 | YELLOW | STU-022 (Community) | Group chat is not real-time (no WebSocket/polling) | Implement polling or Socket.io for real-time messages |
| TASK-25 | YELLOW | STU-017 (Library) | Library has no backend data source — may be broken | Create Library model or integrate external API |
| TASK-29 | YELLOW | STU-018, STU-019 | AI tools depend on free API tier — rate limits cause failures | Add error messages + fallback model + upgrade plan |
| TASK-31 | YELLOW | Backend codebase | 100+ debug scripts in backend root causing confusion | Move to /scripts/debug/ + add to .gitignore |
| TASK-33 | YELLOW | All student pages | No global loading state standard — flash of empty content | Standardise if (loading) return <PageLoader /> pattern |