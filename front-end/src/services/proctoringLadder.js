/**
 * Duration-aware escalation ladder.
 *
 * Replaces the old streak-counter approach, which had a real flaw: a condition
 * fired a violation at its grace threshold and then RESET to zero and started
 * counting again. A candidate who stepped away once for 70 seconds collected
 * four separate warnings and was held — with no escalation they could see
 * coming and no chance to come back.
 *
 * Here, one continuous episode produces ONE escalating sequence. Each stage
 * fires at most once per episode; the episode ends only when the condition
 * actually clears.
 *
 * Three colours, and the rule is simple:
 *   green  — nothing happening
 *   amber  — needs attention, NOTHING on the candidate's record
 *   red    — recorded, counts against the warning budget
 *
 * Amber is where the honest majority lives and is never penalised. The colour
 * a candidate sees is a presentation layer only — the server still records
 * every red event at full fidelity, so softening the display never softens
 * enforcement.
 */

export const COLOUR = { GREEN: 'green', AMBER: 'amber', RED: 'red' };

/**
 * How long a condition must be absent before its episode really ends.
 *
 * Sized to outlast detector flicker (a frame or two at the 400 ms tick rate)
 * without outlasting a real change: step out of shot and face_absent still
 * starts within a couple of seconds of you actually leaving.
 */
const CLEAR_GRACE_MS = 2500;

/**
 * Stages are evaluated in order; `afterSeconds` is elapsed CONTINUOUS time in
 * the condition.
 *
 * Amber stages are mostly set to 0 — the candidate sees the coaching the instant
 * the condition is seen. That is free: amber never touches their record. What
 * takes time is the RED stage, because that is the one that becomes evidence,
 * and evidence should not be manufactured from a single noisy frame.
 *
 * Attention conditions (gaze, eyes, head-down) keep a delay even on amber:
 * glancing at the keyboard is normal, and a message that flashes up every time
 * someone looks away is noise the candidate learns to ignore. A stage with an `event` reports to the server (red); a stage
 * without one is purely local coaching (amber).
 */
export const LADDER = {
  face_absent: [
    { afterSeconds: 2, colour: COLOUR.AMBER, message: 'Center your face in the frame' },
    { afterSeconds: 20, colour: COLOUR.RED, event: 'face_absent',
      message: "We can't see you in the camera" },
    { afterSeconds: 60, colour: COLOUR.RED, event: 'student_absent_extended',
      message: 'Please return to your assessment' }
  ],
  face_covered: [
    { afterSeconds: 2, colour: COLOUR.AMBER, message: 'Move anything covering your face' },
    { afterSeconds: 30, colour: COLOUR.RED, event: 'face_covered',
      message: 'Your face is still partly hidden' }
  ],
  // A second person in frame is not ambiguous, so this does not need a long
  // window — only long enough to survive someone walking past behind.
  multiple_faces: [
    { afterSeconds: 0, colour: COLOUR.AMBER, message: 'Only you should be visible' },
    { afterSeconds: 6, colour: COLOUR.RED, event: 'multiple_faces',
      message: 'Someone else is in the camera' }
  ],
  face_mismatch: [
    { afterSeconds: 0, colour: COLOUR.AMBER, message: "Make sure it's you, clearly lit" },
    { afterSeconds: 8, colour: COLOUR.RED, event: 'face_mismatch',
      message: "The camera doesn't match your registered photo" }
  ],
  gaze_away: [
    { afterSeconds: 8, colour: COLOUR.AMBER, message: 'Keep your eyes on the screen' },
    { afterSeconds: 25, colour: COLOUR.RED, event: 'gaze_away',
      message: 'You have been looking away for a while' }
  ],
  eyes_closed: [
    { afterSeconds: 8, colour: COLOUR.AMBER, message: 'Keep your eyes on the screen' },
    { afterSeconds: 25, colour: COLOUR.RED, event: 'eyes_closed',
      message: 'Your eyes have been closed for a while' }
  ],
  fullscreen_exit: [
    { afterSeconds: 5, colour: COLOUR.AMBER, message: 'Return to fullscreen to continue' },
    { afterSeconds: 20, colour: COLOUR.RED, event: 'fullscreen_exit',
      message: 'Your assessment needs to stay in fullscreen' }
  ],
  // Head tilted down — the posture a phone in the lap forces. Given a long
  // window deliberately: people glance at keyboards, scratch pads and their
  // own hands constantly, and this must not punish that.
  looking_down: [
    { afterSeconds: 12, colour: COLOUR.AMBER, message: 'Keep your head up toward the screen' },
    { afterSeconds: 35, colour: COLOUR.RED, event: 'looking_down',
      message: 'You have been looking down for a while' }
  ],
  // Prohibited items detected by the object detector (YOLO).
  phone_detected: [
    { afterSeconds: 0, colour: COLOUR.AMBER, message: 'Please put your phone away' },
    { afterSeconds: 3, colour: COLOUR.RED, event: 'phone_detected',
      message: 'A phone was visible during the assessment' }
  ],
  book_detected: [
    { afterSeconds: 0, colour: COLOUR.AMBER, message: 'Notes and books are not allowed' },
    { afterSeconds: 4, colour: COLOUR.RED, event: 'book_detected',
      message: 'A book or notes were visible during the assessment' }
  ],
  // A second machine on the desk is the most innocent of the three and gets the
  // longest rope: it must be there a while before it counts.
  laptop_detected: [
    { afterSeconds: 0, colour: COLOUR.AMBER, message: 'Only this device should be in view' },
    { afterSeconds: 10, colour: COLOUR.RED, event: 'laptop_detected',
      message: 'Another computer or screen was visible during the assessment' }
  ]
};

