# SMAART Institute — Mobile App (React Native / Expo)

Companion mobile app to the `front-end/` web dashboard, talking to the **same** `back-end/`
API. Full requirements and phased roadmap: `../docs/04-React-Native-App-Requirements-and-Roadmap.docx`.

This is the **Phase 0/1 scaffold** from that roadmap: project setup, navigation shell, and a
real (not mocked) authentication flow — institution select → login → OTP → home — wired to
the actual backend routes in `back-end/routes/auth.js` and `back-end/routes/colleges.js`.
Everything else (Assessments, Learning, Career, Community tabs) is a placeholder screen ready
to be built out phase-by-phase.

## Stack

- Expo (SDK 57) + React Navigation (native-stack + bottom-tabs)
- `expo-secure-store` for the JWT (Keychain/Keystore-backed — see FR-AUTH-07 in the doc)
- `axios` for the API client, `context/AuthContext.js` for session state

## Getting started

1. Make sure the backend is running (`back-end/`, default port `5000`).
2. Copy the env file and point it at your backend:
   ```
   cp .env.example .env
   ```
   - iOS Simulator: `http://localhost:5000/api` works as-is.
   - Android Emulator: use `http://10.0.2.2:5000/api`.
   - Physical device (Expo Go or a dev client): use your computer's LAN IP,
     e.g. `http://192.168.1.23:5000/api` — find it with `ipconfig` on Windows.
     Your phone and computer need to be on the same network.
3. Install deps (already done if you just ran the scaffold): `npm install`
4. Start the app: `npm start`, then open it in Expo Go, an Android emulator, or an iOS
   simulator.

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

## Folder structure

```
src/
  api/            axios client + one file per backend resource (auth.js, colleges.js, ...)
  components/     shared UI (AppButton, AppTextInput, ScreenContainer, ComingSoon)
  context/        AuthContext — session state, token bootstrap/persist
  navigation/      AuthStack (pre-login) / MainTabs (post-login) / RootNavigator (switches
                   between them based on auth state)
  screens/        one folder per module, matching Section 10 of the requirements doc
                   (auth, home, assessments, learning, career, community, profile)
  theme.js        shared colors, matches the doc's palette
```

## Next steps (see the roadmap doc for the full phase breakdown)

- **Phase 2 — Assessments**: build the question renderer and timed session against
  `back-end/routes` for assessments/results, replacing `AssessmentsScreen`'s placeholder.
- **Phase 3 — Proctoring**: the highest-risk phase — read Section 7 of the requirements doc
  (Web → Native Mechanism Mapping) before starting; it covers what does *not* port directly
  (fullscreen enforcement, tab-switch, second-screen detection) and what to use instead.
- Everything else follows the same pattern: replace a `ComingSoon` placeholder screen with a
  real one, wired to the matching `back-end/routes/*` file.
