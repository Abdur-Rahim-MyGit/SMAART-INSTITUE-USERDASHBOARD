# SMAART Institute — Mobile App (React Native / Expo)

Companion mobile app to the `front-end/` web dashboard, talking to the **same** `back-end/`
API. Full requirements and phased roadmap: `../Documentation/07-Technical-Docs-and-Reports/04-React-Native-App-Requirements-and-Roadmap.docx`.

The app is now well past the Phase 0/1 scaffold this README originally described.
Assessments, Learning, Career, Community, Notifications and Support are all built against
live endpoints — **no screen is a placeholder any more**. The two things genuinely
outstanding are **push notifications** (FR-SUP-04) and **running the proctoring pipeline on
real hardware** (FR-PROC-01…15).

`IMPLEMENTATION_MAP.md` in this folder is the authoritative per-phase status; read it
before assuming anything here is unbuilt.

## Stack

- Expo (SDK 57) + React Navigation (native-stack + bottom-tabs)
- `expo-secure-store` for the JWT (Keychain/Keystore-backed — see FR-AUTH-07 in the doc)
- `axios` for the API client, `context/AuthContext.js` for session state
- `react-native-vision-camera` + `@shopify/react-native-skia` + `onnxruntime-react-native`
  for on-device face detection/verification (see "Face verification pipeline" below)

⚠️ Because of the camera/ML native modules, **this app cannot run in plain Expo Go** — it
needs a custom dev client. Run `npx expo prebuild` then `npx expo run:android` (or
`run:ios` on a Mac) the first time, or build one via `eas build --profile development`.
Every later run can use `npx expo start --dev-client`.

## Getting started

1. Make sure the backend is running (`back-end/`, default port `5000`) and, if you want to
   test face verification, the front-end's dev server too (serves the ONNX model files).
2. Copy the env file and point it at your backend:
   ```
   cp .env.example .env
   ```
   - iOS Simulator: `http://localhost:5000/api` works as-is.
   - Android Emulator: use `http://10.0.2.2:5000/api`.
   - Physical device (a dev client — see above): use your computer's LAN IP,
     e.g. `http://192.168.1.23:5000/api` — find it with `ipconfig` on Windows.
     Your phone and computer need to be on the same network.
   - `EXPO_PUBLIC_MODEL_BASE_URL` needs the same LAN-IP treatment on a physical device —
     `localhost` only resolves on a simulator.
3. Install deps (already done if you just ran the scaffold): `npm install`
4. Build a dev client once (`npx expo prebuild && npx expo run:android`), then
   `npx expo start --dev-client` for subsequent runs.

## What actually works right now

- Fetches the real college list from `GET /api/colleges`.
- Logs in against `POST /api/auth/login` (every login currently requires OTP —
  see `back-end/routes/auth.js` — so this always leads to the OTP screen next).
- Verifies OTP via `POST /api/auth/verify-login-otp`, stores the JWT in SecureStore,
  and calls `GET /api/auth/me` on app relaunch to validate the stored session.
- Logs out via `POST /api/auth/logout` and clears the stored token.

Accounts still on the forced first-login password-change flow are detected and shown a
message pointing to the web dashboard — that flow isn't built natively yet (it's a good next
task, see FR-AUTH-05 in the doc).

## Face verification pipeline (Phase 3 groundwork)

The web app's proctoring identity check runs SCRFD (face detector) + ArcFace R50 (512-d face
embedding) entirely client-side via ONNX — see `front-end/src/services/onnxPipeline.js`. For
mobile verification to ever be comparable to a web registration (or vice versa), it has to run
the *same* models with the *same* math, not a different face-embedding model like ML Kit. So
`src/facepipeline/` is a from-scratch port of that exact pipeline to React Native:

