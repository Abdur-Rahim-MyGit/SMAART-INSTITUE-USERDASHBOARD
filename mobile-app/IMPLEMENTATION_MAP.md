# Mobile App — Web Feature → Mobile Placement Map & Current Status

_Last updated: 2026-08-24_

This document answers one question: **for every feature that already exists on the web
dashboard, where does it go in `mobile-app/`, and how far along is it?** It sits alongside
two other docs — don't duplicate them, read them together:

- `../Documentation/07-Technical-Docs-and-Reports/04-React-Native-App-Requirements-and-Roadmap.docx` — the **contract**: full FR/NFR
  list, phase numbering (Phase 0–10), architecture recommendations. Treat its phase numbers as
  canonical.
- `README.md` (this folder) — the **quickstart**: how to run it, what works today, face-pipeline
  details.

Tab structure below follows the SRS's Section 10 IA and Appendix A screen inventory exactly —
which also matches what's already scaffolded in `src/navigation/MainTabs.js` (Home,
Assessments, Learning, Career, Community, Profile). Nothing here proposes a new tab.

---

## 1. Verified status as of 2026-08-24

> **How this was produced.** Every requirement below was checked against the code,
> not against the previous entry in this file. The 60 FR identifiers come from the
> SRS (`../Documentation/07-Technical-Docs-and-Reports/04-React-Native-App-Requirements-and-Roadmap.docx`).
> "Built" means a screen exists AND imports a live API module AND is reachable from
> navigation. An API module with no screen importing it counts as **not built** —
> four such orphans were found and are named below.

| Phase (SRS §11) | Scope | Verified status |
|---|---|---|
| Phase 0 — Discovery & Setup | Scaffold, EAS config | **Done.** |
| Phase 1 — Core Auth & Navigation | FR-AUTH-01…12 | **Done — 12/12.** |
| Phase 2 — Assessment Engine | FR-ASMT-01…09 | **Mostly done — 6/9.** Two FRs unbuilt, two partial. |
| Phase 3 — Proctoring Adaptation | FR-PROC-01…15 | **Barely started — 2/15, and not wired into the exam.** The largest remaining gap by far. |
| Phase 4 — Learning & Course Platform | FR-LRN-01…07 | **Done — 7/7.** |
| Phase 5 — Career & Placement | FR-CAR-01…06 | **Mostly done — 4/6.** Resume builder and interview prep unbuilt. |
| Phase 6 — Community & Gamification | FR-COM-01…05 | **Half done — 2/5.** MindCare and to-do tracker unbuilt; community feed and achievements partial. |
| Phase 7 — Support & Notifications | FR-SUP-01…04 | **Done except push — 3/4.** |
| Phase 8–10 | Hardening, store submission | Not started. |

**Overall: 36 of 60 FRs fully built, 6 partial, 18 not started.** Fourteen of the
eighteen unbuilt are proctoring.

### 1.1 Correction to the previous revision

An earlier edit of this file (same day) had **FR-SUP-03 and FR-SUP-04 swapped**. The
SRS is authoritative and reads:

- **FR-SUP-03 = Push notifications** (native FCM/APNs) — **not built**
- **FR-SUP-04 = In-app notification centre** — **built**

The numbering is corrected in §1.4 below. Nothing about the code changed; the label
was wrong.

### 1.2 Phase 2 — Assessments, FR by FR

