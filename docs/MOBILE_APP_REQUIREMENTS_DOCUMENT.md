# SMAART Institute Mobile App Requirements Document

_Prepared: 2026-09-06_  
_Source reviewed: `mobile-app/` React Native / Expo app, navigation, API clients, screen files, README, and implementation map._

## 1. Purpose

The SMAART Institute mobile app is a student-facing companion to the SMAART web dashboard. It must allow students to authenticate securely, complete onboarding, access learning content, take assessments with native proctoring controls, use career and placement tools, participate in community features, view notifications, and contact support.

The app must reuse the existing SMAART backend APIs wherever possible so mobile and web remain consistent for user records, courses, assessments, placements, notifications, tickets, grievances, and community data.

## 2. Product Scope

### In Scope

| Area | Required capability |
|---|---|
| Authentication | Institution selection, login, OTP verification, signup, forgot/reset password, forced password change, secure token storage, token renewal, biometric unlock, single-session handling, device fingerprinting |
| Onboarding | Student profile completion after first login or incomplete registration |
| Home | Student summary, learning progress, next assessment, shortcuts, notification access, drawer navigation |
| Assessments | T1-T4 assessment dashboard, stage unlock logic, attempt limits, timed player, question renderer, answer save/retry, submit flow |
| Proctoring | Face registration before assessment, proctoring session start, heartbeat, background detection, server-controlled warn/pause/held state, held-attempt handling |
| Learning | Course catalogue, enrolled courses, course unlock logic, course content playback, video progress, quizzes, notes, library, certificates, CGPA calculator |
| Career | Placement jobs, applications, job details, job fairs, company partners, offer response, AI career coach, career directions, skills vault, toolkit, resume builder, dictionary |
| Community | Announcements, discussions, replies, study groups, group chat polling, vision board create/view/detail |
| Profile | Profile view/edit, certifications, settings, password change, biometric toggle, theme toggle, session/device info |
| Notifications | In-app notification list, unread count, mark read, mark all read, delete, clear all, device push token registration |
| Support | IT support tickets, grievances, status/history, response threads, replies where allowed |
| Performance | Student analytics/performance summary |

### Out of Scope for Current Mobile Build

| Area | Exclusion / deferred item |
|---|---|
| Full web parity | Mobile should prioritize student workflows and native ergonomics rather than mirroring every web page 1:1. |
| Native PDF generation | Resume/certificate/report PDF export may deep-link to web or remain deferred until a native PDF approach is approved. |
| Continuous in-exam camera proctoring | Current scope includes the face gate and session heartbeat; continuous face/gaze/audio/environment monitoring requires physical-device validation and additional UX decisions. |
| Admin features | Admin dashboards, institution management, and content management remain web-first unless separately scoped. |

## 3. Platforms and Technical Requirements

| Requirement | Detail |
|---|---|
| Platform | React Native using Expo SDK 57 |
| Navigation | React Navigation native stack and bottom tabs |
| Supported OS | Android and iOS development-client builds |
| Not supported | Plain Expo Go for features requiring native modules such as camera, ONNX, push notifications, and dev-client-only packages |
| API communication | Axios client using existing backend routes |
| Secure storage | `expo-secure-store` for JWT/session data and per-install identifiers |
| Biometrics | `expo-local-authentication` for re-opening an existing signed-in session |
| Media/video | `expo-video` for course playback |
| Proctoring ML | `react-native-vision-camera`, `@shopify/react-native-skia`, `onnxruntime-react-native` |
| Push notifications | `expo-notifications` with backend device registration |
| Theme | Light/dark theme context across app screens |

## 4. Information Architecture

The primary signed-in mobile navigation must use these bottom tabs:

| Tab | Main responsibilities |
|---|---|
| Home | Dashboard, quick actions, learning/assessment highlights, drawer entry |
| Learning | Courses, course player, notes, certificates, library, CGPA |
| Career | Career coach, placements, applications, job fairs, partners, skills and toolkit |
| Community | Announcements, discussions, groups, chat, vision board |
| Profile | Student profile, certifications, settings, logout |

Stack routes outside the tab bar must include: assessment player, notifications, settings, support, face verification test, performance, career satellites, learning satellites, and community detail/create screens.

