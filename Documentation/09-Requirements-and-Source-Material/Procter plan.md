# SMAART AI Proctoring System — Full Implementation Plan

Build a comprehensive AI proctoring system for the SMAART assessment platform as specified in the **Assessment BuildSpec** and **AI Proctoring Blueprint** documents. This plan covers the complete proctoring lifecycle: identity verification, real-time behavioral monitoring, anomaly detection, automated enforcement, and admin review — integrated into the existing assessment flow.

---

## User Review Required

> [!IMPORTANT]
> **Camera/Webcam Access**: The proctoring blueprint requires webcam-based identity verification and periodic liveness checks. This requires the user to grant camera permissions in the browser. Should we implement a **hard gate** (assessment cannot start without camera) or a **soft gate** (assessment can proceed with reduced trust level / lower evidence tier if camera is denied)?

> [!IMPORTANT]
> **Full-Screen Enforcement**: The blueprint specifies mandatory full-screen mode. Should the system use the **Fullscreen API** to force fullscreen and count exits as violations, or should fullscreen be strongly recommended but not enforced? (Fullscreen API can be blocked by some browsers/OS settings.)

> [!WARNING]
> **AI Face Detection**: The blueprint mentions face detection for liveness checks and multiple-person detection. This requires either a **client-side ML model** (e.g., TensorFlow.js BlazeFace — runs in-browser, no server cost) or a **server-side API call** (more accurate, has latency + cost). Recommendation: Use **TensorFlow.js BlazeFace** for real-time client-side face detection (zero server cost, ~30fps).

> [!IMPORTANT]
> **Screenshot Capture**: The proctoring system can periodically capture webcam screenshots for review. This has **DPDPA (Digital Personal Data Protection Act 2023)** implications. Should we implement periodic captures stored server-side (with consent + retention policy), or only capture on violations?

## Open Questions

1. **Environment-specific Proctoring Levels**: The BuildSpec mentions "low-stakes practice runs unproctored" vs "high-stakes verified tier with full integrity." Should all current T1–T4/AIQ assessments be treated as high-stakes (full proctoring), or should T1 (Baseline) remain lighter?

2. **Browser Lockdown**: Should we implement a browser-lockdown mode (disable DevTools, disable extensions detection, detect virtual machines)? This is aggressive but standard for high-stakes proctoring.

3. **Admin Dashboard for Proctor Review**: Do you want a dedicated admin/teacher page to review proctoring events, flagged sessions, and webcam captures? Or should this be added to the existing admin tools?

---

## Proposed Changes

This is a large system with 7 major components. Changes are organized by component and ordered by dependency.

---

### Component 1 — Proctoring Data Models (Backend)

New MongoDB models to store proctoring session data, events, and face-check results.

#### [NEW] [ProctoringSession.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/models/ProctoringSession.js)

Schema for a proctoring session tied to an assessment attempt:

```
{
  sessionId, resultId (ref Result), userId (ref User), assessmentId (ref Assessment),
  status: 'active' | 'completed' | 'terminated' | 'flagged',
  
  // Identity Verification
  identityVerified: Boolean,
  identityVerifiedAt: Date,
  identityConfidence: Number, // 0-1 from face match
  referencePhotoUrl: String, // Initial face capture
  
  // Environment Check
  environmentCheck: {
    fullScreenGranted: Boolean,
    cameraGranted: Boolean,
    microphoneGranted: Boolean,
    browserInfo: String,
    screenResolution: String,
    networkType: String
  },
  
  // Aggregated Metrics
  totalViolations: Number,
  violationsByType: Map, // { tab_switch: 2, face_absent: 3, ... }
  totalFaceChecks: Number,
  faceCheckPassRate: Number, // 0-1
  riskScore: Number, // 0-100 composite score
  
  // Flags
  flags: [{ type: String, severity: 'low'|'medium'|'high'|'critical', timestamp: Date, details: String }],
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  totalActiveTime: Number, // seconds with face present
  totalAwayTime: Number // seconds face absent
}
```

#### [NEW] [ProctoringEvent.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/models/ProctoringEvent.js)

Granular event log — every violation, face check, screenshot, etc.:

