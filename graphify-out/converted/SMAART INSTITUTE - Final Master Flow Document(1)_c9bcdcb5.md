<!-- converted from SMAART INSTITUTE - Final Master Flow Document(1).docx -->



SMAART INSTITUTE

End-to-End Master Documentation

Complete System Architecture, Workflows & Functional Specifications


# SECTION 1 — PROJECT OVERVIEW

## 1.1  Vision and Mission
SMAART Minds is a comprehensive, AI-powered Learning Management and Career Readiness Platform built specifically for higher-education institutions across India. The platform functions as a personalised, 24/7 career coach for every enrolled student, bridging the critical gap between academic output and industry expectations.
The vision of SMAART Minds is to become the most trusted employability infrastructure for Indian higher education — a system where every student graduates not only with a degree but with a verified, data-backed professional identity that employers can trust.
The mission is threefold: to accurately diagnose each student's current readiness level, to prescribe and deliver a structured skill-building journey, and to issue verifiable digital credentials that prove competence in a format that the modern job market can immediately act on.

## 1.2  The Problem Being Solved
Three fundamental problems plague Indian engineering and professional graduates today, and SMAART Minds was engineered specifically to address each one:
Lack of self-awareness: Students graduate without clearly understanding their own strengths, weaknesses, and the specific cognitive and professional skills they possess or lack.
Lack of career readiness: Academic curricula teach domain knowledge but rarely teach the behavioural, digital, and professional execution skills that employers consistently rank as most important.
Lack of verifiable credentials: Even when students develop skills, they have no credible, tamper-proof way to demonstrate that growth to potential employers beyond a paper degree.
The platform solves these three problems through a structured four-stage model the documentation refers to as the 'Clinic Analogy' — Diagnosis (Assessment), Prescription (Personalised Learning Path), Treatment (Structured Courses), and Certification (Skills Passport).

## 1.3  Target Users
The platform is designed to serve five distinct categories of users, each with tailored access and functionality:
Students (UG and PG): The primary users of the platform. Students interact with the learning journey, assessments, and career tools. The system supports undergraduate engineering students, postgraduate engineering students, and non-engineering domains across both UG and PG levels.
College Administrators: Institutional leaders who manage student rosters, monitor engagement, view analytics, and oversee their institution's overall platform performance.
Teachers and Faculty: Academic staff who track student progress, review course performance, and identify learners who need academic intervention.
Coaches and Mentors: Certified wellness and career professionals who conduct scheduled Mind Care sessions, handle escalations, and provide one-on-one support.
Super Admins and Consultants: Platform-level administrators who onboard new institutions, manage global configuration, create course content, and monitor system-wide analytics.

## 1.4  Platform Purpose and High-Level Concept
At its core, SMAART Minds operates on a sequential, gated progression philosophy. A student cannot skip stages; each phase unlocks only when the previous phase is completed. This ensures data integrity and guarantees that every student's journey is built on a genuine baseline rather than assumptions.
The platform integrates three distinct layers of value simultaneously. The first is an intelligent assessment engine that measures seven quotients of professional readiness across four test stages (T1 through T4). The second is a structured Learning Management System that delivers 75 skills across 15 modules using a proprietary 3-Day Learning Framework. The third is a credentialing and career intelligence layer that generates verified Skills Passports, issues stackable certificates, and produces a Placement Probability Index (PPI) that tells students and employers exactly how job-ready the student is at any given moment.

# SECTION 2 — SYSTEM ARCHITECTURE OVERVIEW

## 2.1  High-Level Architecture
SMAART Minds is built on the MERN stack — MongoDB, Express.js, Node.js, and React.js. This modern, JavaScript-first architecture was chosen because it offers a unified development language across both frontend and backend, excellent performance for data-intensive operations, and a flexible document-based database model that suits the complex, multi-layered data structures required by assessment and learning management systems.
The platform follows a client-server model with a clearly separated frontend and backend. The frontend is a single-page React application that communicates with the backend exclusively through a RESTful API layer. The backend handles all business logic, scoring calculations, data validation, and third-party integrations.

## 2.2  Major System Modules

## 2.3  Platform Layers
### Frontend Layer
The frontend is built with React 18.3 and bundled with Vite 5.4 for high-performance development. The UI component system is built on Radix UI primitives styled with Tailwind CSS, providing an accessible and responsive design. TanStack Query (React Query) manages server-state synchronisation, ensuring that data displayed in dashboards is always current without unnecessary re-fetches. Routing is handled by React Router DOM v6. Animations are powered by Framer Motion, form validation by React Hook Form with Zod schemas, and chart rendering by Recharts.
### Backend Layer
The backend runs on Node.js with the Express.js framework. MongoDB with Mongoose ODM serves as the primary database. Authentication is stateless using JWT tokens combined with bcrypt password hashing and time-based OTP verification for two-factor login security. File uploads are processed through Multer middleware and stored on Cloudinary. Email notifications use Nodemailer. Security is reinforced through Helmet (HTTP headers), CORS configuration, and Express Rate Limit middleware. Application logs are captured through Winston and Morgan.
### Integration Layer
The platform integrates with several external services. Cloudinary handles all media storage including profile photos, document uploads, and course videos. AI-powered Toolkit tools use Deepseek r1058 and NVIDIA Nemotron-3-Nano (30B) models. The Knowledge Library integrates Amazon Books and Google Books APIs. The Dictionary tool connects to DictionaryAPI.dev and Datamuse. Certificate verification uses QR code generation, and the system is designed with optional blockchain-backed tamper-proofing for credentials.

## 2.4  Data Flow Between Components
When a student logs in, the frontend sends credentials to the Express API, which validates them against the MongoDB Users collection, generates a JWT on success, and returns it to the client. All subsequent API calls include this JWT in the Authorization header. The backend middleware validates the token and extracts the user role before routing the request to the appropriate controller.
Assessment data flows from the frontend in real-time — each answered question is sent to the backend, scored immediately, and stored in the BaseLineResult or equivalent collection. This prevents data loss if a session interrupts. Course progress is similarly persisted every five seconds via a background update API call.
The Career Intelligence Engine receives the student's education profile, job preferences, skills, and assessment scores as inputs, runs them through matching algorithms against the degree_role_recommendations table, and returns a ranked set of recommended roles along with skill gap analysis and a personalised learning roadmap as output.

# SECTION 3 — USER PLATFORM: COMPLETE STUDENT JOURNEY

The student journey is divided into seven phases that follow a strict sequential progression. Each phase is a prerequisite for the next, ensuring data completeness and preventing students from accessing advanced features before establishing a valid baseline.

