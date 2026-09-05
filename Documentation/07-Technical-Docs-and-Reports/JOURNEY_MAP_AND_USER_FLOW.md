# SMAART Institute User Journey Map and User Flow

## Purpose

This document explains how a student moves through the SMAART Institute platform from first visit to long-term learning, assessment, career readiness, community participation, and certification.

It is based on the current project structure, especially:
- `front-end/src/components/AnimatedRoutes.jsx`
- `front-end/src/components/DashboardSidebar.jsx`
- `SYSTEM_END_TO_END_FLOW_DOCUMENTATION.md`
- `SMAART_MINDS_COMPLETE_USER_JOURNEY.md`
- backend route modules in `back-end/routes`

## Product Snapshot

SMAART Institute is a student development dashboard that combines:
- Institution-based access
- Student registration and profile building
- Baseline and skill assessments
- Course learning paths
- Vision boards
- SMAART toolkit and CGPA tools
- Skills vault, certificates, badges, and passport verification
- Community, groups, notes, todos, support, and grievances
- Placement, AI career coach, and career agent flows

## Primary Personas

### Student

The main user. They register, complete profile details, take assessments, learn through course modules, track progress, build career assets, join community spaces, and collect badges/certificates.

### Institution / College

Provides access context, student identity, course or program structure, and institutional trust.

### Admin / Staff

Manages courses, proctoring, student support, tickets, grievances, moderation, and operational oversight.

### External Verifier

Public user who verifies a certificate, badge, skills passport, or resume through public verification links.

## High-Level Journey Map

| Stage | Student Goal | Key Screens / Routes | System Touchpoints | Emotion / Need | Success Outcome |
| --- | --- | --- | --- | --- | --- |
| 1. Discover | Understand what SMAART offers | `/`, `/institution/:id`, `/login` | Landing page, institution page | Curious, needs trust | Student chooses institution or starts signup/login |
| 2. Register / Login | Securely access their account | `/signup-initial`, `/verify-otp`, `/signup`, `/signup-success`, `/login` | Auth, OTP, registration APIs | Cautious, needs clarity | Account created or authenticated |
| 3. Complete Profile | Build student identity and preferences | `/dashboard/onboarding`, `/profile`, `/dashboard/profile` | Registration, user, upload, college data | Slight friction, needs progress feedback | Profile becomes usable for personalization |
| 4. Baseline Assessment | Establish current skill/quotient level | `/dashboard/assessments/baseline`, `/assessment/:stage`, `/analysis`, `/motivational` | Assessment, result, baseline result APIs | Focused, needs guidance and fairness | Baseline result generated and dashboard access unlocked |
| 5. Dashboard Home | See priorities and next actions | `/dashboard` | User context, notifications, progress, banners | Oriented, needs a clear next step | Student sees courses, progress, tools, alerts |
| 6. Learn | Continue course modules and daily tasks | `/dashboard/courses`, `/dashboard/courses/:courseId/player`, `/dashboard/courses/:courseId/modules/:moduleId/days/:dayId` | Courses, enrollments, task results, video progress | Productive, needs continuity | Course progress increases and modules unlock |
| 7. Assess and Improve | Take micro/skill assessments and view performance | `/dashboard/assessment-centre`, `/dashboard/micro-assessments`, `/skill-assessment/:skillName`, `/dashboard/performance`, `/dashboard/quotients-grid` | Assessments, results, stage results, proctoring | Challenged, needs feedback | Scores, insights, and improvement direction |
| 8. Build Career Assets | Prepare for jobs and career direction | `/dashboard/placement`, `/dashboard/profile-analysis`, `/dashboard/resume-builder`, `/dashboard/interview-prep`, `/dashboard/career-agent` | Placement, resumes, career intelligence, AI coach | Ambitious, needs personalization | Resume, role direction, interview prep, job opportunities |
| 9. Engage and Reflect | Participate in community and manage tasks | `/dashboard/community`, `/dashboard/groups`, `/dashboard/notes`, `/dashboard/todos`, `/dashboard/vision-boards` | Community, groups, notes, todos, vision board APIs | Connected, needs motivation | Posts, groups, notes, goals, vision boards |
| 10. Recognition | Collect and share proof of growth | `/dashboard/skills-vault`, `/dashboard/skills-passport`, `/dashboard/certificate`, `/dashboard/badges` | Certificates, badges, user certificates | Proud, needs credibility | Verifiable achievements and portfolio assets |
| 11. Support | Resolve blockers | `/dashboard/support`, `/dashboard/grievances`, `/dashboard/settings`, `/dashboard/notifications` | Tickets, grievances, notifications, settings | Frustrated or uncertain, needs response | Issue submitted, tracked, resolved |
| 12. External Verification | Allow others to verify achievements | `/verify-certificate/:certificateId`, `/verify-passport/:passportId`, `/verify-resume/:resumeId`, `/verify-badge/:badgeId` | Public verification APIs | Trust check | Achievement validity confirmed |

## Main Student User Flow