| FR | Requirement | Status | Evidence / gap |
|---|---|---|---|
| ASMT-01 | Assessments dashboard | ⚠️ **Partial** | `data/assessmentStages.js` defines T1–T4 only. The SRS asks for **T1–T4 *and AIQ***. The AIQ stage card does not exist. |
| ASMT-02 | Question renderer | ✅ Built | `AssessmentPlayerScreen` renders whatever `options[]` the server sends, which covers Likert and MCQ alike. No special-casing for Likert-7 / Likert-negative, and none appears to be needed — scoring is server-side. |
| ASMT-03 | Timed session with resume | ✅ Built | Replays saved answers and lands on the first unanswered question; countdown against `durationMinutes`. |
| ASMT-04 | Offline answer buffering | ❌ **Not built** | No NetInfo, no local queue, no retry. An answer lost to a network drop is lost. |
| ASMT-05 | Stage-gating logic | ✅ Built | `utils/courseUnlock.js` mirrors S10/S19/S25 + T2/T3 gates; the server re-checks on start. |
| ASMT-06 | Skill assessment player | ❌ **Not built** | Nothing calls `/api/skill-assessments`. No per-skill flow exists. |
| ASMT-07 | Micro-assessments | ✅ Built | `utils/courseFlow.js` resolves module-level quizzes inside the learning flow. |
| ASMT-08 | Results & quotient analysis | ⚠️ **Partial** | The report shows percentage, pass/fail and a band pill. **There is no quotient breakdown** — no CRQ/SRQ/LQ/SIQ/PEQ/DAQ/SEQ grid, which the web has and the SRS asks for. |
| ASMT-09 | Submission & review states | ⚠️ **Partial** | "Completed" and "Locked" only. No distinct "pending review" state. |

### 1.3 Phase 3 — Proctoring, the real picture

**This is the honest headline: proctoring is not integrated into the assessment.**

`src/api/proctoring.js` exists and exports exactly the right calls — `startSession`,
`saveRegistration`, `getEmbedding`, `logVerification`, `logEvent`, `completeSession`.
**No screen imports it.** It is dead code.

`src/facepipeline/` is a genuine, careful port of the web's SCRFD + ArcFace pipeline,
but its only entry point is `FaceVerificationTestScreen`, reachable from the drawer as
"Face Verification (Beta)". It has still **never been run on physical hardware**.

`AssessmentPlayerScreen` does not start a proctoring session, does not open the camera,
does not capture a reference face, does not log a single event. It only *reacts* to a
lock the server already applied.

| FR | Requirement | Status |
|---|---|---|
| PROC-01 | Camera/mic permission flow | ❌ Not built (permissions declared in `app.json`, never requested in an exam context) |
| PROC-02 | Face registration | ⚠️ Pipeline exists, not wired to an exam, never run on a device |
| PROC-03 | Continuous face-match | ⚠️ Same |
| PROC-04 | Presence & attention detection | ❌ Not built |
| PROC-05 | Randomized liveness checks | ❌ Not built |
| PROC-06 | Background/foreground detection | ❌ Not built (`AppState` is used only in `AuthContext` for token renewal) |
| PROC-07 | Kiosk / screen-pinning mode | ❌ Not built |
| PROC-08 | Screenshot / recording flagging | ❌ Not built |
| PROC-09 | Audio monitoring | ❌ Not built |
| PROC-10 | Heartbeat ping | ❌ Not built |
| PROC-11 | Inactivity detection | ❌ Not built |
| PROC-12 | Server-authoritative decisioning | ⚠️ Server side already does this; the client sends it nothing |
| PROC-13 | Evidence capture & upload | ❌ Not built |
| PROC-14 | Proctoring status UI | ❌ Not built (no overlay, warning modal, pause or held screen) |
| PROC-15 | Flag-only mode support | ❌ Not built |

**Consequence worth stating plainly:** a student can currently sit a gated assessment on
the phone with no proctoring whatsoever, while the same assessment on the web is
proctored. Until this closes, mobile assessments are not equivalent to web assessments
and should not be treated as such.

### 1.4 Phases 4–7 — remaining gaps

