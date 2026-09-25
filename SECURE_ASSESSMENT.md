# Secure assessments (Safe Exam Browser + screen capture)

A secure assessment can only be taken inside **Safe Exam Browser (SEB)** with the
student's camera, microphone and **entire screen** shared. SEB is free and open
source (ETH Zurich); nothing has to be registered with them.

## How it works

1. **Launch page** (`/assessment/:stage/launch`, normal browser). The student
   installs SEB once, then presses *Open in Safe Exam Browser*. The server mints
   a one-time launch token and returns a `sebs://` link. SEB downloads the
   `.seb` file from `GET /api/assessments/:id/seb-config?lt=TOKEN`.
2. **Enter page** (`/secure/enter?lt=TOKEN`, inside SEB). The app swaps the
   token for a signed-in session (`POST /api/assessments/secure/exchange`) and
   opens the test. The swap is only accepted when the request proves it came
   from SEB (see *Verification*).
3. **Setup wizard** gains an *Entire screen* row. A window or tab share is
   refused. Inside SEB the browser-fullscreen step is satisfied automatically.
4. **During the test** a JPEG of the screen is uploaded every
   `screenshotIntervalSec` seconds, plus a frame and an 8-second WebM clip
   whenever the proctoring engine records a violation. If the share stops, the
   paper is blocked and the clock paused until the student shares again; the
   interruption is recorded as `screen_share_stopped`.
5. **Submit** shows the report; *Finish and close Safe Exam Browser* navigates
   to `/secure/exit`, SEB's quit URL, so SEB closes.

### Verification

SEB sends `X-SafeExamBrowser-ConfigKeyHash = SHA-256(url + configKey)` with every
request. `middleware/sebGuard.js` recomputes that hash for the request URL using
the Config Keys of the student's recent launches (`SecureLaunchToken`). It guards
attempt start, answer, submit and proctoring-session start. A second header,
`X-SEB-Config-Key`, carries the key read from SEB's JavaScript API and is
accepted as a fallback.

Non-secure assessments are untouched: the guard passes through when
`assessment.secure.enabled` is false or the student is not on `pilotUserIds`.

## Configuration

| Env | Purpose | Default |
|---|---|---|
| `SECURE_PUBLIC_URL` | Public origin of the front end (used in the `.seb` startURL/quitURL) | `FRONTEND_URL`, then the request origin |
| `SECURE_API_URL` | Public origin of the API (where SEB downloads the `.seb`) | `BACKEND_URL`, then the request origin |
| `SEB_KEY_ENFORCEMENT` | `strict` (403 on a failed check) or `log` (warn only, for the first pilot run) | `strict` |
| `SECURE_MEDIA_RETENTION_DAYS` | Nightly purge of screen frames/clips | `90` |

Per-assessment settings live in `Assessment.secure`:
`enabled`, `requireSeb`, `requireScreenCapture`, `screenshotIntervalSec` (10–300),
`retentionDays`, `quitPassword` (never returned to clients), `allowedUrls`,
`pilotUserIds` (empty = everyone).

## Pilot: Secure Pilot (stage `SP`, code `ASM00009`)

A copy of the T2 paper stored under its own stage. It never touches progression,
PLVI or certificates, so the pilot cannot affect a real record.

```bash
cd back-end
# create/refresh the pilot and allow two accounts to see it
node scripts/createSecurePilot.js --emails you@college.edu,tester@college.edu --quit-password 2468

# after the pilot passes: switch the real T2 to secure mode for everyone
node scripts/createSecurePilot.js --enable-code ASM00002
# ...or for a few accounts first
node scripts/createSecurePilot.js --enable-code ASM00002 --emails a@x.edu,b@x.edu
# switch it off again
node scripts/createSecurePilot.js --disable-code ASM00002
```

### Pilot checklist (Windows 10/11 and macOS)

1. Install SEB 3.x from safeexambrowser.org on the test machine.
2. Sign in as a pilot account, open *Assessments*: the **Secure Pilot** card
   shows a *Secure* chip. Start it; the launch page opens.
3. Press *Open in Safe Exam Browser*. SEB should open within a few seconds and
   land on *Signing you in*. If SEB does not open, use *Download launch file*
   and double-click the `.seb`.
4. If the enter page shows **SEB_KEY_MISMATCH** or **SEB_REQUIRED**, the Config
   Key check failed. Compare the key on the launch page (`configKey` in the
   launch response) with the key the SEB Config Tool shows for the downloaded
   `.seb`. To keep testing meanwhile set `SEB_KEY_ENFORCEMENT=log` on the API.
5. Setup wizard: camera, microphone and *Entire screen* must all read *Allowed*.
   Share a single window on purpose: it must be refused.
6. During the test press *Stop sharing*: the paper must block, the clock must
   pause, and *Share entire screen again* must resume it.
7. Submit, then press *Finish and close Safe Exam Browser*. SEB must quit.
8. In the admin console open the session: periodic frames and the clip from
   step 6 must be listed under evidence.

## Admin repo: review API

All admin endpoints require an `admin` role.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/proctoring/admin/sessions?status=` | Existing list; `session.secure` now carries mode, SEB verification, capture counters, retention |
| GET | `/api/proctoring/admin/session/:id` | Existing detail; events with `mediaUrl`/`mediaType` are screen evidence |
| GET | `/api/proctoring/admin/session/:id/evidence` | Only the evidence events plus storage stats |
| GET | `/api/proctoring/screen/:sessionId/:filename` | The frame or clip itself (`mediaUrl` points here) |
| POST | `/api/proctoring/admin/session/:id/decision` | `{ decision: "clear" \| "uphold", note }`. *clear* releases the session and re-grades a held attempt through the normal submit path (stage result, badges, certificate). *uphold* marks it invalidated. |

New proctoring event types: `seb_launched`, `screen_share_started`,
`screen_share_resumed`, `screen_capture`, `screen_clip` (info) and
`screen_share_stopped` (25), `screen_share_wrong_surface` (20), `seb_missing`
(40) (risk weights).

## Performance inside SEB

SEB's browser often runs without hardware acceleration, so the app switches
to a lite graphics mode there (`html.gfx-lite`, see
`front-end/src/utils/graphicsProfile.js`): no canvas background, no backdrop
blur or animated glows, slower face-scan cadence in the setup wizard, MediaPipe
on its CPU delegate when the WebGL renderer is a software rasteriser, and
720p/5 fps screen capture with VP8 clips. The `.seb` file also uses kiosk mode
1 ("Disable Explorer Shell"), which keeps hardware acceleration where the
default "Create new desktop" mode loses it.

## Storage

Captures are written by `services/secureMediaStore.js` to
`back-end/uploads/proctoring/screens/<sessionId>/`, never served statically, and
deleted by the nightly job after the retention window. Moving to object storage
means replacing the functions in that one file.