```mermaid
flowchart TD
  A[Landing Page] --> B{Has account?}
  B -->|No| C[Signup Initial]
  C --> D[Verify Signup OTP]
  D --> E[Comprehensive Signup]
  E --> F[Signup Success]
  F --> G[Login / Institution Page]
  B -->|Yes| G
  G --> H{Authenticated?}
  H -->|No| G
  H -->|Yes| I{Profile complete?}
  I -->|No| J[Onboarding / Profile Details]
  J --> K{Baseline required?}
  I -->|Yes| K
  K -->|Yes| L[Baseline Assessment]
  L --> M[Analysis / Result / Motivation]
  M --> N[Dashboard Home]
  K -->|No| N
  N --> O[Courses]
  N --> P[Assessment Centre]
  N --> Q[Vision Boards]
  N --> R[Skills Vault / Certificates / Badges]
  N --> S[Community / Groups]
  N --> T[Placement / Career Tools]
  N --> U[Support / Grievances]
```

## Route-Based User Flow

### Public Entry

1. Student visits `/`.
2. Student selects an institution through `/institution/:id` or opens `/login`.
3. Public users can also verify credentials through:
   - `/verify-certificate`
   - `/verify-passport`
   - `/verify-resume`
   - `/verify-badge`
   - the same routes with an ID parameter.

### Signup Flow

```mermaid
flowchart LR
  A[/signup-initial/] --> B[Send signup OTP]
  B --> C[/verify-otp/]
  C --> D[OTP verified]
  D --> E[/signup or /complete-registration/]
  E --> F[Comprehensive registration]
  F --> G[/signup-success/]
```

Backend touchpoints:
- `auth.js`
- `registrations.js`
- `uploadRoutes.js`
- `colleges.js`

### Login and Protected Dashboard Flow

```mermaid
flowchart TD
  A[/login/] --> B[Authenticate user]
  B --> C{Valid session?}
  C -->|No| A
  C -->|Yes| D[PrivateRoute]
  D --> E[AssessmentFlowGuard]
  E --> F{Baseline complete?}
  F -->|No| G[/dashboard/assessments/baseline/]
  F -->|Yes| H[/dashboard/]
```

Backend touchpoints:
- `auth.js`
- `security.js`
- `students.js`
- `users.js`
- `baselineresults.js`

## Dashboard Information Architecture

The dashboard navigation currently exposes these major areas:

| Area | Main Route | Purpose |
| --- | --- | --- |
| Home | `/dashboard` | Student summary, progress, banners, widgets, next actions |
| My Courses | `/dashboard/courses` | Course list, enrollment progress, module entry |
| Assessment Centre | `/dashboard/assessment-centre` | Baseline, micro assessments, skill checks |
| Vision Boards | `/dashboard/vision-boards` | Goal visualization and vision board editor/gallery |
| SMAART Toolkit | `/dashboard/smaart-toolkit` | Student tools and utilities |
| Skills Vault | `/dashboard/skills-vault` | Stored skills, credentials, career assets |
| Community | `/dashboard/community` | Posts, notices, tasks, engagement |
| Placement | `/dashboard/placement` | Job fair, opportunities, placement details |
| My Notes | `/dashboard/notes` | Student learning notes |
| To-Do & Calendar | `/dashboard/todos` | Task planning and deadlines |
| Settings | `/dashboard/settings` | Preferences and account settings |
| Help / Support | `/dashboard/support` | Tickets and help requests |
| Grievances | `/dashboard/grievances` | Formal issue reporting |

## Learning Flow

```mermaid
flowchart TD
  A[Dashboard Home] --> B[My Courses]
  B --> C[Select Course]
  C --> D[Course Player]
  D --> E[Module View]
  E --> F[Day Step]
  F --> G[Read / Watch / Practice]
  G --> H[Quiz or Task Submission]
  H --> I[Reflection / Flashcards / Summary]
  I --> J{Day complete?}
  J -->|No| F
  J -->|Yes| K[Progress Updated]
  K --> L{Course complete?}
  L -->|No| E
  L -->|Yes| M[Badge / Certificate / Skills Vault Update]
```

Backend touchpoints:
- `courses.js`
- `courseEnrollments.js`
- `tasks.js`
- `notes.js`
- `badges.js`
- `certificates.js`
- `notifications.js`

## Assessment Flow

```mermaid
flowchart TD
  A[Assessment Centre] --> B{Assessment type}
  B -->|Baseline| C[Baseline Test]
  B -->|Micro Assessment| D[Micro Assessment List]
  B -->|Skill Assessment| E[Skill Assessment Player]
  C --> F[Start / Resume]
  D --> F
  E --> F
  F --> G[Questions Loaded]
  G --> H[Autosave Progress]
  H --> I[Submit Answers]
  I --> J{Proctoring or review hold?}
  J -->|Yes| K[Assessment Held]
  J -->|No| L[Score Calculated]
  L --> M[Analysis / Performance / Quotients]
```

Backend touchpoints:
- `assessments.js`
- `results.js`
- `baselineresults.js`
- `stageresults.js`
- `questionBanks.js`
- `proctoring.js`
- `ppiRoutes.js`

