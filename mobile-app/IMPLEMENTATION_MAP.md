# Mobile App — Web Feature → Mobile Placement Map & Current Status

_Last updated: 2026-08-03_

This document answers one question: **for every feature that already exists on the web
dashboard, where does it go in `mobile-app/`, and how far along is it?** It sits alongside
two other docs — don't duplicate them, read them together:

- `../docs/04-React-Native-App-Requirements-and-Roadmap.docx` — the **contract**: full FR/NFR
  list, phase numbering (Phase 0–10), architecture recommendations. Treat its phase numbers as
  canonical.
- `README.md` (this folder) — the **quickstart**: how to run it, what works today, face-pipeline
  details.

Tab structure below follows the SRS's Section 10 IA and Appendix A screen inventory exactly —
which also matches what's already scaffolded in `src/navigation/MainTabs.js` (Home,
Assessments, Learning, Career, Community, Profile). Nothing here proposes a new tab.

---

## 1. Real status as of 2026-08-03

| Phase (SRS §11) | Scope | Status |
|---|---|---|
| Phase 0 — Discovery & Setup | RN scaffold, CI, EAS config | **Done.** `eas.json`/`.easignore` exist. Local `expo export`/`run:android` builds are blocked by this machine's Windows Application Control policy on the bundled `hermesc.exe` — not a code issue, use `eas build` instead. |
| Phase 1 — Core Auth & Navigation | FR-AUTH-01…12 | **Mostly done.** See breakdown below. |
| Phase 2 — Assessment Engine | FR-ASMT-01…09 | **0% — not started.** `AssessmentsScreen` is a `ComingSoon` stub. |
| Phase 3 — Proctoring Adaptation | FR-PROC-01…15 | **Partial.** Face-match model (FR-PROC-02/03) is built but never run on a real device. Everything else (FR-PROC-04…15) unbuilt. |
| Phase 4 — Learning & Course Platform | FR-LRN-01…07 | **0% — not started.** `LearningScreen` is a stub. |
| Phase 5 — Career & Placement | FR-CAR-01…06 | **0% — not started.** `CareerScreen` is a stub. |
| Phase 6 — Community, Wellbeing, Gamification | FR-COM-01…05 | **0% — not started.** `CommunityScreen` is a stub. |
| Phase 7 — Support & Notifications | FR-SUP-01…04 | **0% — not started.** No notifications/support screens exist at all. |
| Phase 8–10 | Hardening, store submission, post-launch | Not started (expected — nothing to harden yet). |

### Phase 1 detail (Core Auth) — what's done vs. what's left

