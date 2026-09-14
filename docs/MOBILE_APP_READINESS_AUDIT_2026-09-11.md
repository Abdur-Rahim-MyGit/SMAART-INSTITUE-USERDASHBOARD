# SMAART Mobile App — Readiness Audit

_Prepared: 2026-09-11 · Branch `soubanaadi` · React Native / Expo SDK 57_

**Scope:** every requirement in `docs/MOBILE_APP_REQUIREMENTS_DOCUMENT.md`, checked against the code
that implements it *and* the backend route it calls. Status reflects what the code actually does, not
what the screen looks like.

**Size:** 42 screens · 25 API clients · 17 shared components · ~29,000 lines · 110/110 files parse clean.

---

## Verdict

The app is broadly built but not shippable. About four in ten requirements are genuinely finished.
The blocker is not missing screens — it is that several *finished* screens do not work against the
live backend: the exam clock never starts, every job application is rejected, and the signup flow has
no way in. A production build would also point at a home LAN address.

---

## The count

| Status | Count | Share | Meaning |
|---|---:|---:|---|
| Done | 31 | 39% | Wired to the real API, states handled |
| Partial | 34 | 43% | Works, but a named piece is missing |
| Not done / broken | 5 | 6% | Cannot work as written today |
| Needs a real device | 8 | 10% | Code complete, unprovable from source |
| Deferred | 1 | 1% | Agreed out of scope for this build |
| **Total** | **79** | **100%** | |

## By module

| Module | Done | Partial | Not done | Device | Deferred | Total |
|---|---:|---:|---:|---:|---:|---:|
| Authentication & session (AUTH-01..12) | 6 | 2 | 2 | 2 | 0 | 12 |
| Home dashboard (HOME-01..06) | 1 | 5 | 0 | 0 | 0 | 6 |
| Assessments (ASMT-01..09) | 4 | 4 | 1 | 0 | 0 | 9 |
| Proctoring (PROC-01..09) | 4 | 0 | 0 | 4 | 1 | 9 |
| Learning & courses (LRN-01..10) | 5 | 3 | 1 | 1 | 0 | 10 |
| Career & placements (CAR-01..10) | 2 | 7 | 1 | 0 | 0 | 10 |
| Community (COM-01..07) | 1 | 6 | 0 | 0 | 0 | 7 |
| Profile & settings (PROF-01..07) | 4 | 3 | 0 | 0 | 0 | 7 |
| Notifications & push (NOTIF-01..05) | 3 | 1 | 0 | 1 | 0 | 5 |
| Support & grievances (SUP-01..04) | 1 | 3 | 0 | 0 | 0 | 4 |
| **All modules** | **31** | **34** | **5** | **8** | **1** | **79** |

Proctoring is the healthiest module once a device is available. Community, Career and the Home
dashboard carry the most unfinished work.

---

## The five that are not done

| ID | Requirement | Why it fails |
|---|---|---|
| AUTH-01 | Choose an institution before login | Screen is built and fetches real colleges. Nothing ever opens it — the welcome screen goes straight to login. |
| AUTH-02 | Sign up with email OTP | Three finished screens with no entry point. The login screen has no "create account" link. |
| ASMT-05 | Server-authoritative exam timer | The backend calculates remaining seconds then leaves it out of the response. The clock never starts. |
| LRN-03 | Enforce course unlock rules | One flag disables every gate. **The web app has the same flag set the same way**, so this is a product decision, not a mobile bug. |
| CAR-02 | Apply for a job | The app sends a five-word cover letter and nothing else. The backend demands fifty words, a resume link, a mobile number and a backlog count. |

---

## Stop-ship defects

Each confirmed by reading both the mobile code and the backend handler it calls.

### 1. The exam timer never runs — integrity

The player anchors its countdown on a start time from the server. The start endpoint computes the
remaining seconds, then builds a response object without it, and never sends a start time at all. The
countdown effect exits immediately. Students get **unlimited time**, the on-screen clock is frozen, the
one-minute warning never fires, and nothing auto-submits. The web app survives the same server gap via
a browser-storage fallback; mobile has none.

`mobile-app/src/screens/assessments/AssessmentPlayerScreen.js:152` · `back-end/routes/results.js:297` computes it, `:309` and `:443` omit it

### 2. Every job application is rejected — broken flow

Tapping apply sends a hardcoded five-word cover letter and no other fields. The backend rejects under
fifty words, then requires a resume URL, then requires a mobile number and active-backlog count. **The
call can never return anything but a 400.** Fixing it needs a cover-letter form and a backlog field, and
depends on resume export, which is also not built.

`mobile-app/src/screens/career/CareerScreen.js:177` · `back-end/routes/placements.js:735, :770, :800`

### 3. A production build would call a home LAN address — release