## 3.1  Phase 1 — Access and Authorization
### Landing Page and Institution Selection
Every student's journey begins at the SMAART Minds landing page, which presents the platform's value proposition, partner institution logos, and a 'Get Started' call-to-action. The very first mandatory interaction is institution selection. A modal appears requiring the student to select their college or university from a verified partner list before any further action is possible. This is not merely a UX choice — the selected institution pre-populates key profile fields, scopes the student's access to institution-specific content, and ensures that the login session is validated against the correct institutional domain.
The technical implementation uses session storage to persist the selected institution, and the system validates the partnership status of the chosen institution on the backend before proceeding.

### First-Time Login and OTP Verification
Students log in using a Student ID or username and a temporary password provided by their institution administrator. On submission, the system validates credentials against the database and immediately sends a time-based six-digit OTP to the student's registered email address or mobile number. The OTP has a five-minute expiration window with a resend option available after sixty seconds. The account is locked after five consecutive failed attempts as a security measure.

### Mandatory Password Change/ Forget Passoword
On detecting the first-time login flag in the database, the system forces a mandatory password change before any other action is permitted. The new password must meet strict complexity requirements: a minimum of eight characters including at least one uppercase letter, one number, and one special character. A password strength indicator guides the student through this process. Once completed, the first-time login flag is cleared and the student proceeds to the onboarding phase.

## 3.2  Phase 2 — Onboarding and Student DNA (12-Step Profile Wizard)
The onboarding process is a structured 12-step profile wizard designed to build a comprehensive 'Student DNA' — a detailed digital profile that powers the platform's personalisation engine. The estimated completion time is 15 to 20 minutes. Each step is described in detail below.

### Step 1 — Profile Photo
The student uploads a professional photograph. Accepted formats are JPG and PNG with a maximum file size of 5MB. An image crop tool is provided. The image is stored via Cloudinary integration.
### Step 2 — Personal Details
Core identity fields are collected: full name (pre-filled from registration), preferred nickname, date of birth (minimum age 16, no future dates), gender, mobile number, email (read-only), institution (pre-filled), department, current year of study, expected year of passing, and education level/domain. The domain dropdown includes seventeen categories spanning IT, AI and Data Science, FinTech, Healthcare, Manufacturing, and others, with an 'Other' option that triggers a custom text field.
### Steps 3 and 4 — Secondary and Higher Secondary Education
The student documents their 10th and 12th standard academic records including school name, year of passing, percentage or CGPA (validated in the range 0 to 100), board affiliation, stream (Science/Commerce/Arts/Others), and mandatory marksheet upload.
### Step 5 — Higher Education
This is a dynamic multi-entry section supporting multiple degree records. For each degree, the student enters qualification level, degree name, specialisation, institution name, university, year of passing, CGPA, degree status (pursuing or completed), and a mandatory certificate upload.
### Step 6 — Extracurricular Activities
An optional section where students document sports, arts, volunteering, or leadership activities. Each entry captures the activity type, participation level (from school to international), achievements, and description. Students can mark this section as 'Not Applicable' if no activities exist.
### Steps 7 and 8 — Job Preferences and Sector Preferences
Students enter up to three layers of job preferences — Primary, Secondary, and Tertiary. For each preference, the system collects preferred job role (searchable from a database of 3,000+ roles), job type, preferred locations (up to three cities), willingness to relocate, expected salary range (from 0-3 LPA to 50+ LPA), and preferred organisation type. Up to three industry sectors are selected from fifteen predefined options including IT, AI, FinTech, Healthcare, EdTech, and others.
### Step 9 — Career Goals
Students articulate their professional and personal goals across three time horizons: short-term (0–1 year), medium-term (1–5 years), and long-term (5+ years). These goals are stored and later used to personalise the learning path and vision board features.
### Steps 10, 11, and 12 — Work Experience, Projects, and Certifications
Optional sections allow students to document professional experience (with document uploads such as offer letters and experience letters), real-world projects (with GitHub or Google Docs URL validation), and external certifications (with verification mode selection: URL, QR code, or unverified).

### Profile Submission and Auto-Redirect
On submission, all data is sent to the /api/users/register-details endpoint, files are uploaded to Cloudinary, and the profile is saved to the database. The session storage is updated to reflect profile completion. After a three-second success animation, the student is automatically redirected to the T1 Baseline Assessment.

## 3.3  Phase 3 — T1 Baseline Assessment
The T1 Baseline Assessment is the foundational diagnostic of the entire platform. Its purpose is to establish the student's starting profile across six key professional quotients before any learning or intervention takes place. This baseline score (S_baseline) is the reference point against which all future growth is measured.

### Assessment Structure
Assessment Code: ASM00001. The test contains 36 multiple-choice questions (four options, one correct answer), is untimed to reduce performance anxiety, but enforces a minimum five-second reflection period per question to prevent random clicking. Questions are selected through a stratified sampling algorithm that guarantees the exact distribution of questions per quotient shown in the table below.

### Proctoring and Anti-Cheat Mechanisms
The assessment runs in a distraction-free interface with several integrity safeguards active: right-click is disabled to prevent copying questions, copy and paste actions are blocked, screenshot detection blocks the PrintScreen key, and tab-switch detection monitors when the student leaves the assessment window. Students receive a warning on each violation, and after three warnings the system automatically submits the assessment.

### Scoring and Band Classification
Each question uses binary scoring — one point for a correct answer and zero for an incorrect answer. For each quotient, the percentage score is calculated as (Correct Answers ÷ Total Questions in Quotient) × 100. The overall Baseline Score (S_baseline) is the average of all six quotient percentage scores. Every score is then mapped to one of five proficiency bands:

### Results Display and Report Download
After submission, the student sees an animated results screen showing their overall Baseline Score, Stage Band, and a detailed breakdown by quotient including the performance ratio (e.g., 5 correct out of 7) and an animated progress bar. A downloadable text report is generated containing student metadata, the Readiness Index, quotient-wise breakdown, and automated strategic recommendations based on the identified gap areas. The report file is named FinalMinds_T1_Baseline_[StudentID]_[Timestamp].txt and all results are persisted in the BaseLineResult MongoDB collection.

## 3.4  Phase 4 — Dashboard and Core Productivity Tools
### Dashboard Layout
On first login to the dashboard (after assessment completion), a three-second Vision Board splash animation plays to set the motivational tone. The main dashboard is organised into a hero section and two content columns. The hero section displays a personalised welcome message, the student's daily streak count, weekly goal progress, and a 'Resume Learning' button.
The left column shows a 'Continue Learning' card with the current course thumbnail, module progress indicators, and classmate avatars. A Quick Access Grid provides six shortcut icons: My Notes, Resources Library, Discussions (Community), Mentors, Support, and Assessment links. The right column contains a calendar widget with event indicators, an Active Tasks panel with real-time task management, and an optional Premium Upgrade card.

