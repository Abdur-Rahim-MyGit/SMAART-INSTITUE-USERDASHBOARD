/**
 * Proctoring event vocabulary.
 *
 * These strings are validated against an enum on the server
 * (`back-end/models/ProctoringEvent.js`), which itself derives from
 * `RISK_WEIGHTS` in `back-end/config/proctoringPolicy.js`. Sending a value that
 * is not in that enum is rejected — so this file exists to make the allowed set
 * explicit rather than scattering string literals through the app.
 *
 * Only the events a phone can genuinely observe are listed. The web-only ones
 * (`tab_switch`, `fullscreen_exit`, `second_screen_detected`,
 * `multiple_exam_windows`, `virtual_camera_detected`) are deliberately absent:
 * there is no honest mobile signal for them, and emitting a guess would corrupt
 * a risk score that a human later reads as evidence.
 *
 * The mobile analogue of `tab_switch` is `minimize` — leaving the app.
 */
export const ProctoringEvent = {
  /** App left the foreground. The mobile equivalent of a tab switch. */
  MINIMIZE: 'minimize',
  /** No touch interaction for the idle window. */
  INACTIVITY: 'inactivity',

  /** Face pipeline: nobody in frame. */
  FACE_ABSENT: 'face_absent',
  /** Face pipeline: in frame but obscured. */
  FACE_COVERED: 'face_covered',
  /** Face pipeline: more than one person in frame. */
  MULTIPLE_FACES: 'multiple_faces',
  /** Face pipeline: the person in frame is not the registered candidate. */
  FACE_MISMATCH: 'face_mismatch',
  /** Head pose says the candidate is looking away from the screen. */
  GAZE_AWAY: 'gaze_away',

  /** Liveness prompt shown and not satisfied in time. */
  ATTENTION_CHECK_FAIL: 'attention_check_fail',

  /** Camera permission revoked or the stream died mid-attempt. */
  CAMERA_DISABLED: 'camera_disabled',
  /** Microphone unavailable when audio monitoring is enabled. */
  MICROPHONE_DISABLED: 'microphone_disabled',

  /** Informational, weight 0 — recorded so the timeline reads correctly. */
  FACE_REGISTERED: 'face_registered',
  IDENTITY_VERIFIED: 'identity_verified',
};

/**
 * Severity is advisory — the server scores from its own RISK_WEIGHTS table and
 * ignores anything the client claims. It is sent only so an administrator
 * reading the raw event log sees a sensible column.
 */
export const Severity = {
  [ProctoringEvent.MINIMIZE]: 'high',
  [ProctoringEvent.INACTIVITY]: 'low',
  [ProctoringEvent.FACE_ABSENT]: 'high',
  [ProctoringEvent.FACE_COVERED]: 'high',
  [ProctoringEvent.MULTIPLE_FACES]: 'critical',
  [ProctoringEvent.FACE_MISMATCH]: 'critical',
  [ProctoringEvent.GAZE_AWAY]: 'low',
  [ProctoringEvent.ATTENTION_CHECK_FAIL]: 'medium',
  [ProctoringEvent.CAMERA_DISABLED]: 'critical',
  [ProctoringEvent.MICROPHONE_DISABLED]: 'medium',
  [ProctoringEvent.FACE_REGISTERED]: 'info',
  [ProctoringEvent.IDENTITY_VERIFIED]: 'info',
};

/** Tiers the server can return, worst last. */
export const Tier = { OK: 'ok', WARN: 'warn', PAUSE: 'pause', HELD: 'held' };

export const TIER_RANK = { ok: 0, warn: 1, pause: 2, held: 3 };

/** Human copy for each tier. The server owns the decision; this is the wording. */
export const TIER_COPY = {
  warn: {
    title: 'Please stay in frame',
    body: 'Something was flagged during your attempt. Your assessment continues — this is a reminder, not a penalty.',
  },
  pause: {
    title: 'Assessment paused',
    body: 'Too many issues were recorded. Return to the exam conditions to continue. The clock is still running.',
  },
  held: {
    title: 'Assessment held for review',
    body: 'Your attempt has been held and sent for review. Your answers are saved. Someone will follow this up with you — you do not need to do anything now.',
  },
};