The environment file points at a private address on port 5000 and is not excluded from uploads, so the
bundler inlines it into the store build. The build profile sets no replacement. The API client fallback
is localhost, which is no better. Both URLs are plain HTTP, which iOS App Transport Security and
Android both block by default.

`mobile-app/.env` · `.easignore` · `eas.json` (no env block) · `src/api/client.js:7`

### 4. Answers a student gave can be scored as blank — data loss

Failed answer writes go into a retry queue held only in memory. If the app is killed, those answers are
gone and the server marks them unanswered. A forced submit on timeout or violation also proceeds with
unsent answers and writes them as blanks. The queue does not distinguish a network drop from an expired
token, so a non-retryable error **traps the student on the last question permanently**, behind a message
telling them to check their connection.

`mobile-app/src/screens/assessments/AssessmentPlayerScreen.js:107, :234, :241, :364`

### 5. Four finished screens have no way in — dead code

Institution selection and the three-step signup flow are fully written, wired to live endpoints, and
registered in the navigator. No screen navigates to either. That is roughly **880 lines of working code
a student can never reach**, and why AUTH-01 and AUTH-02 count as not done rather than partial.

`mobile-app/src/navigation/AuthStack.js` · `LoginScreen.js` has no signup link · `WelcomeOnboardingScreen.js:615` replaces straight to Login

### 6. The app cannot be submitted to either store — release

No iOS bundle identifier, so an iOS build cannot start. The Android package is still the scaffold
default beginning with `com.anonymous`, which is permanent once uploaded to Play. The submit profile is
empty, so no Apple or Play credentials. Location and microphone permissions are declared with no code
using them, and location is a sensitive permission that triggers a review form.

`mobile-app/app.json` · `eas.json`

---

## Serious, but not launch-stopping

### The home dashboard invents numbers

The progress bar is pinned to zero for any student who has not finished all four assessment stages —
nearly everyone — even though the real figure was fetched. The milestone count turns zero completed
stages into one, so the card always claims 25% and puts a green tick on the baseline. The badge count is
the literal text **"12 Badges"**, and the level reads a field no endpoint returns. A failed stage call is
indistinguishable from real data: there is no error state, and the loading flag is set but never read.

`src/screens/home/HomeScreen.js:181, :251, :381, :810`

### Editing your address reports success and saves nothing

The profile screen posts flat `city`/`state`/`zip`. The backend handler only accepts them nested under an
address object and silently discards the rest — then the app shows a success alert. The same mismatch
means the address always displays as "Not completed".

`src/screens/profile/ProfileScreen.js:159` · `back-end/routes/users.js:480`

### Three backend routes are shadowed by earlier ones

Deleting a push token matches the generic delete-by-id route first and throws a cast error, so **signing
out never unregisters the device** and a signed-out phone keeps receiving that account's notifications.
Poll voting hits an up/down vote handler that rejects the body, so poll votes always fail. Pinning a
discussion is moderator-only, so a student always gets a 403. In each case the intended handler further
down the file is unreachable.

`back-end/routes/notifications.js:218` before `:451` · `back-end/routes/community.js:1323` before `:1638` · `:1233`

### Push notifications arrive but go nowhere

The backend attaches a notification id and link to every push. The app never registers a tap handler, so
opening a notification just resumes the last screen. Android delivery also cannot be proven: no Firebase
credentials in the build profile, and the backend's own push service documents that Expo accepts the
request while the device receives nothing.

`src/utils/pushNotifications.js` · `eas.json` · `back-end/services/expoPushService.js:20`

### A network blip at launch signs the student out

Startup validates the stored token and deletes it on *any* thrown error. A timeout, a 500 or an offline
launch all wipe the session permanently. Only a 401 should clear it. Separately, a remote force-logout
drops the user to login with no explanation.

`src/context/AuthContext.js:62` · `src/api/client.js:112`

### Lists quietly stop at the first page

Support tickets are fetched with no parameters against a server default of ten, with no load-more and no
total, so a student with real history loses the older ones. Discussions cap at thirty; notices, groups
and chat history have no paging. Announcement reaction counts always read zero, because the app expects
a map of emoji to counts while the database stores a list of who reacted.

`src/screens/support/SupportScreen.js:155` · `CommunityScreen.js:135, :441`

### A missing model host blocks every assessment

Face-verification models are ~178 MB and download on first use. If the host is unreachable the gate goes
to an error state offering only retry or cancel, and the gate blocks every question. The built-in default
points at one local port while `.env.example` names a different one, so neither works in production. The
download also starts *after* the attempt has been created, while the screen tells the student their timer
is already running.

`src/facepipeline/modelDownloader.js:15` · `.env.example` · `useProctoringSession.js:126`

### Assessment stage locks are client-side only

The stage list refuses to open a locked stage, and comments in three files state the server re-checks it.
It does not. The start endpoint verifies only that the stage has not already been passed and that attempts
remain. Nothing stops a request that starts the final stage cold. A proctoring lock check in the same file
is commented out and labelled bypassed.