## Career and Placement Flow

```mermaid
flowchart TD
  A[Dashboard] --> B[Placement]
  A --> C[Profile Analysis]
  A --> D[Resume Builder]
  A --> E[Interview Prep]
  A --> F[Career Agent]
  F --> G{First visit?}
  G -->|Yes| H[Career Agent Onboarding]
  G -->|No| I[Career Agent Dashboard]
  H --> I
  I --> J[Career Direction / Roadmap / Skills / Market Insights]
  B --> K[Opportunity or Job Fair Detail]
  D --> L[Resume Asset]
  C --> M[Career Readiness Feedback]
```

Backend touchpoints:
- `placements.js`
- `jobApplications.js`
- `resumes.js`
- `aiCareerCoach.js`
- `careerAgent.js`
- `careerIntelligence.js`

## Community Flow

```mermaid
flowchart TD
  A[Community] --> B[View Feed]
  B --> C[Create Post]
  B --> D[React / Reply / Bookmark]
  B --> E[Join Groups]
  E --> F[Group Chat]
  C --> G[Moderation Checks]
  D --> H[Engagement Updates]
  G --> I{Flagged?}
  I -->|Yes| J[Moderation Queue]
  I -->|No| K[Post Visible]
```

Backend touchpoints:
- `community.js`
- `groups.js`
- `communityTaskProgressRoutes.js`
- `moderation.js`
- `moderationQueue.js`
- `notifications.js`

## Vision Board Flow

```mermaid
flowchart TD
  A[Dashboard] --> B[Vision Boards Gallery]
  B --> C{Create or view?}
  C -->|Create| D[Vision Board Editor]
  D --> E[Choose template / assets / typography]
  E --> F[Save Vision Board]
  F --> B
  C -->|View| G[Vision Board Detail]
```

Frontend routes:
- `/dashboard/vision-boards`
- `/vision-board-pro/create`
- `/vision-board-pro/gallery`
- `/vision-board/view/:id`

Backend touchpoints:
- `visionBoardRoutes.js`
- `visionBoardProRoutes.js`
- `userVisionBoardRoutes.js`

## Recognition and Verification Flow

```mermaid
flowchart TD
  A[Student Completes Learning or Assessment] --> B[Badge / Certificate Generated]
  B --> C[Skills Vault]
  C --> D[Skills Passport]
  D --> E[Share Verification Link]
  E --> F[External Verifier Opens Public Route]
  F --> G{Valid ID?}
  G -->|Yes| H[Verified Credential Shown]
  G -->|No| I[Invalid or Not Found State]
```

Student routes:
- `/dashboard/skills-vault`
- `/dashboard/skills-passport`
- `/dashboard/certificate`
- `/dashboard/badges`

Public routes:
- `/verify-certificate/:certificateId`
- `/verify-passport/:passportId`
- `/verify-resume/:resumeId`
- `/verify-badge/:badgeId`

Backend touchpoints:
- `badges.js`
- `certificates.js`
- `userCertificates.js`
- `resumes.js`

## Support Flow

```mermaid
flowchart TD
  A[Student Needs Help] --> B{Issue type}
  B -->|General support| C[Support Ticket]
  B -->|Formal complaint| D[Grievance]
  B -->|Settings issue| E[Settings]
  C --> F[Ticket Submitted]
  D --> G[Grievance Submitted]
  F --> H[Staff Review]
  G --> H
  H --> I[Status Update / Notification]
```

Backend touchpoints:
- `tickets.js`
- `grievances.js`
- `escalations.js`
- `notifications.js`

## Key Experience Rules

1. Institution and authentication are the trust gate before the student reaches private features.
2. Baseline assessment acts as a progress gate for the main dashboard experience.
3. Dashboard Home should always answer: "What should I do next?"
4. Learning, assessment, career, and recognition loops should feed each other.
5. Achievements should become visible in Skills Vault, certificates, badges, and public verification routes.
6. Support and grievances should remain available without blocking learning progress.

## Opportunity Notes

| Area | Recommendation |
| --- | --- |
| Navigation | Keep the main dashboard nav focused on the current high-value destinations: Home, Courses, Assessment Centre, Vision Boards, Toolkit, Skills Vault, Community, Placement, Notes, Todos. |
| Baseline Gate | Make the reason for baseline gating very clear to students before redirecting them. |
| Career Flow | Connect baseline results, profile data, skills vault, and career agent recommendations visibly. |
| Recognition | Show students where each badge/certificate came from and what action unlocks the next one. |
| Support | Add clear status states: submitted, in review, waiting for student, resolved. |
| Public Verification | Keep verification pages simple and trust-focused, with credential validity as the first visible result. |

## One-Line Flow Summary

Student discovers SMAART, registers through OTP, completes profile, takes the baseline assessment, lands on the dashboard, learns through courses, improves through assessments, builds career assets, engages with the community, earns verifiable credentials, and returns regularly through progress, notifications, and support loops.