| FR | Requirement | Status | Gap |
|---|---|---|---|
| **LRN-01…07** | Learning platform | ✅ **All 7 built** | Catalogue/enrol, `expo-video` player with progress, module tasks, progress sync, notes, CGPA, certificates. |
| CAR-01 | AI Career Coach chat | ✅ Built | `CareerCoachChatScreen`. |
| CAR-02 | Resume builder | ❌ **Not built** | `src/api/resumes.js` has full CRUD and **no screen imports it** — an orphan. |
| CAR-03 | Career roadmap & insights | ✅ Built | `CareerDirectionsScreen`. |
| CAR-04 | Interview prep content | ❌ **Not built** | Appears only in marketing copy and code comments. No screen. |
| CAR-05 | Job / placement board | ✅ Built | `CareerScreen` + `JobDetailScreen`. |
| CAR-06 | Skills passport & badges | ✅ Built | `SkillsVaultScreen`. (`api/userCertificates.js` is a second orphan — `certificates.js` covers the need.) |
| COM-01 | Vision board | ✅ Built | Three screens. |
| COM-02 | MindCare sessions | ❌ **Not built** | No screen, no API module. |
| COM-03 | Community feed | ⚠️ **Partial** | `CommunityScreen` does announcements + group chat. **`src/api/communityFeed.js` is orphaned** — the posts feed, likes, replies and reporting are not built. |
| COM-04 | Streaks & achievements | ⚠️ **Partial** | A streak figure on Home; no achievements screen, no nudges. |
| COM-05 | To-do tracker | ❌ **Not built** | No screen. |
| SUP-01 | Support tickets | ✅ Built | `SupportScreen` (2026-08-24). |
| SUP-02 | Grievances | ✅ Built | Same screen, second tab. |
| **SUP-03** | **Push notifications** | ❌ **Not built** | `expo-notifications` is not installed; no device token is ever registered; `POST /api/notifications/subscribe` is never called. |
| SUP-04 | In-app notification centre | ✅ Built | `NotificationsScreen` (2026-08-24), with Home's bell showing the real unread count. |

### 1.5 Orphaned API modules — build the screen or delete the file

Four API clients exist with no consumer. Each is either a missing feature or dead code:

| Module | Verdict |
|---|---|
| `api/resumes.js` | Missing feature — FR-CAR-02. |
| `api/communityFeed.js` | Missing feature — the posts half of FR-COM-03. |
| `api/proctoring.js` | Missing feature — all of Phase 3's server wiring. |
| `api/userCertificates.js` | Probably redundant with `api/certificates.js`. Delete unless it serves a distinct endpoint. |

### 1.6 Recommended order

1. **Push notifications (FR-SUP-03).** Smallest high-value item. Install
   `expo-notifications`, register the token after login, call the subscribe endpoint,
   add a backend sender. Roughly a day.
2. **Quotient breakdown on the results screen (FR-ASMT-08).** The data already comes
   back from `submitAssessment`; it is a rendering job. Half a day.
3. **Offline answer buffering (FR-ASMT-04).** Protects real exam attempts on campus
   Wi-Fi. One to two days.
4. **Resume builder (FR-CAR-02)** and **community feed (FR-COM-03).** The API clients
   are already written. Two to three days each.
5. **Proctoring integration (Phase 3).** The largest piece by an order of magnitude,
   and the one that decides whether mobile assessments can count. Needs a device in
   hand from day one. Weeks, not days.
6. MindCare, to-do tracker, interview prep, AIQ stage, skill-assessment player — all
   "Could"/"Should" priority in the SRS. After the above.


### Phase 1 detail (Core Auth) — all twelve FRs

