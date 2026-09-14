/**
 * Durable queue for assessment answers whose `saveAnswer` write failed.
 *
 * Why this exists: the player used to hold failed writes in an in-memory Map
 * only. If the app was killed — or the OS reclaimed it while backgrounded —
 * those answers were gone, and because the server only ever scores what it
 * actually received, the student's real answers were marked unanswered. That is
 * silent data loss on a graded assessment, so the queue has to outlive the
 * process.
 *
 * Stored as a small JSON file per attempt rather than in SecureStore: these are
 * the student's own answers, already guarded server-side by the per-attempt
 * assessment token, and SecureStore warns above ~2KB per value — a queue of a
 * dozen answers with their question text passes that easily.
 *
 * Every function here is best-effort. Storage failing must never break the
 * attempt in progress, so errors are swallowed and the in-memory queue remains
 * the source of truth for the current session.
 */
import { File, Paths } from 'expo-file-system';

const FILE_PREFIX = 'smaart_pending_answers_';

function fileFor(resultId) {
  return new File(Paths.document, `${FILE_PREFIX}${resultId}.json`);
}

/**
 * Answers queued for this attempt that never reached the server.
 * @returns {Promise<Record<string, { selectedValue: any, questionText?: string }>>}
 *   Empty object when there is nothing queued or the file cannot be read.
 */
export async function loadPendingAnswers(resultId) {
  if (!resultId) return {};
  try {
    const file = fileFor(resultId);
    if (!file.exists) return {};
    const parsed = JSON.parse(file.textSync());
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Mirrors the in-memory queue to disk. Writing an empty queue removes the file
 * rather than leaving an empty one behind.
 * @param {Map<string, object>|Record<string, object>} entries
 */
export async function savePendingAnswers(resultId, entries) {
  if (!resultId) return;
  try {
    const obj = entries instanceof Map ? Object.fromEntries(entries) : entries || {};
    const file = fileFor(resultId);
    if (Object.keys(obj).length === 0) {
      if (file.exists) file.delete();
      return;
    }
    if (!file.exists) file.create({ overwrite: true });
    file.write(JSON.stringify(obj));
  } catch {
    /* Never let a storage failure interrupt an attempt. */
  }
}

/** Called once the attempt is submitted — nothing is owed to the server. */
export async function clearPendingAnswers(resultId) {
  if (!resultId) return;
  try {
    const file = fileFor(resultId);
    if (file.exists) file.delete();
  } catch {
    /* ignore */
  }
}

/**
 * Whether a failed `saveAnswer` is worth retrying.
 *
 * Retrying a request the server has already rejected on its merits is what used
 * to trap a student on the last question forever, behind a "check your
 * connection" message that described the wrong problem. Only transport-level
 * and server-side failures can succeed on a second attempt.
 *
 * @param {{ status?: number }} err normalized error from api/client.js
 */
export function isRetryableSaveError(err) {
  const status = err?.status;
  if (!status) return true; // no response at all — offline, DNS, timeout
  if (status === 408 || status === 429) return true; // timeout / rate limit
  return status >= 500; // server-side fault
}