### Vision Boards
The Vision Boards feature allows students to create visual representations of their goals across five categories: Career Vision, Academic Goals, Personal Development, Financial Goals, and Custom Boards. Students can add images, text, and goal statements categorised by time horizon (short, medium, long-term). Boards can be shared with mentors for guidance, and progress against vision goals is tracked over time.

### SMAART Toolkit
The SMAART Toolkit is a comprehensive suite of AI-powered and standard productivity tools. The name is an acronym for Specific, Measurable, Achievable, Action-oriented, Relevant, and Time-bound — the goal-setting philosophy underpinning the platform. The toolkit includes:
AI Career Chat: A 24/7 intelligent career strategist powered by Deepseek r1058 and NVIDIA Nemotron-3-Nano (30B). It provides contextualised career guidance, interview preparation, and industry trend analysis.
AI Profile Analysis: Analyses the student's skills, education, and goals to perform a real-time skill gap analysis, trajectory visualisation, and personalised learning plan generation.
SMAART AI Resume Builder: Generates ATS-optimised professional resumes tailored to specific job roles. The AI uses action-oriented language (Action + Task + Result format) and creates role-specific content from the student's verified profile data.
SWOT Analysis Tool: Guides students through a structured self-assessment of strengths, weaknesses, opportunities, and threats with automated action plan generation.
Weekly and Monthly Planners: Time-blocking calendars with habit tracking and milestone management.
Time Management Matrix: Urgent/Important quadrant analysis for task prioritisation.
Reflection Journal: Daily and weekly reflection prompts with gratitude practice and growth tracking.
Mind Care Sessions: Connects students with certified coaches for Academic, Career, Mental Health, and Personal development sessions via a multi-domain booking engine.
Knowledge Library: Powered by Amazon Books and Google Books APIs, providing access to millions of books searchable by title, author, or ISBN with real-time previews.
General Dictionary and Thesaurus: A professional terminology tool using DictionaryAPI.dev and Datamuse, supporting audio pronunciation and synonym discovery.

## 3.5  Phase 5 — The Learning Journey
The Learning Journey is the core skill-building engine of the platform. Courses are delivered through a proprietary 3-Day Learning Framework, which is grounded in three learning science principles: narrative transportation theory (stories create emotional memory), schema theory (frameworks organise and retrieve knowledge), and constructivism (learning by doing creates deeper understanding).

### The 3-Day Learning Framework
Each skill module is structured as a three-day experience totalling approximately 1.5 to 2 hours of active engagement. The structure follows 10 sequential steps (Steps 0–9):
Day 1 — Cognitive Priming and Emotional Engagement (14 minutes of video):
Step 0 (Skill Orientation, 2 minutes): A short video explaining What the skill is, Why it matters, and Where it will be applied. This cognitive priming step orients the learner before emotional investment begins.
Step 1 (Story Episode, 12 minutes): A narrative-driven video that introduces characters, presents a challenge, shows a critical decision moment, and reveals the consequence. Stories bypass analytical resistance and create lasting emotional connection to the skill.
Day 2 — Framework and Transferability (12 minutes of video):
Step 2 (SMAART Framework, 7 minutes): The story from Day 1 is deconstructed into a reusable mental model with a step-by-step methodology and visual diagrams.
Step 3 (Domain Scenario Skin, 5 minutes): The same framework is applied to a different industry or context, demonstrating transferability and building adaptability.
Day 3 — Micro-Assessment and Application (3 minutes video + 50–80 minutes student work):
Step 4 (Micro-Assessment, 10–15 minutes): Scenario-based MCQ questions and decision trade-off questions test comprehension and application ability.
Step 5 (Evidence Task / Artefact, 20–30 minutes): Students create tangible proof of application — a decision note, checklist, framework application document, or analysis report — evaluated against a provided rubric.
Step 6 (NVQ-Style Reflection, 10–15 minutes): Likert scale self-assessment statements and forced-choice prompts encourage the student to commit to applying the skill within seven days.
Step 7 (Founder Congratulatory Video, 3 minutes): A motivational message from the founder reinforces identity building ('You are now someone who...') and provides encouragement to continue.
Step 8 (Flashcard and Interview Prep): A one-page PDF reference guide with key framework points, a decision checklist, and common interview questions on the skill — portable reference material.
Step 9 (Post-Employment Application Trigger, optional): Unlocked after the student secures an internship or job, this reflection captures real-world application data for longitudinal outcome tracking.

### Course Structure and Progression Logic
Each course consists of up to 25 modules, with each module representing one skill from the 75-skills framework. Modules are sequentially locked — a student cannot access Module 2 until Module 1 is fully completed. Video progress is tracked in real time, and a module is considered complete only when the student has watched at least 80% of each video, submitted all required tasks, and achieved the minimum required score on the micro-assessment.
The full course architecture spans 75 skills across 15 modules organised in three progressive phases: Capacity (Months 1–3, Modules C1–C5), Capability (Months 4–7, Modules P1–P5), and Leadership (Months 8–10, Modules L1–L5). The total video content across all 75 modules is approximately 36 hours, with total student learning time of approximately 112 hours.

## 3.6  Phase 6 — Advanced Assessments (T2, T3, and T4)
Beyond the T1 Baseline, the platform administers three further assessments as the student progresses through the learning phases. Each assessment is a 'Validation Gate' — it can only be unlocked after completing the prerequisite learning phase.

### Scoring Formula
From T2 onwards, the Readiness Index for each stage is not a simple average but a weighted calculation: S_stage = Sum of (Raw Quotient Score × Quotient Weight for that Stage). The mathematical weights per stage are defined in the stage_quotient_weights.csv configuration file. For example, at T2, CRQ, SRQ, LQ, and PEQ each carry a weight of 0.20, while DAQ and SEQ carry 0.10 each. The weights shift at T3 (more emphasis on SIQ and PEQ) and at T4 (all seven quotients active, with increased SEQ and DAQ weight).

### Performance Thresholds
The system uses absolute criterion-based benchmarks. A score of 75 or above earns a Pass with Distinction. A score between 60 and 74 earns a Pass. A score below 60 is classified as Not Yet Competent, and the student must re-engage with the learning material before retaking the assessment.

### Additional Specialised Assessments
The platform also offers seven supplementary diagnostic assessments available from the dashboard at any time: Big Five Personality Assessment, VAK Learning Style Assessment (Visual/Auditory/Kinesthetic), Emotional Intelligence (EQ), Creativity Quotient (CQ), Spiritual Quotient (SQ), Adaptability and Resilience Quotient (ARQ), and AI Literacy Quotient (AIQ). These feed additional dimensions into the student's Skills Passport.

## 3.7  Phase 7 — Certification and Recognition
### The Personal Learning Velocity Index (PLVI)