| Requirement | Status |
|---|---|
| FR-AUTH-01 Institution selection | ✅ `screens/auth/InstitutionSelectorScreen.js`, real `GET /api/colleges` |
| FR-AUTH-02 Signup with OTP | ✅ `SignupScreen` → `SignupOtpScreen` → `CreatePasswordScreen`. Three-step: verify the email owns an inbox (`/auth/send-signup-otp`), then create the account (`/auth/register`). Accounts land as **`status: 'pending'` with no college** — an admin provisions them; the signup screen says so up front. |
| FR-AUTH-03 Login with password | ✅ `screens/auth/LoginScreen.js` |
| FR-AUTH-04 Login OTP verification | ✅ `screens/auth/OtpVerifyScreen.js`, incl. the 409 "already logged in elsewhere" force-logout confirm |
| FR-AUTH-05 Forced password change | ✅ `ChangePasswordScreen`. **The old "go finish on the web dashboard" dead-end is gone.** Full native path: login (`mustChangePassword`) → OTP (`flowType: 'first-login'`) → `requirePasswordChange` + fresh `password-change` tempToken → set password → JWT → signed in. Also handles the `alreadyRegistered` branch, which returns a valid token and must sign the student in rather than error. |
| FR-AUTH-06 Forgot/reset password | ✅ `ForgotPasswordScreen` → `ResetPasswordScreen`. Always sends `collegeCode` so the backend scopes the lookup to one institution (unscoped lookups are the cross-college reset the backend security fix exists to prevent). Gives `wrongCollege` and `isFirstTimeUser` their own explanatory UI instead of a raw error. |
| FR-AUTH-07 Secure session storage | ✅ `context/AuthContext.js` + `expo-secure-store` |
| FR-AUTH-08 Silent token renewal | ✅ Three triggers, all via `renewAuthToken()` in `api/client.js`: a 30-min interval while foregrounded, on every foreground transition, and a 401 response interceptor that renews once and replays the failed request. Concurrent callers share one in-flight renewal; `_retriedAfterRenew` prevents a renew→401→renew loop. |
| FR-AUTH-09 Biometric login | ✅ `BiometricUnlockScreen` + toggle in `SettingsScreen`, via `expo-local-authentication`. **Gates re-opening an existing session — it is not a second way in**: no server call, the JWT is in SecureStore either way, so the OTP and single-session guarantees are untouched. Escape hatch is "Sign out", not "Skip". Degrades to unlocked if the sensor/enrolment disappears after opt-in. |
| FR-AUTH-10 Single active session | ✅ (the force-logout retry **is** FR-AUTH-10's native equivalent) |
| FR-AUTH-11 Device fingerprinting | ✅ `utils/device.js` — stable per-install `X-Device-Id` in SecureStore, plus `X-Device-Platform/Model/Name` and a **descriptive `User-Agent`**. The UA matters: the backend's existing sniffer (`routes/auth.js` `logAuthEvent`) string-matches `Android`/`iPhone`/`Mac OS X`, so a bare RN request logged as "Browser / Unknown OS / Desktop". No backend change needed. |
| FR-AUTH-12 Onboarding profile completion | ✅ `screens/onboarding/ProfileCompletionScreen.js` — 4-step wizard (identity → address → qualification → goals), gated on `isRegistered !== true`, the same flag the web uses to force ComprehensiveSignup. Prefills from any existing record so nothing is retyped across platforms. |

**Phase 1 verification status (2026-08-06).** Everything parses, every import/route resolves,
and every endpoint was read against `back-end/routes/auth.js` / `users.js` before wiring.
Confirmed on `emulator-5554` against the live backend at `192.168.0.105:5000`:

- ✅ App builds, installs, launches; JS bundle loads (`Running "main"`).
- ✅ Welcome → InstitutionSelector → Login → Signup / ForgotPassword all render and navigate.
- ✅ **The new device-fingerprint headers don't break requests** — college search returned live
  backend data through the modified axios interceptor.
- ✅ Login screen's new "Create an Account" and working "Forgot Password?" link (previously an
  `alert()` dead-end) both render and route correctly.

**Still unverified** — needs real accounts and a physical device:
signup OTP delivery, forced first-login password change, reset-password round trip, silent token
renewal on a genuinely expired session, and **biometrics** (the emulator has no enrolled sensor;
`getBiometricCapability()` will report unavailable and the gate deliberately opens rather than
stranding the user, so the lock path itself is untested).

**Note for anyone using the old memory/status notes from 2026-07-30:** that snapshot invented
its own Phase 0–8 numbering that does **not** match the SRS doc's Phase 0–10. This document
supersedes that numbering — use the SRS's phases from now on.

### Two things worth knowing before touching the onboarding/registration endpoints

1. **`register-section` merges, `register-details` replaces.** `PATCH /users/register-section`
   merges into the embedded `registration` subdoc and deliberately does *not* set `isRegistered`.
   Only `POST /users/register-details` sets it — and that one assigns
   `student.registration = registrationSubdoc` wholesale. So the final submit in `api/profile.js`
   reads the existing record and layers the mobile answers on top; posting only what the mobile
   wizard collected would wipe sections the student filled in on the web.
2. **Both of those endpoints are unauthenticated and trust `email` from the request body**
   (`back-end/routes/users.js` — no `protect` middleware). That is a pre-existing backend issue,
   not introduced by the mobile work, but it means anyone can write registration data for any
   email. Worth fixing server-side before launch.

---

## 2. Feature → Mobile Placement Map

