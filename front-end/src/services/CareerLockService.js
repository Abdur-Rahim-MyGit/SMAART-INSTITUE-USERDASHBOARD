/**
 * CareerLockService.js
 * API wrapper for the Career Direction Locking System.
 * All calls go to /api/career-agent/direction-lock/*
 */

/**
 * Fetch the user's current career direction lock status.
 * @returns {Promise<Object>} lockStatus object
 */
export async function fetchLockStatus() {
  try {
    const res = await fetch('/api/career-agent/direction-lock/status', {
      credentials: 'include',
    });
    if (res.status === 401) return null; // not logged in
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[CareerLockService] fetchLockStatus error:', err);
    return null;
  }
}

/**
 * Mark the first-visit modal as shown so it never appears again.
 * @returns {Promise<void>}
 */
export async function markModalShown() {
  try {
    await fetch('/api/career-agent/direction-lock/mark-modal-shown', {
      method: 'PUT',
      credentials: 'include',
    });
  } catch (err) {
    console.error('[CareerLockService] markModalShown error:', err);
  }
}