### Certificate Issuance Logic
Certificates are issued through a stacked, prerequisite-enforced system. C1 is issued after passing T2. C2 is issued after passing T3 and only if C1 has been achieved. C3 (the Diploma) is issued after passing T4 and only if both C1 and C2 are held. Additionally, the system checks an Integrity Status flag — if any assessment integrity violations have been recorded, the certificate issuance is blocked pending review.
### Certificate Content and Verification
Each certificate contains the student's full name, programme title, completion date, institution name, a unique certificate ID, a QR code for public verification, and a digital signature with SMAART Minds branding. Certificates are available in PDF download, PNG image, and shareable link formats, and are designed to be embeddable in LinkedIn profiles. The public verification page allows anyone to scan the QR code or enter the certificate ID to authenticate the credential and view its full details.
### Skills Passport (ICAS)
The Skills Passport (also referred to as ICAS — Industry Credentialing and Assessment System) is the consolidated professional identity document generated from the student's entire journey. It displays all assessment scores across T1–T4, band progression, skill acquisitions, course completions, certifications earned, and the final PLVI score. The passport is rendered with Recharts visualisations including a Skill Radar Chart and growth timelines, and is downloadable as a professional PDF. It functions as the student's verified digital employability ID — shareable with employers as proof of genuine, tested competence.

## 3.8  Supporting Features Throughout the Journey
### Badges and Streaks System
The gamification layer awards badges for course completion, skill mastery, assessment excellence, streak maintenance, and community contributions. Daily login streaks are tracked and displayed in the dashboard hero section. Streak badges unlock at defined milestones (e.g., 7 days, 30 days). All badges are displayable on the student's profile, Skills Passport, and can be shared on social media.
### Notifications System
The notification centre aggregates real-time system alerts including session reminders, assessment availability, task deadlines, community mentions, and escalation updates. Notifications support deep links — clicking an alert about an upcoming coaching session navigates directly to the session view. Students can mark notifications as read, delete them, or act on them with a single click.
### Community Platform
The community section provides discussion forums, study groups, peer connections, and mentor interactions. The system includes content moderation to prevent inappropriate content. Community participation feeds into the engagement tracking system and contributes to the overall PPI calculation as a signal of active learning behaviour.
### Case Logs
Case logs automatically record significant student activities, behavioural patterns, and system interactions. This data feeds into the admin analytics layer and provides a timestamped audit trail for each student. Admins and coaches use case logs to identify students who may need additional intervention.
### Mindcare Sessions
The Mind Care module connects students with certified coaches for mental wellness support. Students can book sessions across four domains: Academic (study strategies and assignment support), Career (job transition and professional growth), Mental Health (stress management and anxiety support), and Personal (life skills and confidence building). Coaches confirm sessions, and after each session both the student and coach complete mandatory feedback forms for KPI tracking.
### System Guide and Help Resources
A dedicated System Guide section provides help videos explaining each platform feature and downloadable PDF documentation for offline reference. A Support ticket system allows students to submit issue descriptions with severity levels, and the IT support team manages resolution through a threaded chat interface.

# SECTION 4 — ADMIN PLATFORM: ROLES AND CAPABILITIES

The admin ecosystem operates on a strictly enforced Role-Based Access Control (RBAC) model. The platform distinguishes between six administrative roles, each with precisely scoped capabilities. Importantly, the admin portal and student portal are entirely separate applications — students attempting to log in through the admin portal are explicitly rejected with a warning message directing them to the student application.

## 4.1  Role Hierarchy

## 4.2  Authentication and Security
Admin authentication uses a two-factor flow identical in structure to the student flow but operates on a separate credential space. After entering email and password, admins receive a six-digit OTP via email with a 60-second unresendable countdown. The system validates credentials, checks the role flag, and routes the successful login to the appropriate role-specific dashboard. Password complexity requirements are enforced (minimum 8 characters, uppercase, lowercase, number, and special character).
Security interventions available to Super Admins include forcing a password reset on any user account, remote session killing for compromised accounts, and reviewing activity logs that display timestamped database mutations and active IP address logins.

## 4.3  Admin Dashboards
Each role receives a custom dashboard tailored to their operational context. The Super Admin dashboard displays macro-statistics including total platform user count, college onboarding metrics, active server sessions, and financial analytics charts. The College Admin dashboard shows active student engagement within the specific college, department statistics, and staff metrics. The Consultant dashboard displays the onboarding pipeline, CRM interactions, and college-raised tickets. The Coach dashboard focuses on calendars, upcoming scheduled sessions, escalations, and session feedback completion rates. Teacher and Student dashboards show classroom activities, enrolled/taught courses, grading queues, and next assessment tasks.

## 4.4  Institution Onboarding (College CRM)
The institution onboarding flow is a multi-tab wizard accessed at /colleges/onboard. It is one of the most data-intensive processes in the admin system and must capture complete, verifiable institutional data before the college is activated on the platform.
### Institution Identity
Required fields include the official registered name, auto-generated institution code (e.g., CLG00012), institution type (College or University), governance type (Private or Government), affiliated university, official email, website, contact number, postal address, pincode, and logo upload. The college name and email must be globally unique across the platform.
### Coordinator and Admin Account
A primary coordinator is designated as the single point of communication between the platform and the institution. Separately, a College Admin account is created with full credentials (name, email, mobile, and initial password). This admin account is created only once during onboarding and the credentials cannot be changed post-activation.
### Compliance Documentation
Mandatory document uploads include the MoU or Authorisation Letter (PDF), Registration Proof (PDF), and the Chairman Introduction Video (MP4). The Chairman Introduction Video is a required onboarding asset that is shown to students on their first login — it serves as an institutional welcome and sets the tone for the student's journey on the platform. NDA documentation is optional.
### Platform Configuration and Validity


## 4.5  Student and Teacher Account Management
Student registration follows two paths: manual entry through a form or bulk upload using a pre-formatted CSV template. Bulk uploaded students are assigned to structural batches, graduation years, and specific degree programmes. Teachers follow the same lifecycle with department assignment. The bulk upload process includes a column-mapping interface to handle variations in template formatting.
Individual student and teacher accounts can be viewed, edited, and deactivated. The user engine (accessible at /users and related routes) provides a paginated data table of all non-student entities on the platform, with detailed schema cards showing activity logs, associated support tickets, and security intervention history.

## 4.6  Assessment Question Management
The question bank is a critical system component. The master question bank targets 300 questions across seven quotients (CRQ, SRQ, LQ, SIQ, PEQ, DAQ, and SEQ). Each quotient has a target count designed to support randomised sampling without item reuse across test sessions. Questions are classified by difficulty (Easy, Medium, Hard) at the following target distributions:
The assessment creation interface supports multiple question types (Multiple Choice, True/False, Short Answer) with point allocations per question, time limits, pass percentage bounds, and attempt limits. Completed assessments are assigned to specific colleges, global courses, or isolated student batches.