## 5. Functional Requirements

### 5.1 Authentication and Session

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | User can select/search institution before login. | Must |
| AUTH-02 | User can sign up using email OTP and password creation. | Must |
| AUTH-03 | User can log in with email and password. | Must |
| AUTH-04 | Login must require OTP verification when backend requires it. | Must |
| AUTH-05 | First-login users must complete forced password change natively. | Must |
| AUTH-06 | User can request forgot-password OTP and reset password. | Must |
| AUTH-07 | App stores auth token securely and validates it on launch. | Must |
| AUTH-08 | App renews token while active and on foreground. | Must |
| AUTH-09 | User can enable biometric unlock for returning to an existing session. | Should |
| AUTH-10 | App handles single-session conflicts and force logout flow. | Must |
| AUTH-11 | Requests include device ID/platform/model/name headers. | Must |
| AUTH-12 | Incomplete users are routed to profile completion. | Should |

### 5.2 Home

| ID | Requirement | Priority |
|---|---|---|
| HOME-01 | Show personalized dashboard summary after login. | Must |
| HOME-02 | Show continue-learning card using enrollment progress. | Must |
| HOME-03 | Show next assessment CTA based on stage status. | Must |
| HOME-04 | Show college banners/announcements where available. | Should |
| HOME-05 | Provide drawer navigation to profile, notifications, support, settings, performance, career tools, and logout. | Must |
| HOME-06 | Notification badge must reflect unread count. | Should |

### 5.3 Assessments

| ID | Requirement | Priority |
|---|---|---|
| ASMT-01 | Show T1-T4 assessment stages with completion, lock, and attempt status. | Must |
| ASMT-02 | Prevent locked stages from being opened client-side while relying on server re-checks. | Must |
| ASMT-03 | Start/resume assessment attempts using backend attempt lifecycle. | Must |
| ASMT-04 | Render supported question types for assessment play. | Must |
| ASMT-05 | Display server-authoritative timer and progress. | Must |
| ASMT-06 | Save answers immediately. | Must |
| ASMT-07 | Queue/retry failed answer writes and block submit if required writes are still unsaved. | Must |
| ASMT-08 | Submit attempts and show completion/held state as returned by server. | Must |
| ASMT-09 | Refresh stage state after returning from an attempt. | Must |

### 5.4 Proctoring

| ID | Requirement | Priority |
|---|---|---|
| PROC-01 | Start a proctoring session for a real assessment attempt. | Must |
| PROC-02 | Require face registration/verification gate before first question. | Must |
| PROC-03 | Use same face-detection/embedding model family as web for parity. | Must |
| PROC-04 | Send regular heartbeat during assessment. | Must |
| PROC-05 | Detect app background/inactive state during assessment. | Must |
| PROC-06 | Obey server proctoring decision: ok, warn, pause, held. | Must |
| PROC-07 | Auto-submit or stop attempt when server marks it held, according to backend contract. | Must |
| PROC-08 | Support standalone face verification test for validation. | Should |
| PROC-09 | Continuous camera verification, gaze, audio, screenshots, and environmental checks are deferred until device validation. | Could |

### 5.5 Learning

| ID | Requirement | Priority |
|---|---|---|
| LRN-01 | Load published courses and student enrollments. | Must |
| LRN-02 | Display staged and track-based learning paths. | Must |
| LRN-03 | Enforce or display course unlock rules based on assessment/course progress. | Must |
| LRN-04 | Open course content with learning-flow resolution matching web priority. | Must |
| LRN-05 | Play video and save video progress/checkpoints. | Must |
| LRN-06 | Render lessons, quizzes, flashcards, and reflection/notes steps where content exists. | Must |
| LRN-07 | Allow saving course notes. | Should |
| LRN-08 | Show certificates and verification references. | Should |
| LRN-09 | Provide library search/list view. | Should |
| LRN-10 | Provide CGPA calculator. | Could |

### 5.6 Career and Placements