```
src/facepipeline/
  modelDownloader.js    downloads the ~178MB SCRFD + ArcFace R50 weights on first launch
                         (not bundled into the app — see the size discussion in the doc's
                         Section 15) from EXPO_PUBLIC_MODEL_BASE_URL
  geometry.js            pure math ported verbatim: affine-transform solver, cosine
                         similarity, L2 normalize, NMS/IoU, median-pool embeddings
  scrfdDecode.js          SCRFD's raw-output decoding — also pure math, ported verbatim
  skiaImage.js            the one genuinely NEW piece: web used an HTML canvas to resize
                         frames and read pixels; RN has no canvas, so this uses
                         @shopify/react-native-skia's offscreen surfaces instead
  faceQuality.js          brightness/blur/face-size/head-pose/eyes-visible checks, ported
                         from faceQualityService.js
  onnxFacePipeline.js     orchestrator — initPipeline/registerFace/verifyFace, mirroring
                         faceVerificationService.js's public API shape
```

Try it: log in, go to **Profile → Face Verification Test (Beta)**. It downloads the models,
lets you register your face (5 captured frames) and then verify against it — fully offline
after the initial model download, exactly like the web app.

**What this is NOT yet**: wired to a real proctoring session. Registration/verification are
scoped server-side to a live exam attempt (`POST /api/proctoring/session/start` needs a real
`resultId` + `assessmentId`), which doesn't exist until Phase 2 (Assessments) is built. The
API calls are ready in `src/api/proctoring.js`, matching the exact payload shapes
`back-end/controllers/proctoringController.js` expects — they just have nothing live to call
yet. The other proctoring mechanisms (app background detection, screenshot flagging, audio
monitoring, the overlay/warning/pause UI) also aren't built — this covers FR-PROC-02/03 only.

**Known verification gaps** — this was written without access to an Android/iOS SDK, so it's
never actually been run:
- Every native API call (`Skia.Matrix`, `readPixels`, `capturePhotoToFile`, `InferenceSession`,
  `Tensor`, `expo-file-system`'s `File`/`Directory`/`Paths`) was checked against the *installed*
  package's TypeScript source in `node_modules`, not just docs — but a passing type signature
  isn't the same as a passing test run.
- If a real device build produces visibly wrong face crops during registration, the first place
  to look is `skiaImage.js`'s affine alignment (`alignFaceAsArcFaceTensor`) — render the aligned
  112×112 crop to an `<Image>` on screen and eyeball whether the face looks upright and centered
  before suspecting the ONNX model math itself.
- The anti-spoof model is intentionally not wired up — it's disabled in the web app too right
  now (the on-disk model file is invalid there), so mobile just stays at parity.

## Folder structure

```
src/
  api/            axios client + one file per backend resource (auth.js, colleges.js,
                   proctoring.js, ...)
  components/     shared UI (AppButton, AppTextInput, ScreenContainer, ComingSoon)
  context/        AuthContext — session state, token bootstrap/persist
  facepipeline/   on-device face verification — see above
  navigation/     AuthStack (pre-login) / AppStack (post-login: tabs + pushed full-screen
                  flows like the face-verification test) / RootNavigator
  screens/        one folder per module, matching Section 10 of the requirements doc
                  (auth, home, assessments, learning, career, community, profile, proctoring)
  theme.js        shared colors, matches the doc's palette
```

## Next steps (see the roadmap doc for the full phase breakdown)

- **Phase 2 — Assessments**: build the question renderer and timed session against
  `back-end/routes` for assessments/results, replacing `AssessmentsScreen`'s placeholder.
  This also unblocks actually wiring `src/api/proctoring.js` end-to-end.
- **Phase 3 — Proctoring, remaining pieces**: read Section 7 of the requirements doc (Web →
  Native Mechanism Mapping) — it covers what does *not* port directly (fullscreen enforcement,
  tab-switch, second-screen detection) and what to use instead. Face verification (above) is
  done; still needed: AppState-based background detection, heartbeat, evidence upload, and the
  overlay/warning/pause/held status UI.
- Everything else follows the same pattern: replace a `ComingSoon` placeholder screen with a
  real one, wired to the matching `back-end/routes/*` file.