For each web feature: where it lives today on web, where it should land on mobile (existing
file to fill in, or new file to create — naming follows the existing `src/screens/<module>/XScreen.js`
convention), and which backend routes it talks to (all reusable as-is per SRS Appendix B).

### 🏠 Home tab

| Web source | Mobile target | Backend routes (reused as-is) | Notes |
|---|---|---|---|
| `DashboardHome.jsx` + `HeroSection`, `CollegeBanners` | `screens/home/HomeScreen.js` (**done, real data — updated 2026-08-04**) | `courseEnrollments.js` (`GET /courseEnrollments/student/:studentId`), `stageresults.js` (`GET /stageresults/user/:userId/status`), `colleges.js` (`GET /colleges/:id/banners`) | Now shows a real "Continue Learning" card (furthest-along in-progress enrollment + progress bar), a real "Next Up" assessment CTA (simplified T1→T2→T3→T4 cascade off real stage-status, without the web's course-ID cross-referencing since course-gating isn't wired yet), and a real auto-rotating college banner carousel. CTAs still navigate to the (still-stub) Assessments/Learning tabs, which is honest since those aren't built yet. `CareerPathsWidget`/`ActiveSkillsWidget`/`LearningProgress` (calendar+todos) were **not** ported — the first two need career-agent-shaped data transforms not worth building before Career (Phase 5) exists, and the calendar/todos widget is a substantial feature of its own; revisit once those phases land. |
| Hamburger side menu (new — not a 1:1 web port) | `components/SideDrawer.js` (**new**), triggered from a hamburger icon in `HomeScreen.js`'s hero row | — | Custom-built (no `@react-navigation/drawer` — avoids adding gesture-handler/reanimated as new native deps) slide-in panel: profile summary, My Profile, Notifications, Settings, Support & Grievances, Face Verification Test (Beta), Log Out. Notifications/Settings/Support are new lightweight `ComingSoon`-based stub screens registered on `AppStack` (`screens/notifications/`, `screens/profile/SettingsScreen.js`, `screens/support/`) so the menu has somewhere honest to go. **Only wired into Home for now** — other tab screens don't have a header/hamburger yet; decide whether to extract a shared `AppHeader` component once a second screen needs one rather than duplicating the hero-row hamburger pattern. |
| `StudentOnboarding` first-run wizard | Fold into `HomeScreen.js` as a conditional first-run banner, not a separate screen | `students.js` | Low priority — SRS marks full onboarding (FR-AUTH-12) as **Should**, not **Must**. Still not built. |

### 📝 Assessments tab