| ID | Requirement | Priority |
|---|---|---|
| CAR-01 | Show placement jobs with search/filter. | Must |
| CAR-02 | Show job detail and allow job application. | Must |
| CAR-03 | Show application history and allow withdrawal where eligible. | Must |
| CAR-04 | Allow offer response with e-signature/decline reason. | Must |
| CAR-05 | Show job fairs and company partners. | Should |
| CAR-06 | Provide AI Career Coach chat. | Must |
| CAR-07 | Provide Career Directions flow and roadmap. | Should |
| CAR-08 | Provide Skills Vault / Skills Passport style view. | Should |
| CAR-09 | Provide Resume Builder CRUD. | Should |
| CAR-10 | Provide Toolkit and Dictionary utilities. | Could |

### 5.7 Community

| ID | Requirement | Priority |
|---|---|---|
| COM-01 | Show announcements/notices. | Must |
| COM-02 | Show discussion feed and allow creating discussions. | Must |
| COM-03 | Show discussion details and replies. | Must |
| COM-04 | Show study groups and allow group creation/join where backend permits. | Should |
| COM-05 | Support group chat with polling while chat is open. | Should |
| COM-06 | Support vision board list/create/detail. | Could |
| COM-07 | Badges/streaks and wellbeing/MindCare remain future scope unless product confirms requirements. | Could |

### 5.8 Profile and Settings

| ID | Requirement | Priority |
|---|---|---|
| PROF-01 | Show student profile details. | Must |
| PROF-02 | Allow profile edits where backend permits. | Must |
| PROF-03 | Allow adding/updating certifications or skill credentials. | Should |
| PROF-04 | Show settings screen with biometric toggle and device/session info. | Must |
| PROF-05 | Allow in-app password change. | Must |
| PROF-06 | Allow light/dark theme switching. | Should |
| PROF-07 | Allow logout and local/session cleanup. | Must |

### 5.9 Notifications and Support

| ID | Requirement | Priority |
|---|---|---|
| NOTIF-01 | Show notification list with unread filtering. | Must |
| NOTIF-02 | Mark single/all notifications as read. | Must |
| NOTIF-03 | Delete single/all notifications. | Should |
| NOTIF-04 | Register/unregister device push token on sign-in/sign-out. | Should |
| NOTIF-05 | Confirm actual push delivery on production/dev-client credentials. | Must before launch |
| SUP-01 | Submit IT support ticket. | Must |
| SUP-02 | View support ticket history and response thread. | Must |
| SUP-03 | Submit grievance with optional anonymous flag. | Must |
| SUP-04 | View grievance history and response thread. | Must |

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | App must avoid crashing when optional native modules are unavailable; heavy native modules should be lazy-loaded where needed. |
| NFR-02 | App must work against the same backend data contracts as web. |
| NFR-03 | Sensitive tokens and local identifiers must use secure storage. |
| NFR-04 | Timed assessment behavior must not trust client time for final authority. |
| NFR-05 | Network failures in high-stakes flows such as assessments must be visible and recoverable. |
| NFR-06 | App must support dark and light visual themes. |
| NFR-07 | Screens must handle loading, empty, error, and refresh states. |
| NFR-08 | Production release must be tested on physical Android and iOS devices. |
| NFR-09 | Proctoring/face verification must be validated on physical devices before launch. |
| NFR-10 | Push notifications must be tested with real EAS/Firebase credentials before launch. |

## 7. Release Readiness Criteria

| Criteria | Required evidence |
|---|---|
| Build | Android and iOS development/production builds complete successfully. |
| Auth | Login, OTP, signup, reset password, forced password change, token renewal, logout, and biometric unlock tested on real devices. |
| Assessments | Timed attempt, answer saving, retry queue, submit, lock rules, and held attempt tested with real student accounts. |
| Proctoring | Face gate, heartbeat, background detection, warn/pause/held decisions tested with live backend. |
| Learning | Course playback, progress checkpointing, quizzes, notes, certificates, and locks tested with live content. |
| Career | Jobs, applications, offers, coach, directions, resume, and toolkit tested with live data. |
| Community | Notices, discussions, groups/chat, and vision board tested with live data. |
| Support | Ticket and grievance create/history/reply flows tested. |
| Notifications | In-app list and push delivery tested. |
| QA | No startup native-module crashes; no critical screen blocks; no high-stakes data loss paths. |
