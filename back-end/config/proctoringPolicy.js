/**
 * Single source of truth for proctoring policy.
 *
 * The live engine (proctoringController), the submit gate
 * (services/proctoringGate) and the analytics pass all read these, so the
 * number that flags a session can never drift from the number that decides
 * its outcome.
 */

/**
 * FLAG-ONLY MODE — the assessment is never interrupted.
 *
 * The previous model blocked a candidate mid-exam after 3 warnings. That
 * punished the honest majority for a swivelling chair, and it judged isolated
 * seconds instead of the whole session: twelve short glances away read very
 * differently from one four-minute absence, and only an end-of-exam view can
 * tell them apart.
 *
 * Now flags accumulate silently, the candidate finishes uninterrupted, and the
 * server decides once at submit. Set false to restore mid-exam holds.
 */
const FLAG_ONLY_MODE = false;

module.exports = {
  FLAG_ONLY_MODE,

  // Recorded warnings before the attempt is marked unverified. Only enforced
  // mid-exam when FLAG_ONLY_MODE is false; otherwise it is evaluated at submit.
  MAX_WARNINGS: 10,

  // Risk score at/above which an attempt cannot be verified.
  RISK_FLAG_THRESHOLD: 60,

  // Risk score at/above which the session is held immediately, mid-exam.
  // Ignored entirely in FLAG_ONLY_MODE.
  RISK_LOCK_THRESHOLD: 90,

  // How many times a candidate may re-sit after an unverified attempt before
  // it stops being self-service and becomes a support ticket. Each retry draws
  // a DIFFERENT question set (see utils/questionShuffler), so retries never
  // hand the same paper back.
  MAX_RETRY_ATTEMPTS: 3,

  // Client pings this often; a gap beyond the tolerance is recorded as a
  // violation the candidate cannot suppress (you cannot forge an absence).
  HEARTBEAT_INTERVAL_MS: 10 * 1000,
  HEARTBEAT_GAP_MS: 30 * 1000,

  /**
   * Risk weight per event type.
   *
   * Info events are deliberately 0 — look up with `?? `, never `|| `, or the
   * zero silently becomes the default.
   */
  RISK_WEIGHTS: {
    // Window / focus
    tab_switch: 15,
    minimize: 15,
    fullscreen_exit: 20,
    inactivity: 10,

    // Presence
    face_absent: 15,
    student_absent_extended: 40, // Away a full minute — flags on its own
    face_covered: 10,
    multiple_faces: 25,
    face_mismatch: 30,

    // Attention
    gaze_away: 10,
    eyes_closed: 15,
    looking_down: 20, // Best available proxy for reading a phone in the lap
    attention_check_fail: 35,

    // Audio
    voice_detected: 25,
    prolonged_silence: 10,

    // Prohibited items in frame (YOLO object detection)
    phone_detected: 35,
    book_detected: 30,

    // Device tampering — camera/mic turned off mid-exam
    microphone_disabled: 20,
    camera_disabled: 30,

    // Environment — strong signals, hard to explain away
    second_screen_detected: 35,
    virtual_camera_detected: 45,
    multiple_exam_windows: 30,

    // Server-derived — the candidate cannot suppress these
    proctoring_offline: 30,
    timing_anomaly: 30,

    // Info only
    face_registered: 0,
    identity_verified: 0,
    heartbeat: 0
  },

  /**
   * How raw events roll up for the candidate's end-of-exam summary.
   *
   * Deliberately coarse. Telling someone "you triggered gaze_away 8 times at a
   * 25-second threshold" is a tutorial in how to evade the detector next
   * attempt. Categories and counts are enough to be fair and to explain the
   * decision, without publishing the thresholds.
   *
   * `minor: true` categories are never shown — only what actually mattered.
   */
  FLAG_CATEGORIES: [
    {
      key: 'identity',
      label: 'Your identity could not be confirmed',
      events: ['face_mismatch', 'virtual_camera_detected']
    },
    {
      key: 'other_person',
      label: 'Another person was visible',
      events: ['multiple_faces', 'voice_detected']
    },
    {
      key: 'away',
      label: 'You were away from the camera',
      events: ['face_absent', 'student_absent_extended', 'face_covered']
    },
    {
      key: 'left_window',
      label: 'You left the assessment window',
      events: ['tab_switch', 'minimize', 'fullscreen_exit', 'multiple_exam_windows']
    },
    {
      key: 'second_screen',
      label: 'A second screen was detected',
      events: ['second_screen_detected']
    },
    {
      key: 'prohibited_item',
      label: 'A prohibited item was visible',
      events: ['phone_detected', 'book_detected']
    },
    {
      key: 'device_disabled',
      label: 'Your camera or microphone was disabled',
      events: ['camera_disabled', 'microphone_disabled']
    },
    {
      key: 'attention',
      label: 'You looked away from the screen',
      events: ['gaze_away', 'eyes_closed', 'looking_down', 'attention_check_fail']
    },
    {
      key: 'timing',
      label: 'Some answers had unusual timing',
      events: ['timing_anomaly']
    },
    {
      key: 'connection',
      label: 'Monitoring was interrupted',
      events: ['proctoring_offline']
    },
    {
      key: 'inactive',
      label: 'Long periods of inactivity',
      events: ['inactivity', 'prolonged_silence'],
      minor: true
    }
  ]
};