```
{
  sessionId (ref ProctoringSession), userId, resultId,
  eventType: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'face_absent' | 
             'multiple_faces' | 'face_changed' | 'copy_paste' | 'right_click' | 
             'devtools_open' | 'screenshot_attempt' | 'inactivity' | 'browser_resize' |
             'periodic_check_pass' | 'periodic_check_fail' | 'identity_verified' |
             'phone_detected' | 'suspicious_object',
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical',
  timestamp: Date,
  details: String,
  screenshotUrl: String, // optional webcam capture at event time
  metadata: Map // flexible extra data (coordinates, confidence scores, etc.)
}
```

---

### Component 2 — Proctoring Backend API (Backend)

New routes, controllers, and middleware for the proctoring system.

#### [NEW] [proctoring.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/routes/proctoring.js)

New route file with these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/proctoring/session/start` | Create a proctoring session when assessment starts |
| `POST` | `/api/proctoring/session/:sessionId/verify-identity` | Save identity verification result (face photo + confidence) |
| `POST` | `/api/proctoring/session/:sessionId/environment-check` | Save environment check results (camera, fullscreen, etc.) |
| `POST` | `/api/proctoring/session/:sessionId/event` | Log a proctoring event (violation, face check, etc.) |
| `POST` | `/api/proctoring/session/:sessionId/batch-events` | Batch log multiple events (reduce HTTP overhead) |
| `GET`  | `/api/proctoring/session/:sessionId/status` | Get current session status + violation count |
| `POST` | `/api/proctoring/session/:sessionId/complete` | Mark session complete when assessment ends |
| `POST` | `/api/proctoring/session/:sessionId/terminate` | Force-terminate session (lockout) |
| `GET`  | `/api/proctoring/admin/sessions` | Admin: list all proctoring sessions with filters |
| `GET`  | `/api/proctoring/admin/session/:sessionId` | Admin: get full session details with events |
| `GET`  | `/api/proctoring/admin/flagged` | Admin: get all flagged/high-risk sessions |
| `POST` | `/api/proctoring/session/:sessionId/upload-snapshot` | Upload a webcam snapshot (multer) |

#### [NEW] [proctoringController.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/controllers/proctoringController.js)

Controller implementing all the above endpoints with:
- Risk score calculation (weighted formula based on violation types and frequencies)
- Auto-flag logic (risk score > 70 → flag for admin review)
- Auto-terminate logic (4+ critical violations → force-submit + lockout)
- Event batching support
- Snapshot storage (to `/uploads/proctoring/`)

#### [MODIFY] [server.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/server.js)

Add the new proctoring route:
```js
app.use('/api/proctoring', require('./routes/proctoring'));
```

---

### Component 3 — Client-Side Proctoring Engine (Frontend Core)

The main proctoring engine — a React hook and supporting utilities that run in the browser during assessments.

#### [NEW] [useProctoringEngine.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/hooks/useProctoringEngine.js)

**The central proctoring hook** replacing the simpler `useActivityRestrictions`. Features:

1. **Webcam Stream Management**
   - Request camera permission with graceful fallback
   - Maintain persistent `MediaStream` reference
   - Provide video ref for the small preview pip

2. **Face Detection (TensorFlow.js BlazeFace)**
   - Load BlazeFace model on mount
   - Run face detection every ~2 seconds
   - Detect: no face, multiple faces, face position anomalies
   - Track face presence ratio (active time vs away time)
   
3. **Fullscreen Enforcement**
   - Request fullscreen on assessment start
   - Detect fullscreen exit events → log violation
   
4. **Tab/Window Monitoring** (enhanced from existing)
   - `visibilitychange` — tab switch
   - `blur` — window focus lost
   - `resize` — suspicious window resizing (potential split screen)
   
5. **Input Blocking** (enhanced from existing)
   - Right-click prevention
   - Copy/Cut/Paste prevention
   - PrintScreen / screenshot key detection
   - DevTools detection (debugger timing, window size heuristics)
   
6. **Inactivity Detection**
   - 5-minute inactivity timeout (existing behavior)
   
7. **Periodic Liveness Checks**
   - Every 30 seconds: verify face is present
   - Every 5 minutes: "attention check" — user must click a button within 15 seconds
   
8. **Event Batching & Reporting**
   - Queue events locally
   - Flush to server every 10 seconds or on critical events
   - Fallback: store in localStorage if network fails
   
9. **Violation Escalation**
   - Count violations by severity
   - 3 warnings → show warning modal
   - 4th critical violation → auto-submit + lockout
   
10. **State Exposure**
    - `warningsCount`, `maxWarnings`, `riskScore`
    - `isCameraActive`, `isFaceDetected`, `faceCount`
    - `isFullScreen`, `isWarningVisible`, `lastViolationType`
    - `proctoringSessionId`
    - `acknowledgeWarning()`, `requestFullscreen()`

#### [NEW] [faceDetectionService.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/services/faceDetectionService.js)

Encapsulates TensorFlow.js BlazeFace model loading and face detection:
- Lazy model loading (only loads when proctoring starts)
- `detectFaces(videoElement)` → returns `{ faceCount, faces: [{ topLeft, bottomRight, probability }], isFacePresent }`
- Handles model loading errors gracefully
- Memory cleanup on unmount

#### [NEW] [proctoringApi.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/services/proctoringApi.js)

API service for proctoring endpoints:
- `startSession(resultId, assessmentId)`
- `verifyIdentity(sessionId, photoData, confidence)`
- `saveEnvironmentCheck(sessionId, checkData)`
- `logEvent(sessionId, event)`
- `batchLogEvents(sessionId, events)`
- `getSessionStatus(sessionId)`
- `completeSession(sessionId)`
- `uploadSnapshot(sessionId, imageBlob)`

---

### Component 4 — Proctoring UI Components (Frontend)

The visual components for the proctoring experience.

#### [NEW] [ProctoringSetup.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/proctoring/ProctoringSetup.jsx)

**Pre-assessment proctoring setup wizard** — a multi-step modal shown before the assessment starts:

1. **Step 1 — System Check**: Camera permission, browser compatibility, network speed
2. **Step 2 — Environment Setup**: Fullscreen mode, lighting check
3. **Step 3 — Identity Verification**: Capture face photo, compare with profile photo (or store as reference)
4. **Step 4 — Rules & Consent**: Display proctoring rules, DPDPA consent checkbox
5. **Step 5 — Ready**: Green light to start

Premium, dark-themed UI matching the existing SMAART design language (navy blues, sharp borders, brand colors).

#### [NEW] [ProctoringOverlay.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/proctoring/ProctoringOverlay.jsx)

**Always-visible proctoring status overlay** during the assessment:

- **Camera PIP**: Small webcam preview (bottom-right corner, ~120x90px)
- **Status Indicators**: Face detection status (green dot / red dot), recording indicator, warning count
- **Risk Meter**: Visual severity indicator (green → yellow → orange → red)
- **Fullscreen reminder**: Alert bar if user exits fullscreen
- Collapsible/minimizable but cannot be fully hidden

#### [NEW] [ProctoringWarningModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/proctoring/ProctoringWarningModal.jsx)

**Enhanced warning modal** replacing the existing `ActivityWarningModal`:

- Supports all new violation types (face absent, multiple faces, fullscreen exit, etc.)
- Shows a webcam snapshot at the time of violation
- Displays escalation level ("Warning 2 of 3 — next violation triggers disqualification")
- Requires explicit acknowledgment
- Timer: must acknowledge within 30 seconds or auto-escalate

#### [NEW] [AttentionCheck.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/proctoring/AttentionCheck.jsx)

**Periodic attention/liveness verification popup**:
- Random "Click to confirm you're here" button positioned at a random location
- Must respond within 15 seconds
- Shows a brief animation to attract attention
- Failure counts as a violation

#### [MODIFY] [ActivityWarningModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/ActivityWarningModal.jsx)

Deprecate in favor of the new `ProctoringWarningModal`. Keep as a re-export for backward compatibility if used elsewhere.

---

### Component 5 — Integration into Assessment Flow (Frontend)

Wire the proctoring system into the existing assessment taking experience.

#### [MODIFY] [BaseLineTest.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/BaseLineTest.jsx)

Major changes:
1. **Replace** `useActivityRestrictions` with `useProctoringEngine`
2. **Add proctoring setup phase**: Before showing questions, render `<ProctoringSetup>`. Only proceed to questions after setup passes.
3. **Add proctoring overlay**: Render `<ProctoringOverlay>` during the test (camera pip, status indicators)
4. **Add attention checks**: Render `<AttentionCheck>` on periodic triggers from the proctoring engine
5. **Enhanced auto-submit**: On lockout, pass proctoring session data to the submit API
6. **Remove** duplicate inline proctoring logic (right-click, copy/paste handlers — these move into `useProctoringEngine`)

#### [MODIFY] [AssessmentsDashboard.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/AssessmentsDashboard.jsx)

Update the pre-assessment gate modal:
1. Add proctoring system requirements notice (camera, fullscreen)
2. Add system compatibility check button
3. Show enhanced integrity warnings mentioning face detection and attention checks

---

### Component 6 — Proctoring Security Enhancements (Backend)

Hardening the existing security system.

#### [MODIFY] [securityController.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/controllers/securityController.js)

1. **Link violations to proctoring session**: When logging a violation, also update the corresponding `ProctoringSession` counters
2. **Enhanced lockout**: On lockout, also terminate the proctoring session and flag it for admin review
3. **Risk score integration**: Calculate risk score from combined violation history

#### [MODIFY] [UserActivityLog.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/models/UserActivityLog.js)

Add new fields:
- `proctoringSessionId` — link to the proctoring session
- `severity` — event severity level
- `screenshotUrl` — optional webcam capture URL
- Expand `eventType` enum to include all new proctoring event types

---

### Component 7 — Dependencies & Configuration

#### [MODIFY] [package.json](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/package.json)

Add frontend dependencies:
```json
"@tensorflow/tfjs": "^4.x",
"@tensorflow-models/blazeface": "^0.1.x"
```

> [!NOTE]
> TensorFlow.js BlazeFace runs entirely in the browser. It's ~1.5MB for the model, loaded lazily only when proctoring starts. No server-side GPU or API cost. Runs at ~30fps on modern hardware.

#### [MODIFY] [back-end/package.json](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/package.json)

Add backend dependency (if not present):
```json
"sharp": "^0.33.x"  // For processing/resizing webcam snapshots before storage
```

---

## Verification Plan

### Automated Tests

```bash
# Backend: Run the test suite after adding new models/routes
cd back-end && npm test

