/**
 * FR-AUTH-11 — Device fingerprinting.
 *
 * The backend already records a device fingerprint per auth event
 * (`back-end/middleware/deviceFingerprint.js` + the `logAuthEvent` helper at the
 * top of `routes/auth.js`), but it derives everything from the `User-Agent`
 * header, whose browser/OS sniffing produces "Browser / Unknown OS / Desktop"
 * for a bare React Native request. Two things fix that:
 *
 *  1. Send a descriptive `User-Agent` so the existing server-side parser
 *     resolves the OS and Mobile/Desktop correctly with no backend change.
 *  2. Send a stable per-install `X-Device-Id` so the same physical device is
 *     recognisable across logins even when the IP changes.
 *
 * The ID identifies an install; it is not a secret and carries no authority on
 * its own, so a non-cryptographic UUID is sufficient here. It lives in secure
 * storage purely so it survives cache clears and isn't world-readable.
 *
 * `expo-device` is loaded the same guarded way as `expo-local-authentication`
 * in ./biometrics.js. Everything here is descriptive metadata for an audit log —
 * losing it must degrade the header, never crash the app at import time. A
 * top-level `import` would do exactly that on any runtime whose native binary
 * predates the dependency (a dev-client build made before it was added), taking
 * the whole app down at startup over a User-Agent string.
 */
import { Platform } from 'react-native';
import * as storage from './storage';

let Device = null;
try {
  // eslint-disable-next-line global-require
  Device = require('expo-device');
} catch {
  Device = null;
}

export const DEVICE_ID_KEY = 'smaart_device_id';

let cachedDeviceId = null;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable identifier for this install. Generated once, then reused forever. */
export async function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await storage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4();
      await storage.setItem(DEVICE_ID_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  } catch {
    // Never let fingerprinting break a login — fall back to an ephemeral ID.
    cachedDeviceId = cachedDeviceId || uuidv4();
    return cachedDeviceId;
  }
}

/**
 * A User-Agent the backend's existing sniffer can actually read.
 * `routes/auth.js` looks for the literal substrings 'Android' / 'iPhone' /
 * 'Mac OS X' for the OS, and /Mobi|Android|iPhone|iPad/i for the form factor —
 * so the OS token below is deliberately spelled the way that parser expects.
 */
export function getUserAgent() {
  const appVersion = '1.0.0';
  const osToken =
    Platform.OS === 'android'
      ? `Android ${Device?.osVersion || ''}`.trim()
      : Platform.OS === 'ios'
        ? `iPhone; CPU iPhone OS ${String(Device?.osVersion || '').replace(/\./g, '_')} like Mac OS X`
        : `${Device?.osName || 'Unknown'} ${Device?.osVersion || ''}`.trim();

  const model =
    [Device?.manufacturer, Device?.modelName].filter(Boolean).join(' ') || 'Unknown Device';

  return `SMAARTInstitute/${appVersion} (${osToken}; ${model}) Mobile`;
}

/** Human-readable device label, e.g. "Samsung SM-G991B · Android 14". */
export function getDeviceLabel() {
  const model = [Device?.manufacturer, Device?.modelName].filter(Boolean).join(' ');
  const os = [Device?.osName, Device?.osVersion].filter(Boolean).join(' ');
  return [model, os].filter(Boolean).join(' · ') || 'Unknown device';
}

/** Headers merged onto every request by the axios interceptor. */
export async function getDeviceHeaders() {
  return {
    'X-Device-Id': await getDeviceId(),
    'X-Device-Platform': Platform.OS,
    'X-Device-Model':
      [Device?.manufacturer, Device?.modelName].filter(Boolean).join(' ') || 'unknown',
    'X-Device-Name': Device?.deviceName || 'unknown',
    'X-Device-Is-Physical': Device ? String(Device.isDevice) : 'unknown',
    'User-Agent': getUserAgent(),
  };
}
