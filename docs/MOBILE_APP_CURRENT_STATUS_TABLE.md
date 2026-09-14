# SMAART Institute Mobile App Current Status Table

_Prepared: 2026-09-06_  
_Source reviewed: `mobile-app/` source files, navigation, API clients, README, and implementation map._

## Overall Status

| Module | Current status | Evidence in app | Open gaps / risks |
|---|---|---|---|
| App shell and navigation | Mostly done | `App.js`, `src/navigation/RootNavigator.js`, `AppStack.js`, `MainTabs.js`; bottom tabs for Home, Learning, Career, Community, Profile; stack routes for assessment, notifications, support, settings, career, learning, community detail screens | Needs full route QA on real device; Assessments is stack route/shortcut rather than bottom tab |
| Theme and base UI | Mostly done | `ThemeContext.js`, `ScreenContainer`, `AppButton`, `PillButton`, `Banner`, `SkeletonBox`, `SideDrawer` | Some design consistency still depends on screen-by-screen QA; shared Card/ListItem/EmptyState abstractions are not formalized |
| Authentication | Done in code, needs device QA | Auth screens for splash, onboarding welcome, institution selector, login, OTP, signup, signup OTP, create password, forgot/reset, forced password change; `AuthContext.js`; `api/auth.js`; `expo-secure-store`; biometric unlock | OTP delivery, first-login password change, token renewal expiry behavior, and biometric behavior need physical-device/live-account verification |
| Profile completion onboarding | Done in code, needs live QA | `src/screens/onboarding/ProfileCompletionScreen.js`, `api/profile.js`; gated by `needsProfileCompletion` in auth context | Backend data overwrite/security behavior should be rechecked before launch |
| Home dashboard | Mostly done | `HomeScreen.js`; uses course enrollments, stage status, college banners, unread notification count, drawer shortcuts | Needs live-data QA across empty, new, active, and completed student states |
| Side drawer | Done in code | `SideDrawer.js` overlays app stack; routes to profile, notifications, support, settings, performance, career tools, face verification, logout | Currently custom drawer, not React Navigation drawer; verify gestures/overlay behavior on small devices |
| Assessments dashboard | Mostly done | `AssessmentsScreen.js`; T1-T4 cards, stage status, lock handling, attempt count | Needs live testing for all lock/attempt edge cases |
| Assessment player | Mostly done | `AssessmentPlayerScreen.js`; backend attempt lifecycle, timer, answer save, retry queue, submit handling; lazy-loaded in `AppStack.js` | Must be stress-tested for app backgrounding, network drops, expired assessment token, and server held state |
| Proctoring during assessment | Partial to mostly done | `ProctoringGate.js`, `useProctoringSession.js`, `api/proctoring.js`; pre-attempt face gate, heartbeat, background detection, server decision handling | Continuous face re-verification/gaze/audio/environment checks not built; physical-device validation is mandatory |
| Face verification test | Partial validation tool | `FaceVerificationTestScreen.js`, `src/facepipeline/*`; lazy-loaded to avoid startup native crashes | Pipeline exists but needs Android/iOS physical-device verification and model download validation |
| Learning catalogue/path | Mostly done | `LearningScreen.js`; published courses, enrollments, staged/track paths, search, unlock presentation | `ENFORCE_PROGRESSION_GATES` appears intentionally disabled in `courseUnlock.js`; product must decide whether to enforce |
| Course player | Mostly done | `LearningScreen.js`, `CourseVideoPlayer.js`, `CourseVideoPlayerImpl.js`, `courseFlow.js`; loads course content, stages, progress, notes; saves video/quiz/progress | Needs live content QA for all content shapes; large screen file may need later refactor after stabilization |
| Learning tools | Mostly done | `CertificatesScreen.js`, `NotesScreen.js`, `LibraryScreen.js`, `CgpaCalculatorScreen.js` | Verify APIs and empty/error states with real accounts; certificate verification/export behavior may depend on web |
| Career placements | Mostly done | `CareerScreen.js`, `JobDetailScreen.js`, `api/placements.js`; jobs, applications, withdrawal, offers, fairs, companies | Apply payload is minimal; resume/file attachment behavior may need product decision |
| AI Career Coach | Mostly done | `CareerCoachChatScreen.js`, `api/careerCoach.js` / career agent APIs | Needs API key/backend reliability QA and chat error handling review |
| Career directions | Mostly done | `CareerDirectionsScreen.js`, `api/careerAgent.js` | Needs live account QA for lock/onboarding/dashboard branches |
| Resume Builder | Mostly done | `ResumeBuilderScreen.js`, `api/resumes.js`, Toolkit link | PDF export is not a polished native export; verify backend export behavior and UX wording |
| Career utilities | Mostly done | `SkillsVaultScreen.js`, `ToolkitScreen.js`, `DictionaryScreen.js` | Confirm exact product naming and whether Skills Vault equals Skills Passport requirements |
| Community notices/discussions | Mostly done | `CommunityScreen.js`, `DiscussionDetailScreen.js`, `api/announcements.js`, `api/communityFeed.js` | Needs live QA for create/reply permissions, pagination, and moderation states |
| Study groups/chat | Mostly done | `CommunityScreen.js`, `api/groups.js`; group chat polling while open | Polling load and chat consistency should be tested with multiple users |
| Vision board | Mostly done | `VisionBoardScreen.js`, `VisionBoardCreateScreen.js`, `VisionBoardDetailScreen.js`, `api/visionBoard.js` | Needs live create/update/delete/media QA depending on backend capabilities |
| Profile | Mostly done | `ProfileScreen.js`, profile/certification UI, `api/profile.js` | Verify edit permissions, certifications, and server field mapping |
| Settings | Mostly done | `SettingsScreen.js`; biometric toggle, theme switch, password change, device/session info | Notification preferences are not present unless backend supports them |
| Notifications list | Mostly done | `NotificationsScreen.js`, `api/notifications.js`; list, unread filter, mark read/all, delete/clear | Live badge and list refresh need QA; pagination and empty states should be tested |
| Push notifications | Partial | `expo-notifications` dependency, `pushNotifications.js`, `AuthContext.js` registers/unregisters tokens, `notificationsAPI.registerDevice` | Actual delivery requires real device, dev/prod build, EAS project ID, and Firebase/Expo credentials |
| Support and grievances | Mostly done | `SupportScreen.js`, `api/tickets.js`, `api/grievances.js`; create, history, detail modal, response/reply flow | Attachments/file picker not implemented; verify resolved/closed reply restrictions |
| Performance analytics | Partial to mostly done | `PerformanceScreen.js`, `api/analytics.js` | Needs validation against real analytics data and expected stakeholder metrics |
| Build/config | Partial | `app.json`, `eas.json`, `metro.config.js`, Android folder, native dependencies installed | Production build and physical-device testing are still the biggest release readiness unknowns |