# Frontend: Build check to ensure no compilation errors
cd front-end && npm run build
```

### Manual Verification

1. **Proctoring Setup Flow**: Start an assessment → verify camera permission request → face capture → environment checks → fullscreen mode
2. **During-Assessment Monitoring**: Verify camera PIP appears → face detection indicator works → tab switching triggers warning → fullscreen exit triggers warning
3. **Violation Escalation**: Simulate 3 violations → verify warnings → simulate 4th violation → verify auto-submit + lockout
4. **Attention Checks**: Wait for periodic attention check → verify it appears → verify timeout counts as violation
5. **Admin Review**: Check proctoring session data is stored in MongoDB → events are logged with correct types
6. **Edge Cases**: Deny camera permission → verify graceful fallback, lose network mid-test → verify events are batched locally, browser crash → verify session recovery

---

## Implementation Order

| Phase | Component | Effort | Description |
|-------|-----------|--------|-------------|
| 1 | Models (Component 1) | Small | Data layer — no UI or API changes |
| 2 | Backend API (Component 2) | Medium | Routes + controller + server.js registration |
| 3 | Dependencies (Component 7) | Small | Install TensorFlow.js and related packages |
| 4 | Face Detection Service (Component 3 partial) | Medium | Face detection service |
| 5 | Proctoring API Service (Component 3 partial) | Small | API client |
| 6 | Proctoring Engine Hook (Component 3 core) | Large | The central hook — most complex piece |
| 7 | UI Components (Component 4) | Large | Setup wizard, overlay, warning modal, attention check |
| 8 | Integration (Component 5) | Medium | Wire into BaseLineTest and AssessmentsDashboard |
| 9 | Security Hardening (Component 6) | Small | Enhance existing security controller |