## 4.7  Analytics and Reporting
The global analytics dashboard aggregates data across the entire platform using Chart.js and Recharts. It renders demographic pie charts, daily active login line graphs, and course completion bar charts. College-level reports are generated on demand — administrators select a timeline range, click 'Generate Export,' and receive a formatted CSV or PDF ledger for download.


## 4.8  Community Moderation
Admins and designated moderators have access to community moderation tools that enable reviewing flagged content, removing policy-violating posts, and issuing warnings to users. The moderation system includes automated keyword scanning for high-risk content, which can trigger an escalation event in the admin system requiring human review.

## 4.9  Coaching and Escalation Subsystem
When automated system parameters flag a concern — such as a student consistently failing assessments or a Mental Health keyword trigger from the Emotion Coach chatbot — an Escalation record is automatically created in the admin system. Each escalation has its own micro-forum accessible to Admins and the assigned Coach, where internal notes are appended debating the best course of action. The escalation is marked as Resolved only when a concrete action has been taken and documented. This creates a full audit trail of intervention history.

# SECTION 5 — LEARNING MANAGEMENT SYSTEM (LMS)

## 5.1  The 75 Skills Framework
The SMAART Institute 75 Skills Framework is the intellectual core of the platform's curriculum. Rather than offering hundreds of loosely defined competencies, the framework distils the most critical employability skills identified from OECD, World Economic Forum, and US/UK global benchmarks into exactly 75 high-impact, measurable skills. These are organised into 15 modules of five skills each, aligned with NVQ Level 7 standards.
Every skill maps to one of seven professional quotients, ensuring holistic development across cognitive, behavioural, social, digital, and ethical dimensions. The framework is sector-agnostic at its core, meaning the same 75 skills apply to engineering, management, healthcare, and other domains, with domain-specific 'skin' applied through the Domain Scenario videos in each module.


## 5.2  Course Creation Workflow
Course creation is a multi-step process accessible to Super Admins and designated content creators. The workflow proceeds in four stages. First, the overarching course metadata is defined — course name, meta description, difficulty level (Beginner, Intermediate, Advanced), and cover art thumbnail. Second, the Course Builder (an interactive drag-and-drop canvas) is used to create Modules (Chapters) and Lessons within them. Third, prerequisite-locking rules are configured — administrators determine whether each module requires completion of the previous module before it becomes accessible to students. Fourth, granular content injection fills each step with video URLs (Cloudinary-hosted, YouTube-embedded, or Vimeo-integrated), PDF resources, interactive widgets, and rich-text descriptions.

## 5.3  Content Quality Assurance


## 5.4  Video and Progress Management
The video player supports play/pause, volume control, playback speed (0.5x to 2x), fullscreen mode, and auto-save of the watch position every five seconds. The completion threshold is set at 80% of video duration — a student must watch at least 80% of each video for it to register as complete. The system prevents students from skipping forward to mark videos as complete without actually watching them. The backend update API call runs every five seconds to persist progress, preventing data loss from browser closures or connection interruptions.

# SECTION 6 — ASSESSMENT ENGINE

## 6.1  Assessment Architecture Philosophy
The SMAART assessment engine is built on criterion-based validation rather than normative ranking. This is a deliberate philosophical choice: students are not graded against each other but against absolute benchmarks of professional competence. This aligns with NVQ Level 7 principles and ensures that a certificate carries a 'Competence Guarantee' rather than a relative performance signal that varies by cohort.
The system's unique selling proposition is the Personal Learning Velocity Index (PLVI), which shifts the conversation from 'what is your score?' to 'how fast are you growing?' This rewards effort and learning agility rather than prior advantage, making it more equitable for students from diverse educational backgrounds.

## 6.2  Question Bank Architecture
The question bank is designed to support randomised sampling without item reuse within a student's journey. The 300-question target bank is structured as a configuration-first architecture — all scoring logic, weights, thresholds, and certificate rules are stored in validated CSV configuration files rather than hardcoded. This makes the system auditable, updateable, and transparent. The key configuration files are:
stage_test_config.csv: Defines test parameters for each stage.
stage_quotient_weights.csv: Contains the mathematical weighting per quotient per stage.
stage_pass_thresholds.csv: Defines competence benchmarks for each assessment.
certificate_issuance_rules.csv: Specifies prerequisite and stacking logic for certificate issuance.
plvi_config.csv: Defines growth signal interpretation bands for the PLVI calculation.

## 6.3  T1 vs. T2/T3/T4 Question Structure
T1 is specifically structured to exclude the SEQ (Ethical and Sustainability) quotient because the baseline measurement focuses on core entry-level signals. SEQ is introduced at T3 and becomes a full component at T4. The difficulty distribution also progresses across stages — T1 has a more lenient 30% Easy / 50% Medium / 20% Hard split for UG students, while T4 has a demanding 15% Easy / 45% Medium / 40% Hard split, reflecting the leadership-level expectations of the final assessment.
UG and PG students receive different question distributions within T1 to account for their different starting points. PG students face fewer Easy questions and a higher proportion of Hard questions, reflecting the expectation that postgraduate students have stronger foundational competencies.

## 6.4  Proctoring and Integrity System
The assessment environment enforces five integrity mechanisms: right-click disable, copy/paste block, screenshot detection, tab-switch monitoring, and an exit prevention system that blocks the browser's back button during an active assessment. Each violation is logged and displayed as a warning to the student. After three warnings, the system automatically submits the current state of the assessment. The Integrity Status flag is recorded in the database and is checked before any certificate issuance. Any student with an unresolved integrity violation cannot receive a certificate until the flag is cleared by an administrator.

## 6.5  Result Calculation and Storage
Results are calculated and stored in real time. The five-second minimum per question prevents automated rapid-fire submissions. On final submission, the scoring engine calculates all quotient scores, the weighted stage score, the PLVI (for T2, T3, and T4), and the certificate eligibility status. All results are stored in the BaseLineResult MongoDB collection for T1 and equivalent collections for subsequent stages. Each result document contains the userId, all quotient raw scores and band levels, the overall stage score, the PLVI value, and the assessment timestamp.

## 6.6  Report Architecture


# SECTION 7 — ANALYTICS AND REPORTING SYSTEM

## 7.1  Student Performance Analytics
At the individual student level, the analytics system tracks and visualises several dimensions simultaneously. The Skills Passport provides a timeline view of all four assessment stages with growth charts showing how each quotient score changed between T1 and T4. The PPI (Placement Probability Index) is a single composite score that reflects the student's overall employability readiness, calculated as: PPI = (Assessment Score × 30%) + (Completion Rate × 50%) + (Growth Average × 20%). This weighting deliberately prioritises effort (course completion rate) as the single biggest factor, reinforcing the platform's belief that consistent action matters more than raw ability.