/**
 * Create a tracker. Time is injected rather than read from the clock so the
 * ladder is deterministic and testable.
 *
 * @param {object} ladder - stage config, defaults to LADDER
 */
export const createLadder = (ladder = LADDER) => {
  /** type -> { startedAt, firedThrough } */
  const episodes = new Map();

  /**
   * Report that `type` is currently true at time `nowMs`.
   * @returns {{colour: string, message: string, elapsedSeconds: number, fire: string|null}}
   */
  const observe = (type, nowMs) => {
    const stages = ladder[type];
    if (!stages || !stages.length) {
      return { colour: COLOUR.GREEN, message: '', elapsedSeconds: 0, fire: null };
    }

    let episode = episodes.get(type);
    if (!episode) {
      episode = { startedAt: nowMs, firedThrough: -1, lastSeenAt: nowMs };
      episodes.set(type, episode);
    }
    // Every observation refreshes the episode's liveness. clear() reads this to
    // decide whether the condition is really gone or merely blinked.
    episode.lastSeenAt = nowMs;

    const elapsedSeconds = Math.max(0, (nowMs - episode.startedAt) / 1000);

    // Highest stage whose threshold has been passed.
    let reached = -1;
    for (let i = 0; i < stages.length; i++) {
      if (elapsedSeconds >= stages[i].afterSeconds) reached = i;
      else break;
    }

    if (reached < 0) {
      return { colour: COLOUR.GREEN, message: '', elapsedSeconds, fire: null };
    }

    const stage = stages[reached];

    // Fire each stage at most once per episode. If several thresholds were
    // crossed between observations (a stalled tab, a slow device), report the
    // furthest one rather than replaying every stage in turn.
    let fire = null;
    if (reached > episode.firedThrough) {
      episode.firedThrough = reached;
      fire = stage.event || null;
    }

    return { colour: stage.colour, message: stage.message, elapsedSeconds, fire };
  };

  /**
   * The condition appears to have cleared.
   *
   * Deliberately NOT immediate. Detection flickers: a second person's face is
   * missed for one frame as they turn, a phone leaves the crop for an instant,
   * a face is lost to motion blur. Deleting the episode on the first contrary
   * observation reset the timer every time that happened, so a condition that
   * needs to persist for twelve seconds could be genuinely present for minutes
   * and never once reach its threshold — the status pill showed the problem
   * while the warning count stayed at zero.
   *
   * The episode now survives brief gaps and only ends once the condition has
   * been absent for a continuous grace period.
   */
  const clear = (type, nowMs = Date.now()) => {
    const episode = episodes.get(type);
    if (!episode) return;
    if (nowMs - episode.lastSeenAt >= CLEAR_GRACE_MS) episodes.delete(type);
  };

  const clearAll = () => episodes.clear();

  /** Types currently mid-episode, worst (longest-running) first. */
  const active = () =>
    [...episodes.entries()]
      .sort((a, b) => a[1].startedAt - b[1].startedAt)
      .map(([type]) => type);

  return { observe, clear, clearAll, active };
};

export default createLadder;