| Requirement | Status |
|---|---|
| FR-AUTH-01 Institution selection | ✅ Done — `screens/auth/InstitutionSelectorScreen.js`, real `GET /api/colleges` |
| FR-AUTH-03 Login with password | ✅ Done — `screens/auth/LoginScreen.js` |
| FR-AUTH-04 Login OTP verification | ✅ Done, **and just hardened today** — `screens/auth/OtpVerifyScreen.js` now handles the 409 "already logged in elsewhere" single-session conflict with a proper "log out other device & continue" confirm, instead of dead-ending on a raw error string |
| FR-AUTH-07 Secure session storage | ✅ Done — `context/AuthContext.js` + `expo-secure-store` |
| FR-AUTH-10 Single active session | ✅ Done (the force-logout retry above **is** FR-AUTH-10's native equivalent) |
| FR-AUTH-02 Signup with OTP | ❌ Not built — no signup screens exist; students must be pre-registered via the web/admin flow today |
| FR-AUTH-05 Forced password change | ⚠️ Detected but not handled — shown a message pointing to the web dashboard, no native flow |
| FR-AUTH-06 Forgot/reset password | ❌ Not built |
| FR-AUTH-08 Silent token renewal | ❌ Not built — `getMe()` validates on relaunch only, no proactive refresh |
| FR-AUTH-09 Biometric login | ❌ Not built |
| FR-AUTH-11 Device fingerprinting | ❌ Not built — no device ID sent with auth requests |
| FR-AUTH-12 Onboarding profile completion | ❌ Not built |

**Note for anyone using the old memory/status notes from 2026-07-30:** that snapshot invented
its own Phase 0–8 numbering that does **not** match the SRS doc's Phase 0–10. This document
supersedes that numbering — use the SRS's phases from now on.

---

## 2. Feature → Mobile Placement Map

For each web feature: where it lives today on web, where it should land on mobile (existing
file to fill in, or new file to create — naming follows the existing `src/screens/<module>/XScreen.js`
convention), and which backend routes it talks to (all reusable as-is per SRS Appendix B).

### 🏠 Home tab

| Web source | Mobile target | Backend routes (reused as-is) | Notes |
|---|---|---|---|
| `DashboardHome.jsx` + `HeroSection`, `LearningProgress`, `CareerPathsWidget`, `ActiveSkillsWidget`, `CollegeBanners` | `screens/home/HomeScreen.js` (**exists but is a hardcoded stub today** — real user greeting but fake module list) | `students.js`, `courses.js`, `enrollments.js`, `announcements.js` | Replace the hardcoded `MODULES` array with real widgets: next assessment CTA, in-progress course, streak, announcement banner. This is the natural first screen to build after Assessments (Phase 2), since its most useful widget (pending assessment) depends on that data existing. |
| `StudentOnboarding` first-run wizard | Fold into `HomeScreen.js` as a conditional first-run banner, not a separate screen | `students.js` | Low priority — SRS marks full onboarding (FR-AUTH-12) as **Should**, not **Must**. |

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
| `Settings.jsx` | `screens/profile/SettingsScreen.js` (**new**) | `users.js` | Password change, theme, notification prefs. |
| `Notifications.jsx` + `NotificationContext.jsx` (Socket.io) | `screens/notifications/NotificationCenterScreen.js` (**new**) | `notifications.js` | **Don't port the Socket.io client 1:1.** SRS FR-SUP-03 explicitly wants this replaced by native push (FCM/APNs via `expo-notifications`) — the in-app list should just be a REST list/mark-read/delete screen against `notifications.js`; keep Socket.io (if at all) only for a live badge count while foregrounded. |
| `SupportTicketsPage.jsx` | `screens/support/SupportTicketsScreen.js` (**new**) | `tickets.js` | |
| `GrievancesPage.jsx` | `screens/support/GrievancesScreen.js` (**new**) | `grievances.js` | |

---

## 3. Shared component gap (build this before the tab-by-tab work above)

Right now `src/components/` has exactly four building blocks: `AppButton`, `AppTextInput`,
`ScreenContainer`, `ComingSoon`. That's enough for auth screens but nowhere near enough to build
six tabs of list/detail/chat/media screens. Before starting Phase 2, add:

- **Card** (generic content card — course card, assessment stage card, job listing card all need this)
- **ListItem** / **EmptyState** (every list screen needs both a row component and a "nothing here yet" state)
- **Modal / BottomSheet** (confirmations, filters, the proctoring warning modal)
- **Banner/Toast** (currently every screen hand-rolls its own inline error/info banner — `OtpVerifyScreen.js` and `LoginScreen.js` already duplicate this pattern; worth extracting now before a 6th and 7th copy appears)
- **ProgressBar** (course progress, assessment stage progress)
- **Tag/Chip** (skill tags, status badges like "locked"/"in progress"/"completed")
- **Avatar**

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

1. **Finish Phase 1's remaining Must items**: forgot/reset password (FR-AUTH-06), silent token
   renewal (FR-AUTH-08), device fingerprinting (FR-AUTH-11) — small, self-contained, and closes
   out a phase that's otherwise 90% done.
2. **Shared components** (Section 3 above) — every later screen needs these.
3. **Phase 2 — Assessment engine**, starting with `AssessmentsScreen` (real dashboard) then
   `AssessmentPlayerScreen` (the core renderer + timer + offline buffering). This is the single
   highest-leverage phase: it unblocks real Home widgets, unblocks wiring the already-written
   `src/api/proctoring.js`, and is the SRS's own M3 milestone.
4. **Phase 3 — finish Proctoring**: wire `api/proctoring.js` into a real assessment session,
   validate the face pipeline on a physical device via `eas build` (per the hermesc blocker —
   see README), then build AppState background detection, heartbeat, evidence upload, and the
   overlay/warning/pause/held UI.
5. **Home real widgets** (now unblocked by real assessment/course data).
6. **Phases 4–7** in SRS order (Learning → Career → Community → Support/Notifications) — by this
   point the pattern is mechanical: replace a `ComingSoon` stub with a real screen wired to the
   matching `back-end/routes/*.js` file, using the shared components from Section 3.

---

## 6. Known blockers (don't re-diagnose these as new bugs)

- **Local production builds fail** (`npx expo export` / `expo run:android`) with `spawn UNKNOWN`
  — this machine's Windows Application Control policy blocks the bundled `hermesc.exe`, it is not
  a code bug. Use `eas build` (cloud builds) instead; `eas.json`/`.easignore` are already set up.
- **Face pipeline has never run on a physical device.** Algorithmically complete
  (`src/facepipeline/`), reachable in-app today (Profile → Face Verification Test), but untested —
  see README's "Known verification gaps" section for exactly what to check first if crops look wrong.