## 7.2  College-Level Analytics
College Admins and Principals have access to institution-scoped analytics that cannot see any other college's data. Key metrics available include active versus inactive student counts, average course completion rates across the college, average PPI score of the student body, department-wise performance comparisons, and cohort-level assessment pass rates. These metrics are designed to help institutions measure their educational effectiveness and identify departments or batches that need additional support resources.

## 7.3  Delta Comparison Analysis


## 7.4  Global System Dashboards
Super Admins have access to global KPI dashboards that display system-wide performance metrics: total registered students, total active colleges, assessment completion rates by region, certificate issuance trends, escalation resolution rates, and community engagement statistics. These dashboards use Chart.js and Recharts for interactive visualisations. Data export functionality supports CSV and PDF formats for offline analysis and reporting.

# SECTION 8 — CERTIFICATION AND SKILL TRACKING

## 8.1  The Three-Certificate Stack
SMAART Minds operates a progressive certification model where certificates are not issued in isolation but as a formally stacked credential set. Each certificate is only meaningful in the context of the ones below it, creating a trusted, unforgeable record of growth. The three certificates — C1 (Foundation), C2 (Capability), and C3 (Leadership Diploma) — collectively represent a verified 10-month professional development journey from entry-level readiness to leadership competence.

## 8.2  Skills Vault
The Skills Vault is the student's personal repository for all certificates — both SMAART-issued verified certificates and externally obtained certificates uploaded during registration or added later. The vault distinguishes between Verified Certificates (with a platform-validated URL or QR code) and Unverified Certificates (uploaded by the student without external validation). This distinction is visible in the student's profile and Skills Passport, allowing employers to quickly identify the confidence level of each credential.

## 8.3  Certificate Verification System
Every SMAART-issued certificate has a publicly accessible verification page. Anyone with the certificate's unique ID or the QR code can access this page and see the student's name, the programme completed, the issue date, and the issuing institution. The system supports optional blockchain-backed verification, making certificates cryptographically tamper-proof and globally verifiable. Certificates are timestamped and carry a cryptographic digital signature.

## 8.4  Badges and Streaks
The gamification layer awards five categories of digital badges: Course Completion Badges (one per completed module), Skill Mastery Badges (awarded on achieving distinction level in a skill), Assessment Excellence Badges (for passing assessments at distinction level), Streak Badges (for maintaining daily login and learning streaks at 7, 30, and 90-day milestones), and Community Contribution Badges (for helpful forum posts and peer review participation). All badges are embeddable, shareable on social media, and displayed prominently in the student's profile and Skills Passport.

# SECTION 9 — COMMUNITY AND ENGAGEMENT PLATFORM

## 9.1  Student Community Features
The Community Platform provides a structured social learning environment with discussion forums organised by topic and module, study groups that students can create or join, peer connections between classmates, and mentor interaction channels. The community is designed to reinforce the learning journey — students can discuss course content, share project ideas, request peer review of evidence artefacts, and access mentorship from coaches and senior students.

## 9.2  Moderation Tools
All community content passes through an automated first-pass moderation layer that scans for policy-violating content including inappropriate language, academic dishonesty, and high-risk mental health indicators. Flagged content is queued for human moderator review. Moderators can remove content, issue warnings, temporarily suspend posting privileges, or escalate to the admin system. The Emotion Coach AI chatbot operates specifically in the support channel and monitors for distress signals that trigger escalation events.

## 9.3  Engagement Tracking
Community engagement is tracked as a component of the overall student activity record. Participation rates, post quality scores (from peer reviews), and mentorship interaction frequency all feed into the student's engagement profile, which is visible to College Admins and coaches. This data helps identify students who are socially isolated from the learning community and may need additional outreach.

# SECTION 10 — SUPPORT AND ESCALATION SYSTEM

## 10.1  Student Support Channels
Students access support through four channels: the Help Center (self-service FAQ and documentation), Support Ticket submission (for bugs, disputes, and account issues), Live Chat availability (where configured by the institution), and the Mind Care Booking System for wellness-related concerns. Support tickets capture the issue description, severity level, and relevant screenshots. The ticketing system maintains a full thread history between the student and support team.

## 10.2  Case Log Tracking
Case logs are automatically created for significant system events in a student's journey: first login, profile completion, each assessment attempt and result, certificate issuance, escalation creation, and coaching session completion. These logs provide a complete, timestamped behavioural record for each student that administrators and coaches can review to understand the student's engagement pattern and identify intervention needs.

## 10.3  Mentoring and Coaching System
The coaching subsystem manages the scheduling, delivery, and follow-up of all mentoring interactions. Admins create Coach profiles with specialisation tags (Career Counsellor, Mental Health Specialist, etc.) and assign them to specific college cohorts or departments. Session scheduling creates calendar events, sends automated notifications to both the student and coach, and tracks session completion status. Post-session feedback forms are mandatory for both parties — coach forms track session goals, outcomes, and follow-up actions, while student forms capture satisfaction and perceived value.

## 10.4  Escalation Workflow
An escalation is triggered by one of three conditions: a student consistently fails assessments (automated parameter), a session is reported as inappropriate (manual report), or the Emotion Coach detects high-risk mental health keywords in student messages (automated keyword scan). Once created, the escalation enters a micro-forum visible only to the assigned Admin and Coach. Both parties append internal notes and debate the appropriate course of action. The escalation is only marked as Resolved after a documented concrete action has been taken — this ensures accountability and creates a defensible record of care.

# SECTION 11 — TECHNOLOGY STACK


## 11.1  Security Architecture Summary
The security model operates at four layers. At the transport layer, HTTPS enforces encrypted data transmission. At the application layer, Helmet sets security-relevant HTTP headers (Content-Security-Policy, X-XSS-Protection, etc.) and CORS restricts API access to authorised origins. At the authentication layer, JWT tokens carry encrypted role claims that are validated on every API call, bcrypt protects passwords from database exposure, and OTP-based 2FA protects login from credential theft. At the data layer, Role-Based Access Control ensures that every database query is scoped to the requesting user's authorised data range — a College Admin's queries are automatically filtered to their college_id, making cross-institution data leakage architecturally impossible even if the application logic has a bug.

# SECTION 12 — COMPLETE END-TO-END SYSTEM FLOW

This section presents the complete lifecycle of the platform from initial configuration through to a student's fully verified, career-ready graduate status. Each stage flows into the next in a causal chain where every output becomes the input for the subsequent phase.