| Web source | Mobile target | Backend routes | Notes |
|---|---|---|---|
| `AssessmentsDashboard.jsx` | `screens/assessments/AssessmentsScreen.js` (**replace the stub**) | `assessments.js`, `results.js`, `stageresults.js` | Stage cards T1–T4 + AIQ, lock/unlock badges. This is the Phase 2 anchor screen. |
| `BaseLineTest.jsx` / question renderer | `screens/assessments/AssessmentPlayerScreen.js` (**new**, pushed full-screen per SRS §10 — not a tab child) | `assessments.js`, `baselineresults.js` | FR-ASMT-02/03/04: Likert/Likert-7/MCQ renderer, server-authoritative timer that survives app kill, local answer buffering for flaky connectivity. This is the highest-value new screen — unblocks proctoring wiring (per README's own next-steps note) and Home's pending-assessment widget. |
| `SkillAssessmentPlayer.jsx` | `screens/assessments/SkillAssessmentPlayerScreen.js` (**new**) | `assessments.js`, `results.js` | Can share most of `AssessmentPlayerScreen`'s renderer component. |
| `MicroAssessmentList.jsx` / `MicroAssessmentPlayer.jsx` | `screens/assessments/MicroAssessmentListScreen.js` / `MicroAssessmentPlayerScreen.js` (**new**) | `assessments.js` | Should-priority per SRS — build after the main stage player works. |
| Results/report + `reportGenerator.js` PDF | `screens/assessments/ResultsScreen.js` (**new**) | `results.js`, `stageresults.js` | Skip PDF generation initially — show results natively, add "share/download" later. |
| `AssessmentHeld.jsx`, `LockedOut.jsx` | `screens/proctoring/AssessmentHeldScreen.js`, `LockedOutScreen.js` (**new**, non-tab full-screen) | `proctoring.js` | Belongs with Proctoring per Appendix A, reached from the assessment player. |

### 🎓 Learning tab

| Web source | Mobile target | Backend routes | Notes |
|---|---|---|---|
| `MyCourses.jsx` | `screens/learning/LearningScreen.js` (**replace the stub**) | `courses.js`, `courseEnrollments.js`, `enrollments.js` | Catalogue + enrolled list. |
| `CoursePlayer.jsx` (video, `LearningFlowPlayer`, notes, flashcards) | `screens/learning/CoursePlayerScreen.js` (**new**, non-tab full-screen) | `courses.js`, `courseEnrollments.js` | FR-LRN-02: use `expo-av` or `react-native-video`, not a web `<video>` port. This is the single biggest new-native-dependency screen in this tab. |
| `ModuleViewPage.jsx` (day/task view, flashcard/MCQ/reflection flow) | `screens/learning/ModuleViewScreen.js` (**new**) | `courses.js`, `tasks.js` | |
| `Notes.jsx` / `InlineNotes` | Fold into `ModuleViewScreen`/`CoursePlayerScreen` as a slide-up panel rather than a separate screen — SRS marks this **Should**, not **Must** | `notes.js` | |
| `CGPACalculator.jsx` | `screens/learning/CgpaCalculatorScreen.js` (**new**) | `cgpaRoutes.js` | SRS marks **Could** — pure client-side calc logic, low risk, good filler task between bigger screens. |
| `Certificate.jsx` | `screens/learning/CertificatesScreen.js` (**new**) | `certificates.js`, `userCertificates.js` | Deep-link to the existing public `/verify-certificate/:id` web page rather than reimplementing verification natively. |

### 💼 Career tab

| Web source | Mobile target | Backend routes | Notes |
|---|---|---|---|
| `CareerAgentEntry.jsx` / `CareerAgentDashboard.jsx` panels | `screens/career/CareerScreen.js` (**replace the stub**) → hub linking to sub-screens | `careerAgent.js`, `careerIntelligence.js` | Respect the existing `CareerLockContext`/`CareerLockService` gate — check `careerAgent.js`'s lock-status endpoint before showing the dashboard. |
| `ProfileAnalysis.jsx` (AI Career Coach chat) | `screens/career/CareerCoachChatScreen.js` (**new**) | `aiCareerCoachController` routes | FR-CAR-01, **Must**. Standard chat UI (FlatList + input bar). |
| `ResumeBuilder.jsx` | `screens/career/ResumeBuilderScreen.js` (**new**) | `resumes.js` | FR-CAR-02, **Should**. Native forms, skip the web's `html2canvas`/QR-embedded PDF pipeline initially — export via a simpler native PDF lib or defer to "open in web" for the polished export. |
| `InterviewPrepTool.jsx` | `screens/career/InterviewPrepScreen.js` (**new**) | `careerAgent.js` | **Could** priority — do last in this tab. |
| `Placement.jsx` / `PlacementDetail.jsx` | `screens/career/PlacementBoardScreen.js` / `PlacementDetailScreen.js` (**new**) | `placements.js`, `jobApplications.js` | FR-CAR-05, **Must**. |
| `SkillsPassport.jsx` | `screens/career/SkillsPassportScreen.js` (**new**) | `assessments.js`, `courseEnrollments.js`, `userCertificates.js` | Web places this near Profile, but SRS Appendix A explicitly assigns it to the **Career** tab — follow the SRS, not the web's URL structure. QR code via `react-native-qrcode-svg`. |

### 👥 Community tab

| Web source | Mobile target | Backend routes | Notes |
|---|---|---|---|
| `Community.jsx` (`NoticesFeed` + `CommunityHub`) | `screens/community/CommunityScreen.js` (**replace the stub**) | `community.js`, `announcements.js` | |
| `StudentGroups.jsx` / `GroupChat.jsx` | `screens/community/GroupsScreen.js` / `GroupChatScreen.js` (**new**) | `groups.js` | Web polls every 3s (`setInterval`), it does **not** use Socket.io for chat — you can port that same polling approach on mobile rather than standing up a new real-time layer just for this. |
| Vision board (`features/visionBoard/`) | `screens/community/VisionBoardScreen.js` (**new**) | `visionBoardRoutes.js`, `visionBoardProRoutes.js`, `userVisionBoardRoutes.js` | SRS marks **Could** — do last in this tab. |
| MindCare | `screens/community/MindCareScreen.js` (**new**) | — | ⚠️ The web audit did not turn up a working MindCare implementation to port from — confirm it actually exists on web before scoping mobile work here, since SRS lists it as **Could** and it may be aspirational on both platforms. |
| Badges (`Badges.jsx`, `BadgeGallery`) | `screens/community/BadgesScreen.js` (**new** — Appendix A assigns Badges/Streaks to Community, not Profile) | `badges.js`, `streaks.js` | Deep-link to public `/verify-badge/:id` web page rather than reimplementing verification natively. |

### 👤 Profile / More tab

This tab absorbs Profile, Settings, Notifications, and Support per SRS §10 — it is intentionally
the catch-all "More" tab, matching the single "Profile" tab already in `MainTabs.js`.

| Web source | Mobile target | Backend routes | Notes |
|---|---|---|---|
| `Profile.jsx` | `screens/profile/ProfileScreen.js` (**exists, partial** — view + logout only today) | `students.js`, `users.js` | Add edit-profile fields. |
| `Settings.jsx` | `screens/profile/SettingsScreen.js` (**partial — security section built 2026-08-06**) | `users.js` | Has the FR-AUTH-09 biometric toggle, single-session status, and device info. Still to add: in-app password change, theme switch (`ThemeContext` exists but nothing toggles it yet), notification prefs. |
| `Notifications.jsx` + `NotificationContext.jsx` (Socket.io) | `screens/notifications/NotificationCenterScreen.js` (**new**) | `notifications.js` | **Don't port the Socket.io client 1:1.** SRS FR-SUP-03 explicitly wants this replaced by native push (FCM/APNs via `expo-notifications`) — the in-app list should just be a REST list/mark-read/delete screen against `notifications.js`; keep Socket.io (if at all) only for a live badge count while foregrounded. |
| `SupportTicketsPage.jsx` | `screens/support/SupportTicketsScreen.js` (**new**) | `tickets.js` | |
| `GrievancesPage.jsx` | `screens/support/GrievancesScreen.js` (**new**) | `grievances.js` | |

---

## 3. Shared component gap (build the rest before the tab-by-tab work above)

Phase 1 closed part of this. `src/components/` now has:

`AppButton`, `AppTextInput`, `ScreenContainer`, `ComingSoon`, `QuickStatsBar`, `SideDrawer`,
`SkeletonBox`, and — added with Phase 1 — **`AuthScreenLayout`** (the dark-header/white-sheet
chrome, previously copy-pasted per screen), **`PillInput`**, **`PillButton`**, **`Banner`**,
**`PasswordRules`**, **`ChipSelect`**.

`Banner` is the one flagged below as already-duplicated; it is now a single component and the
auth screens use it. Still missing before Phase 2:

- **Card** (generic content card — course card, assessment stage card, job listing card all need this)
- **ListItem** / **EmptyState** (every list screen needs both a row component and a "nothing here yet" state)
- **Modal / BottomSheet** (confirmations, filters, the proctoring warning modal)
- **ProgressBar** (course progress, assessment stage progress)
- **Tag/Chip** for *content* (skill tags, status badges like "locked"/"in progress"/"completed") — `ChipSelect` is an input control, not this
- **Avatar**

Note that `AppButton` (navy, 12px radius) and `PillButton` (primary blue, 27px pill) both exist
on purpose: the auth flow was redesigned to the pill style while the app shell still uses the
older one. Pick per context; don't "unify" them without a design decision.

## 4. Architecture decisions to make before Phase 2, not during it

- **Server state.** SRS §8 recommends TanStack Query; the app currently has zero data-fetching
  abstraction (every screen calls its `api/*.js` function directly inside a `useState`/`useEffect`
  or a button handler). That's fine for 3 auth screens; it will not scale to 6 tabs' worth of
  lists, detail views, and cache invalidation. Adopt TanStack Query at the start of Phase 2, not
  retrofitted after 10 screens are already written the old way.
- **Client state.** SRS §8 recommends Zustand for auth/exam-session/proctoring state. `AuthContext`
  works fine as-is for auth; a timed assessment session (FR-ASMT-03: survive app kill, resume
  correctly) is exactly the kind of state a Context re-render model handles badly — use Zustand
  (or at minimum a dedicated reducer) for the assessment player specifically.
- **Push notifications.** Nothing wired yet (no `expo-notifications` import anywhere). This blocks
  FR-SUP-03 and the "streak nudge" part of FR-COM-04. Needs an Expo/Firebase project decision
  before Phase 7, and ideally a push-token-registration endpoint added to the backend early
  (SRS Appendix B already anticipates this).
- **Offline handling.** Nothing wired yet (no `NetInfo`, no local queue). Matters most for
  FR-ASMT-04 (answer buffering during a timed exam) — build this alongside the assessment player
  in Phase 2, not as an afterthought.

## 5. Recommended build order

1. ~~**Finish Phase 1's remaining Must items**~~ — **done 2026-08-06.** All of FR-AUTH-01…12 is
   built. The follow-up is *verification*, not more building: run an `eas build` and walk every
   auth path against a live backend, biometrics included (they cannot be tested on web or in
   Expo Go).
2. **Remaining shared components** (Section 3 above) — every later screen needs these.
3. **Phase 2 — Assessment engine**, starting with `AssessmentsScreen` (real dashboard) then
   `AssessmentPlayerScreen` (the core renderer + timer + offline buffering). This is the single
   highest-leverage phase: it unblocks real Home widgets, unblocks wiring the already-written
   `src/api/proctoring.js`, and is the SRS's own M3 milestone.
4. **Phase 3 — finish Proctoring**: wire `api/proctoring.js` into a real assessment session,
   validate the face pipeline on a physical device via `eas build` (per the hermesc blocker —
   see README), then build AppState background detection, heartbeat, evidence upload, and the
   overlay/warning/pause/held UI.
5. ~~**Home real widgets**~~ — **done 2026-08-04**, ahead of Phase 2/4 since the underlying enrollment/stage-status/banner endpoints don't actually require the mobile Assessments/Learning screens to exist first, just real backend data. Plus a hamburger side-menu (see Section 2).
6. **Phases 4–7** in SRS order (Learning → Career → Community → Support/Notifications) — by this
   point the pattern is mechanical: replace a `ComingSoon` stub with a real screen wired to the
   matching `back-end/routes/*.js` file, using the shared components from Section 3.

---

## 6. Known blockers (don't re-diagnose these as new bugs)

- **Local *debug* builds work** (verified 2026-08-06 — app built, installed and launched on
  `emulator-5554`). Two separate Windows failures have hit this repo; don't conflate them:
  - `ninja: error: failed recompaction: Permission denied` at `:app:configureCMakeDebug` —
    caused by a stale `.ninja_log.restat` in `android/app/.cxx/`. **Fix:** `./gradlew --stop`,
    delete `android/app/.cxx` (generated cache, safe), rebuild. Not a code bug.
  - `spawn UNKNOWN` on `npx expo export` — Windows Application Control blocks the bundled
    `hermesc.exe`. This only affects the ahead-of-time Hermes step in **production** builds;
    debug builds are unaffected (JS comes from Metro). Use `eas build` for production.
  - The `Hard link ... failed. Doing a slower copy instead` warnings are harmless — the repo is
    on `A:` and the Gradle cache on `C:`, and hard links can't cross volumes.
- **`ClassNotFoundException: expo.modules.splashscreen.SplashScreenManager` on startup is
  harmless** — `expo-splash-screen` isn't installed (never was) and DevLauncher catches it.
- **Face pipeline has never run on a physical device.** Algorithmically complete
  (`src/facepipeline/`), reachable in-app today (Profile → Face Verification Test), but untested —
  see README's "Known verification gaps" section for exactly what to check first if crops look wrong.