## Phase Status

| Phase | Scope | Status | Notes |
|---|---|---|---|
| Phase 0 | Project setup, Expo config, dependencies, navigation scaffold | Done | App structure and config exist. Native modules mean custom dev client/builds are required. |
| Phase 1 | Core auth and profile completion | Done in code | Needs complete live account and physical-device verification. |
| Phase 2 | Assessment engine | Mostly done | Dashboard/player are built; verify server token, retry queue, submission, held state, and lock edges. |
| Phase 3 | Proctoring adaptation | Partial to mostly done | Face gate, session heartbeat, and background detection exist; continuous monitoring remains deferred. |
| Phase 4 | Learning/course platform | Mostly done | Course catalogue/player/progress/tools exist; lock enforcement decision remains open. |
| Phase 5 | Career and placement | Mostly done | Placements, applications, coach, directions, resume, toolkit, dictionary exist; export/attachment polish remains open. |
| Phase 6 | Community/gamification | Mostly done for community, partial for gamification | Notices, discussions, groups, chat, vision board exist; badges/streaks/wellbeing are not confirmed/built as full features. |
| Phase 7 | Support and notifications | Mostly done, push partial | In-app notifications/support/grievances exist; actual push delivery is not proven. |
| Phase 8 | Hardening and QA | Not complete | Requires device testing, network failure testing, proctoring validation, and build validation. |
| Phase 9 | Store submission | Not started | Requires release build, assets, permissions wording, privacy data, and QA signoff. |
| Phase 10 | Post-launch operations | Not started | Requires monitoring, crash reporting, support workflow, and feedback loop. |

## Priority Gaps Before Launch

| Priority | Gap | Why it matters | Suggested next action |
|---|---|---|---|
| P0 | Physical Android/iOS validation | Camera, biometrics, ONNX, push notifications, splash, and native modules cannot be trusted from source review alone | Run full QA on real Android and iOS dev/prod builds |
| P0 | Assessment/proctoring live attempt QA | Assessment data loss or incorrect held state is high risk | Test start, answer save, retry, submit, backgrounding, warn/pause/held with real backend |
| P0 | Push notification delivery | Code registers tokens, but delivery depends on credentials and device builds | Configure EAS/Firebase credentials and send test push |
| P1 | Course unlock enforcement decision | Lock logic exists but enforcement appears disabled | Product/academic team should decide and document intended visibility rules |
| P1 | Resume/certificate/report export | Native export is not fully polished | Decide between web deep-link export and native PDF implementation |
| P1 | Backend/profile security review | Profile registration endpoints may trust request body identity depending on backend behavior | Audit backend auth/authorization before launch |
| P2 | Shared UI cleanup | Large screens contain repeated UI patterns | Refactor after QA, not before, unless bugs force it |
| P2 | Gamification/wellbeing scope | Badges/streaks/MindCare are not clearly complete mobile features | Confirm scope and either implement or explicitly defer |

## Evidence Files Reviewed

| Area | Files |
|---|---|
| App entry/navigation | `mobile-app/App.js`, `src/navigation/AuthStack.js`, `src/navigation/AppStack.js`, `src/navigation/MainTabs.js`, `src/navigation/RootNavigator.js` |
| Auth/session | `src/context/AuthContext.js`, `src/api/auth.js`, `src/utils/storage.js`, `src/utils/biometrics.js`, `src/utils/device.js` |
| Push | `src/utils/pushNotifications.js`, `src/api/notifications.js`, `package.json` |
| Assessments/proctoring | `src/screens/assessments/*`, `src/facepipeline/*`, `src/api/assessments.js`, `src/api/proctoring.js` |
| Learning | `src/screens/learning/*`, `src/components/CourseVideoPlayer*`, `src/api/courses.js`, `src/api/notes.js`, `src/utils/courseFlow.js`, `src/utils/courseUnlock.js` |
| Career | `src/screens/career/*`, `src/api/placements.js`, `src/api/resumes.js`, `src/api/careerCoach.js`, `src/api/careerAgent.js` |
| Community | `src/screens/community/*`, `src/api/communityFeed.js`, `src/api/groups.js`, `src/api/visionBoard.js`, `src/api/announcements.js` |
| Profile/support | `src/screens/profile/*`, `src/screens/support/SupportScreen.js`, `src/screens/performance/PerformanceScreen.js`, `src/api/tickets.js`, `src/api/grievances.js`, `src/api/analytics.js` |
