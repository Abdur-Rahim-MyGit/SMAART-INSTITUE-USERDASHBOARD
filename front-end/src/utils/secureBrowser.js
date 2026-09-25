/**
 * Safe Exam Browser (SEB) helpers shared by the launch page, the enter page,
 * the setup wizard and the exam itself.
 */

/** SEB appends "SEB/x.y.z" to its user agent on every platform. */
export const isSebBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  if (/\bSEB\/\d/i.test(navigator.userAgent || '')) return true;
  if (typeof window !== 'undefined' && window.SafeExamBrowser) return true;
  // The enter page only ever runs inside SEB (the server refuses the token
  // exchange otherwise), so a stored secure session is proof enough even when
  // this SEB build does not stamp its user agent.
  try {
    const raw = sessionStorage.getItem('secure_session');
    if (raw && JSON.parse(raw)?.sebVerified) return true;
  } catch { /* private mode */ }
  return false;
};

/**
 * The Config Key SEB exposes through its JavaScript API (SEB 3.x). Sent as a
 * fallback header on every API call so the server can verify the session even
 * where SEB does not attach its own hash header to XHR requests.
 */
export const getSebConfigKey = () => {
  try {
    const key = window?.SafeExamBrowser?.security?.configKey;
    return typeof key === 'string' && key.length >= 32 ? key : '';
  } catch {
    return '';
  }
};

/** Ask SEB to refresh its keys (needed once per page load on some versions). */
export const refreshSebKeys = () => new Promise((resolve) => {
  try {
    const api = window?.SafeExamBrowser?.security;
    if (api && typeof api.updateKeys === 'function') {
      api.updateKeys(() => resolve(getSebConfigKey()));
      setTimeout(() => resolve(getSebConfigKey()), 1500);
      return;
    }
  } catch { /* no API */ }
  resolve(getSebConfigKey());
});

export const sebHeaders = () => {
  const key = getSebConfigKey();
  return key ? { 'X-SEB-Config-Key': key } : {};
};

/**
 * Coarse device check for the launch page. SEB runs on Windows 10/11 and
 * macOS; everything else cannot take a secure assessment.
 */
export const detectPlatform = () => {
  if (typeof navigator === 'undefined') return { key: 'unknown', label: 'Unknown device', supported: false };
  const ua = navigator.userAgent || '';
  const uaPlatform = navigator.userAgentData?.platform || navigator.platform || '';

  if (/Android/i.test(ua)) return { key: 'android', label: 'Android', supported: false };
  if (/iPhone|iPod/i.test(ua)) return { key: 'ios', label: 'iPhone', supported: false };
  if (/iPad/i.test(ua) || (/Mac/i.test(uaPlatform) && navigator.maxTouchPoints > 1)) {
    return { key: 'ipad', label: 'iPad', supported: false };
  }
  if (/CrOS/i.test(ua)) return { key: 'chromeos', label: 'Chromebook', supported: false };
  if (/Windows NT 10\.0/i.test(ua) || /Windows/i.test(uaPlatform)) {
    // Windows 11 also reports NT 10.0; anything older is 7/8 and unsupported.
    const old = /Windows NT (5\.|6\.[0-3])/i.test(ua);
    return old
      ? { key: 'windows_old', label: 'Windows 7 / 8', supported: false }
      : { key: 'windows', label: 'Windows 10 / 11', supported: true };
  }
  if (/Mac/i.test(uaPlatform) || /Macintosh/i.test(ua)) return { key: 'mac', label: 'macOS', supported: true };
  if (/Linux/i.test(uaPlatform) || /Linux/i.test(ua)) return { key: 'linux', label: 'Linux', supported: false };
  return { key: 'unknown', label: uaPlatform || 'Unknown device', supported: false };
};

export const SEB_DOWNLOADS = {
  windows: 'https://safeexambrowser.org/download_en.html#Windows',
  mac: 'https://safeexambrowser.org/download_en.html#MacOSX',
  home: 'https://safeexambrowser.org/download_en.html'
};

/** Stage keys → assessment codes for the secure flow (mirrors the backend CSV). */
export const SECURE_STAGE_CODES = {
  T1: 'ASM00001',
  T2: 'ASM00002',
  T3: 'ASM00003',
  T4: 'ASM00004',
  SP: 'ASM00009'
};

export const STAGE_TITLES = {
  T1: 'Base Line Test',
  T2: 'Capacity Test',
  T3: 'Capability Test',
  T4: 'Leadership Test',
  SP: 'Secure Pilot'
};

/** Session flag set by the enter page so the exam knows it arrived through SEB. */
const SEB_SESSION_KEY = 'secure_session';

export const rememberSecureSession = (info) => {
  try { sessionStorage.setItem(SEB_SESSION_KEY, JSON.stringify({ ...info, at: Date.now() })); } catch { /* private mode */ }
};

export const readSecureSession = () => {
  try {
    const raw = sessionStorage.getItem(SEB_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSecureSession = () => {
  try { sessionStorage.removeItem(SEB_SESSION_KEY); } catch { /* ignore */ }
};
