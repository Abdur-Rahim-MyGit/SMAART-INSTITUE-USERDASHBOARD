# SMAART Mobile — Release Checklist

_Companion to `MOBILE_APP_READINESS_AUDIT_2026-09-11.md`. Lists what the code
change on 2026-09-11 fixed, and the account-level values only a human with the
store and cloud credentials can supply._

---

## Fixed in code

Every item below is done in the working tree. The two columns say what to
re-test, not what is left to build.

| Audit item | Fix | Verify by |
|---|---|---|
| Exam timer never runs | `POST /results/start` now returns `startedAt`, `remainingSeconds` and `durationMinutes` on **both** the new-attempt and resume responses. The player prefers `startedAt`, falls back to `remainingSeconds`, and as a last resort anchors locally rather than leaving the clock frozen. | Start T1, watch the clock tick; kill and reopen the app — remaining time must have decreased by the wall-clock gap. |
| Every job application rejected | Real application form: cover letter with a live 50-word counter, mobile number, active-backlog count, optional portfolio/LinkedIn. The SMAART resume is attached automatically by exporting the newest resume and sending its public verification URL. | Apply to a job with a 60-word letter — expect 201, not 400. Apply with 20 words — expect the client to block before the request. |
| Production API points at a LAN address | `.env` added to `.easignore`; `preview` and `production` build profiles carry `EXPO_PUBLIC_API_URL=https://api.smaartminds.com/api` and the model URL; the client fallback is the production HTTPS host rather than localhost. | `eas build --profile preview`, install on a device off the office network, sign in. |
| Answers can be lost | The failed-write queue is mirrored to disk per attempt (`utils/pendingAnswers.js`) and restored on resume. Errors are classified: a server rejection is no longer retried forever, and the submit button offers "Submit anyway" instead of trapping the student behind "check your connection". | Answer a question with the backend stopped, force-kill the app, reopen the attempt — the answer is still selected and re-sends. |
| Signup and institution unreachable | Onboarding now goes to `InstitutionSelector` (with a "Skip for now"), which continues to Login. Login shows the chosen institution with a "Change" affordance and a "Create an account" link into the three-step signup flow. | From a fresh install, reach SignupScreen without editing code. |
| Store submission not possible | `ios.bundleIdentifier` and `android.package` are both `com.smaartminds.institute`. Unused microphone and location permissions removed from `app.json`, the onboarding permission cards, and blocked from the merged Android manifest. Privacy Policy and Terms screens added and reachable from Login and Settings. | `eas build --platform ios` starts without a bundle-identifier error. |
| Home dashboard invented numbers | Progress bar uses the real enrolment figure. Stage count is 0–4 (was floored at 1, so the card always claimed 25%). "12 Badges" and `user.level` replaced with real values from `/badges/user/:id/stats`. Unknown renders as `—`; a failed stage call says so and offers a refresh. | Sign in as a student with zero completed stages — the ring must read 0%, not 25%. |
| Address update silently discarded | Mobile posts to the `address` section (not `personalDetails`) with `pincode`. `buildFlatRegistration` now prefers the registration's address over the Student's, and the handler syncs both. | Edit the address, close and reopen Profile — the value persists. |
| Poll voting always fails | `POST /discussions/:id/vote` was registered twice; the surviving handler dispatches on the body and delegates poll votes. `/discussions/:id/poll-vote` added for new callers. | Vote in a poll — expect 200. |
| Sign-out leaves push registered | `DELETE /notifications/register-device` moved above `DELETE /:id`, which was swallowing it as a cast error. | Sign out, then send that account a push — the signed-out device must not receive it. |
| Push taps go nowhere | `utils/notificationRouting.js` maps the backend's web links onto mobile routes; `RootNavigator` attaches the listener while signed in, handling both warm taps and cold starts. | Tap an assessment notification from the tray — the Assessments screen opens. |
| Network blip signs the student out | The stored token is now deleted only on a 401/403. Other failures keep the session and show why on the login screen, as does a server-side force-logout. | Launch in airplane mode; re-enable networking and relaunch — still signed in. |
| Lists stop at the first page | Support tickets and community discussions both page, with a load-more row showing "N of total". | Create 12 tickets, confirm all are reachable. |
| Model download blocks assessments | Models prefetch on the Assessments screen, before any attempt exists, with a progress banner. Default URL now points at the production web app instead of a local port that did not match `.env.example`. | Clear app data, open Assessments, watch the banner complete before starting a stage. |
| Stage locks client-side only | `POST /results/start` enforces the T1→T4 chain server-side, mirroring exactly what `GET /stageresults/user/:id/status` reports. | `curl` a start for T4 on a fresh account — expect 403, not 201. |
| Reflection/notes steps uncompletable | A step now completes via video, quiz, **or** a submitted written reflection (`assignmentStatus`). The save button reads "Save & Mark Complete" on those steps. | Open a Reflect step, write something, save — the step ticks. |
| Big Buck Bunny counts as progress | A placeholder video never records progress, and carries a visible "sample clip" notice. | Open a day with no uploaded video, watch to the end — no tick. |
| Announcement reactions read zero | Counts are derived from the `{ userId, emoji }` array the model actually stores, and "did I react" compares user ids rather than an email. | React to an announcement — the count increments. |