`back-end/routes/results.js:163, :328` · `src/screens/assessments/AssessmentsScreen.js:135`

### Course content students cannot finish, or should not see

Reflection and notes steps render a title and prompt with no input box, and completion requires either a
video or a quiz — so those steps **can never be ticked off**. Separately, a day with no uploaded video falls
back to a public Big Buck Bunny sample, and watching it to 95% records genuine course progress.

`src/utils/courseFlow.js:38` · `src/screens/learning/LearningScreen.js:1636, :1833`

---

## Written but never wired up

Beyond the four unreachable screens, a large amount of finished client code has no caller. Worth knowing
before estimating remaining work — several features are closer to done than they appear.

- **Vision boards** can be created and read, but update, delete and duplicate are written and never called.
  A student who hits the board limit is stuck with no way out.
- **Job fairs** list, but registration, the entry pass and the fair detail view are unused — and the backend
  excludes fair postings from the jobs feed, so they cannot be applied to at all.
- **Career coach and career agent** together have eleven unused client functions, including the analysis,
  skill-gap and learning-plan calls the UI advertises.
- **Course enrolment** has no write path. Nothing ever enrols a student or updates enrolment progress,
  which is what the completion percentages depend on.
- **Offer response** with e-signature is fully built but gated on an application status no backend route sets.
- **Study groups** can be created but never joined. There is no browse screen, and the join endpoint is
  restricted to group admins, so joining needs a backend change too.
- **No file picker exists anywhere**, the single cause behind four missing features: vision board covers,
  discussion attachments, ticket attachments and grievance attachments. The backend accepts all four.

---

## What is genuinely solid

- **Every endpoint the app calls exists.** All 203 calls across 25 clients matched against backend routes.
  Nothing 404s. Three fail for route-ordering or permission reasons (above), but no path is missing.
- **The codebase is clean.** All 110 files parse; no leftover TODO, stub or coming-soon debt anywhere.
- **Face verification matches the web exactly** — same two models, same thresholds, same alignment maths —
  so a student registered on one platform verifies on the other.
- **Proctoring decisions are server-authoritative.** The client never decides a violation tier itself, and
  warn / pause / hold are each handled distinctly.
- **Token renewal is well built**, with request de-duplication, replay after a 401, and renewal on both an
  interval and app foreground.
- **The Android 16 KB page-size patch is in place**, which Play now requires and the face-recognition
  library needs to build at all.
- **Notifications are the most complete module**, with real paging, optimistic updates and rollback.

---

## Features the web has and mobile does not

Mapped from the web router. Some are deliberate — mobile was never meant to mirror every page — but they
should be confirmed rather than assumed.

Interview preparation (deliberately left off the toolkit grid) · To-do tracker · British Council module ·
Profile analysis · Skills passport (separate from skills vault) · Standalone micro-assessments (available
only inside the course player) · Quotients grid as its own page · Skill assessment player · Welcome video
and motivational screens · Job fair detail and registration · Standalone badges page (currently a tab
inside skills vault) · Help, legal and locked-out pages.

One omission is not optional: there is **no privacy policy or terms screen anywhere in the app**. Both
stores require a privacy policy for an app that uses the camera and biometrics.

---

## Where to start

The first two items are small changes with large effects, and both sit on the backend rather than in the app.

| # | Do this | Unblocks |
|---:|---|---|
| 1 | Add the start time and remaining seconds to both assessment start responses | The exam timer, the one-minute warning and auto-submit |
| 2 | Move the delete-token route above delete-by-id, and split the duplicate vote route | Sign-out unregistering push, and poll voting |
| 3 | Set the production API URL over HTTPS in the build profile and exclude the local env file | Any build not on the office network |
| 4 | Add a signup link and an institution step to the login screen | Two requirements and ~880 lines already written |
| 5 | Persist the answer retry queue to storage and classify non-retryable errors | The two data-loss paths and the permanent submit lockout |
| 6 | Build the cover letter form, then resume export, then re-enable apply | The entire placements flow |
| 7 | Set a real bundle identifier and package name, fill in submit credentials, drop unused permissions | Store submission |
| 8 | Remove the invented dashboard figures and add loading and error states | Student trust in the home screen |
| 9 | Run the full flow on physical Android and iOS hardware | The eight requirements source review cannot settle |

---

## Method and limits

**Method.** Six parallel audits, one per domain, each reading the mobile source and the backend handler for
every requirement in the mobile requirements document. Every finding names a file and a line. The
stop-ship items were each re-checked by hand against both sides.

**Not covered.** Nothing was executed. No build was produced and no device was used, so the eight device
requirements are marked unproven rather than passed or failed. The mobile app has **no automated tests** and
is **not included in any CI workflow**, so there is no existing suite to draw on.

**Uncommitted.** One file differs from the last commit: `src/components/SideDrawer.js`, with theming fixes
and an active-route highlight.
