/**
 * answerQueue — offline answer buffering for a live assessment (FR-ASMT-04).
 *
 * THE PROBLEM
 * -----------
 * `saveAnswer` used to be fire-and-forget: on failure the player logged and
 * moved on, trusting the final submit to re-send everything. That trust is
 * misplaced. `submitAssessment` scores what the *server* has stored; it does
 * not carry the answer set in its body. So a selection lost to a dropped
 * request was silently lost for good — on campus Wi-Fi, in an exam, with no
 * indication to the student.
 *
 * THE FIX
 * -------
 * Every selection goes through this queue. A failed write stays queued and is
 * retried with backoff until it lands, and `flush()` is awaited before submit
 * so an attempt is never scored against a partial answer set.
 *
 * WHY IN MEMORY, NOT ON DISK
 * --------------------------
 * The SRS says answers are "cached locally and synced automatically once
 * connectivity returns". This queue satisfies that for the failure it is
 * actually protecting against — a network drop while the app is running.
 *
 * It deliberately does NOT persist across process death, for two reasons:
 *
 *   1. That case is already covered. `startAssessment` replays the server's
 *      stored `responses` on resume (FR-ASMT-03), so a killed app comes back
 *      to exactly the answers the server holds. A disk queue would only add a
 *      second, competing source of truth for the same data.
 *   2. `expo-secure-store` (the app's only storage wrapper) caps values at
 *      ~2 KB on iOS, which a full answer set can exceed, and the SDK 57
 *      `expo-file-system` read/write surface could not be verified in this
 *      environment. Writing an unverified filesystem path into an exam
 *      hot-path is a worse trade than the gap it closes.
 *
 * If persistence across process death is wanted later, the seam is `enqueue()`
 * — nothing else has to change.
 */

const MAX_ATTEMPTS = 6;
/** 1s, 2s, 4s, 8s, 16s, 30s — capped so a long outage doesn't stall forever. */
const backoffMs = (attempt) => Math.min(30_000, 1000 * 2 ** attempt);

export function createAnswerQueue({ send, onPendingChange }) {
  /** @type {Map<string, {payload: any, attempts: number}>} */
  const pending = new Map();
  let draining = false;
  let timer = null;
  let disposed = false;

  const notify = () => onPendingChange?.(pending.size);

  function schedule(delay) {
    if (disposed || timer) return;
    timer = setTimeout(() => {
      timer = null;
      drain();
    }, delay);
  }

  async function drain() {
    if (draining || disposed || pending.size === 0) return;
    draining = true;

    try {
      // Snapshot the keys: `pending` is mutated while we iterate, and a newer
      // answer for the same question may replace an entry mid-flight.
      for (const questionId of [...pending.keys()]) {
        if (disposed) return;
        const entry = pending.get(questionId);
        if (!entry) continue;

        try {
          await send(entry.payload);
          // Only clear if this exact payload is still the queued one. A newer
          // selection for the same question must not be dropped by an
          // in-flight older write completing late.
          if (pending.get(questionId) === entry) {
            pending.delete(questionId);
            notify();
          }
        } catch {
          entry.attempts += 1;
          if (entry.attempts >= MAX_ATTEMPTS) {
            // Keep it queued rather than discarding — `flush()` before submit
            // gets one more chance, and the student is warned if it still fails.
            entry.attempts = MAX_ATTEMPTS;
          }
          schedule(backoffMs(entry.attempts));
          return; // one failure means the network is down; stop hammering it
        }
      }
    } finally {
      draining = false;
    }
  }

  return {
    /**
     * Queue an answer. Replaces any earlier unsent answer for the same
     * question — only the student's latest selection matters.
     */
    enqueue(questionId, payload) {
      if (disposed) return;
      pending.set(questionId, { payload, attempts: 0 });
      notify();
      drain();
    },

    /**
     * Drain everything before submitting.
     * @returns {Promise<{ ok: boolean, unsent: number }>}
     */
    async flush() {
      // Reset attempt counters so a queue that backed off gets a clean run.
      for (const entry of pending.values()) entry.attempts = 0;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      await drain();
      return { ok: pending.size === 0, unsent: pending.size };
    },

    get pendingCount() {
      return pending.size;
    },

    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      pending.clear();
    },
  };
}