## Stage 1 — Platform Configuration
The Super Admin or System Administrator configures the foundational platform parameters: the 300-question assessment bank is populated and validated against the target distribution table, the 75-skill curriculum is built across 15 modules using the 3-Day Framework structure, AI Toolkit integrations are authenticated, global analytics thresholds are set, and the escalation parameter rules are configured. This stage is performed once and updated through version-controlled iterations thereafter.

## Stage 2 — Institution Onboarding
A Consultant initiates the college onboarding wizard and captures all institutional identity, coordinator, compliance, and configuration data. The system validates uniqueness of the college name and email, generates a unique institution code, creates the College Admin account, and activates the institution upon approval. The Chairman Introduction Video is uploaded at this stage — it will be shown to every student from this college on their first login. The institution now appears in the management list and faculty and student accounts can be created.

## Stage 3 — Student Registration and Profile Completion
Students receive their credentials from the College Admin and log into the student portal. They complete the mandatory institution selection, first-time login flow with OTP verification, and forced password change. They then complete the 12-step profile wizard capturing their complete academic, professional, and career preference data. On profile submission, the Career Intelligence Engine activates and generates the student's initial role recommendations and skill gap profile.

## Stage 4 — Baseline Assessment (T1)
The system automatically redirects the newly profiled student to the T1 Baseline Assessment. The 36-question stratified test establishes the S_baseline score and Stage Band for each of the six quotients. Results are stored, a downloadable report is generated, and the student's profile is marked with their starting competency level. The dashboard becomes accessible after assessment completion.

## Stage 5 — Structured Learning Journey
The student engages with the assigned course pathway, progressing through Capacity (C1–C5), Capability (P1–P5), and Leadership (L1–L5) modules. Each module follows the 3-Day Framework. Progress is tracked in real time, badges are awarded for completions, and daily streaks reinforce consistent engagement. The SMAART Toolkit, Community Platform, and Mind Care Sessions are available throughout this phase to support the student holistically.

## Stage 6 — Progressive Assessments (T2, T3, T4)
After completing each learning phase, the corresponding validation assessment unlocks. T2 follows the Capacity modules, T3 follows the Capability modules, and T4 follows the Leadership modules. Each assessment applies the weighted scoring formula and checks certificate prerequisites. The PLVI is calculated after each stage, measuring the student's rate of growth relative to their baseline. Integrity violations are tracked and factored into certificate eligibility.

## Stage 7 — Analytics and Institutional Reporting
Throughout the journey, College Admins and Teachers monitor cohort-level and individual student analytics. At-risk students are identified through low completion rates, failed assessments, or escalated incidents. The Delta comparison across the cohort is generated to measure institutional impact. Reports are exported for internal review, accreditation submissions, or industry partner presentations.

## Stage 8 — Certificate Issuance and Skills Passport Generation
As students pass T2, T3, and T4, the certificate engine checks prerequisites, verifies integrity status, and issues the appropriate certificate (C1, C2, or C3). Each certificate is digitally signed and assigned a unique ID with QR verification. The Skills Passport aggregates all certificates, quotient scores, skill badges, PLVI classification, and growth timeline into a professional, shareable digital credential. Students use the AI Resume Builder in the Toolkit to generate ATS-optimised resumes from their verified profile data, completing the transition from student to verified, employment-ready professional.