---

## Still needed — values only you can supply

These are account-level, not code. Each has a named placeholder that will fail
loudly rather than silently shipping something wrong.

### 1. Store submission credentials — `mobile-app/eas.json`

```jsonc
"submit": { "production": {
  "ios": {
    "appleId":     "REPLACE_WITH_APPLE_ID_EMAIL",
    "ascAppId":    "REPLACE_WITH_APP_STORE_CONNECT_APP_ID",
    "appleTeamId": "REPLACE_WITH_APPLE_TEAM_ID"
  },
  "android": {
    "serviceAccountKeyPath": "./credentials/play-service-account.json",
    "track": "internal"
  }
}}
```

- `ascAppId` is the numeric App ID from App Store Connect → App Information.
- `appleTeamId` is on the Apple Developer membership page.
- The Play service-account JSON goes in `mobile-app/credentials/`, which is
  already in `.gitignore` and `.easignore`. Never commit it.

### 2. Android push delivery (FCM V1)

Push is wired end to end in code, but Android delivery cannot work until FCM V1
credentials are uploaded to EAS — Expo accepts the request and the device
receives nothing, which is exactly what `back-end/services/expoPushService.js`
warns about. Run `eas credentials` → Android → push notifications, or attach a
`google-services.json`. **Until this is done, Android push is silently dead.**

### 3. Confirm the bundle identifier before the first upload

`com.smaartminds.institute` is set for both platforms. The Android package is
**permanent once uploaded to Play** — change it now if it should be anything
else. The previous value was the scaffold default `com.anonymous.…`, which Play
would have locked in.

### 4. Host the legal documents

`src/screens/legal/LegalScreen.js` renders both documents locally (so store
review never hits a 404) and links out to:

- `https://app.smaartminds.com/privacy`
- `https://app.smaartminds.com/terms`

Those two pages must exist before submission — the privacy policy URL is a
required field in both consoles, and the app uses the camera and processes
biometric data, so it will be checked. Have someone with authority review the
wording; the drafts describe what the code actually does but are not legal
advice.

### 5. Drop the now-unused packages

`expo-location` and `expo-audio` are no longer referenced by any code or config
plugin. Their permissions are blocked from the manifest, so the build is already
submittable, but removing the dependencies is cleaner:

```
cd mobile-app && npm uninstall expo-location expo-audio
```

Re-run a build afterwards and confirm nothing regressed.

---

## Known limits of this pass

- **Nothing was executed.** No build was produced and no device was used. Every
  change is verified by reading both the mobile code and the backend handler it
  calls, plus a parse check of all 34 changed files. The audit's eight
  device-only requirements remain unproven.
- **The mobile app still has no automated tests** and is in no CI workflow, so
  there is no suite to catch a regression in any of the above. That is the
  single highest-value thing to add next.
- **Untouched from the audit:** the unwired client code (vision-board
  update/delete, job-fair registration, career-coach analysis calls, course
  enrolment writes, offer response, study-group join) and the missing file
  picker. These are features to finish, not defects to fix, and each needs a
  product decision about scope.