| Document Version | 1.0–15th March 2026 |
| --- | --- |
| Document Type | Master System Blueprint |
| Audience | Technical, Administrative & Strategic |
| Classification | Confidential — Internal Use |
| Prepared by | Fareeda & Souban |
| Module | Layer | Primary Function |
| --- | --- | --- |
| Authentication Engine | Backend/Security | JWT + OTP-based secure access control |
| Institution Management | Backend/Admin | College onboarding, configuration, lifecycle |
| Student Onboarding | Frontend/Backend | 12-step profile wizard and data collection |
| Assessment Engine | Backend/AI | T1–T4 assessment delivery and scoring |
| Learning Management System | Frontend/Backend | Course delivery and progress tracking |
| Career Intelligence Engine | Backend/AI | Skill-gap analysis and learning path generation |
| Analytics Dashboard | Frontend/Backend | Performance reporting and PLVI tracking |
| Certification Engine | Backend | Certificate generation and QR verification |
| Community Platform | Frontend/Backend | Moderated peer interaction |
| Support and Escalation | Backend/Admin | Help desk, coaching, mental health support |
| SMAART Toolkit | Frontend/AI | AI career tools, resume builder, wellness resources |
| Quotient | Questions and Focus Area |
| --- | --- |
| CRQ — Cognitive Readiness Quotient (7 Questions) | Critical thinking, logical reasoning, problem-solving, and analytical skills. |
| SRQ — Self-Regulation and Drive Quotient (6 Questions) | Motivation, resilience, emotional control, and self-discipline. |
| LQ — Learning Agility Quotient (6 Questions) | Adaptability, continuous learning mindset, and knowledge acquisition speed. |
| SIQ — Social Interaction Quotient (6 Questions) | Collaboration skills, empathy, communication, and teamwork. |
| PEQ — Professional Execution Quotient (7 Questions) | Work ethic, reliability, delivery quality, and professional conduct. |
| DAQ — Digital and AI Literacy Quotient (4 Questions) | Technology proficiency, AI readiness, and digital tool mastery. |
| Band | Score Range | Meaning |
| --- | --- | --- |
| Advanced | 81% – 100% | Exceptional mastery — strong starting foundation. |
| Strong | 61% – 80% | Solid competence — performing above average. |
| Progressing | 41% – 60% | Developing skills — on the right track. |
| Developing | 21% – 40% | Early stage — significant growth opportunity. |
| Emerging | 0% – 20% | Beginning journey — foundational work needed. |
| Assessment | Purpose | Certificate Issued |
| --- | --- | --- |
| T1 Baseline (36 Questions) | Diagnostic — establishes the Starting Profile (S_baseline). Covers 6 quotients, excludes SEQ. | No Certificate — Baseline only. |
| T2 Capacity Validation (34 Questions) | Measures foundational cognitive and behavioural readiness after Phase 1 learning. Focuses on CRQ, SRQ, LQ, DAQ. |  |
| T3 Capability Assessment (34 Questions) | Measures ability to translate knowledge into professional action. Focuses on SIQ, PEQ, LQ, DAQ. |  |
| T4 Leadership Readiness (36 Questions) | Full holistic assessment including all 7 quotients including SEQ. Measures strategic, ethical, and leadership readiness. |  |
| Band | PLVI Range | Employer Signal |
| --- | --- | --- |
| Fast | 0.25 to 1.0 | High-Potential — rapid skill acquisition. |
| Steady | 0.12 to 0.249 | Consistent, reliable developer. |
| Developing | 0.00 to 0.119 | Methodical, ongoing acquisition. |
| Role | Scope and Primary Responsibility |
| --- | --- |
| Super Admin | Full read/write access to the entire platform. Manages global configuration, content creation, institution onboarding, and system-wide analytics. Only role that can access all colleges' data simultaneously. |
| Consultant | Manages the pipeline of colleges being onboarded. Handles CRM interactions, tickets raised by managed colleges, and acts as the interface between the institution and the platform. Can onboard new colleges. |
| College Admin (Principal/HOD) | Full control over their specific college's data only. Manages students, faculty, departments, academic calendars, and local analytics. Cannot access data from other colleges. |
| Teacher/Faculty | Read-only access to students and courses assigned to their department. Tracks individual student progress, identifies at-risk learners, and reviews curriculum content. Cannot modify system configuration. |
| Coach/Mentor | Calendar-focused role. Manages scheduled sessions with students, handles escalations routed to them, reviews session feedback, and records session notes. Cannot access administrative configuration. |
| Placement Officer | Monitors placement readiness data, access to student Skills Passports, PPI scores, and placement activity tracking within the assigned institution. |
| Quotient | Total Target Items | Difficulty Split (E/M/H) |
| --- | --- | --- |
| CRQ — Cognitive Readiness | 45 questions | 14 Easy / 20 Medium / 11 Hard |
| SRQ — Self-Regulation | 40 questions | 12 Easy / 18 Medium / 10 Hard |
| LQ — Learning Agility | 40 questions | 12 Easy / 18 Medium / 10 Hard |
| SIQ — Social Interaction | 40 questions | 12 Easy / 18 Medium / 10 Hard |
| PEQ — Professional Execution | 50 questions | 15 Easy / 22 Medium / 13 Hard |
| DAQ — Digital and AI Literacy | 45 questions | 14 Easy / 20 Medium / 11 Hard |
| SEQ — Ethics and Sustainability | 40 questions | 12 Easy / 18 Medium / 10 Hard |
| Module | Skills Included |
| --- | --- |
| C1 — Cognitive Foundations (Capacity) | Critical Thinking, Logical Reasoning, Problem Structuring, Information Literacy, Decision Making |
| C2 — Professional Discipline (Capacity) | Attention Control, Self-Discipline, Stress Regulation, Goal Setting, Professional Reliability |
| C3 — Learning to Learn (Capacity) | Learning to Learn, Curiosity, Feedback Receptivity, Adaptability, Time Management |
| C4 — Digital Literacy (Capacity) | Basic Digital Literacy, Data Awareness, Cyber Hygiene, Numerical Reasoning, Task Prioritisation |
| C5 — Ethical Foundations (Capacity) | Ethical Awareness, Personal Integrity, Sustainability Awareness, Environmental Literacy, Social Responsibility |
| P1 — Applied Problem Solving (Capability) | Systems Thinking, Analytical Reasoning, Applied Problem Solving, Self-Motivation, Resilience |
| P2 — Dynamic Learning (Capability) | Learning Agility, Skill Transfer, Rapid Upskilling, Emotional Regulation, Quality Orientation |
| P3 — High-Performance Teams (Capability) | Collaboration, Team Communication, Conflict Management, Stakeholder Communication, Inclusive Thinking |
| P4 — Digital Fluency (Capability) | Digital Collaboration Tools, AI Awareness, Data-Informed Decisions, Process Discipline, Professional Execution |
| P5 — Responsible Performance (Capability) | Ethical Decision Making, Responsible Tech Use, Sustainability Practices, Resource Efficiency, Cultural Sensitivity |
| L1 — Strategic Cognition (Leadership) | Strategic Thinking, Complex Decision Making, Judgement Under Uncertainty, Global Mindset, Systems Responsibility |
| L2 — Leadership Resilience (Leadership) | Self-Leadership, Purpose Orientation, Resilience Under Pressure, Continuous Learning Mindset, Accountability |
| L3 — Influence and Negotiation (Leadership) | Change Leadership, Innovation Mindset, Influence, Negotiation, Trust Building |
| L4 — Digital and Ethical Governance (Leadership) | Coaching Others, Ethical Persuasion, Digital Strategy, AI Governance, Technology Ethics |
| L5 — Execution Leadership (Leadership) | Sustainability Leadership, Governance Awareness, Execution Leadership, Risk Management, Decision Ownership |
| Component | Technology and Details |
| --- | --- |
| Frontend Framework | React 18.3 — component-based UI with hooks-driven state management. |
| Build Tool | Vite 5.4 — fast development server and optimised production bundling. |
| UI Component Library | Radix UI primitives — accessible, unstyled base components. |
| Styling | Tailwind CSS — utility-first CSS framework for responsive design. |
| State Management | TanStack Query (React Query) — server-state synchronisation and caching. |
| Routing | React Router DOM v6 — declarative, client-side routing. |
| Animations | Framer Motion — production-ready motion library for React. |
| Forms and Validation | React Hook Form + Zod — performant, schema-driven form management. |
| Charts and Data Visualisation | Recharts (primary) + Chart.js — responsive, composable chart library. |
| 3D Graphics (optional) | Three.js + React Three Fiber — for immersive visual elements. |
| Backend Runtime | Node.js — asynchronous, event-driven JavaScript runtime. |
| Backend Framework | Express.js — minimal, flexible web application framework. |
| Database | MongoDB with Mongoose ODM — flexible document store for complex schemas. |
| Authentication | JWT (JSON Web Tokens) + bcrypt password hashing + OTP-based 2FA. |
| File Upload and Storage | Multer (processing) + Cloudinary (storage) — for all media assets. |
| Email Service | Nodemailer — SMTP-based transactional email delivery. |
| Security Middleware | Helmet (HTTP headers) + CORS + Express Rate Limit. |
| Logging | Winston (application logs) + Morgan (HTTP request logs). |
| AI Models (Toolkit) | Deepseek r1058 and NVIDIA Nemotron-3-Nano (30B) — LLM-powered tools. |
| Books API | Amazon Books + Google Books API — Knowledge Library integration. |
| Dictionary API | DictionaryAPI.dev + Datamuse — terminology reference tool. |
| Certificate Verification | QR Code generation + optional blockchain-backed tamper-proofing. |
| PDF Generation | jsPDF — for downloadable report and certificate generation. |
| COMPLETE LIFECYCLE SUMMARY

Super Admin configures platform (question banks, courses, AI integrations)

Consultant onboards institution (identity, compliance, admin account, chairman video)

College Admin creates student and faculty accounts (manual or bulk CSV)



T1 Baseline Assessment establishes S_baseline across 6 quotients





PLVI calculated at each stage — growth velocity measured and classified



Student is verified, career-ready with a tamper-proof, employer-facing credential set |
| --- |