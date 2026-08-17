/**
 * FR-AUTH-09 — Biometric login.
 *
 * Deliberately NOT a second credential path: biometrics never authenticate
 * against the server and never stand in for the password + OTP flow. They gate
 * *re-opening an already-established session* — the JWT is in SecureStore
 * either way, and this decides whether the app will use it without a fresh
 * fingerprint/face check. That keeps the server's single-session and OTP
 * guarantees exactly as they are today.
 *
 * Web has no LocalAuthentication module, so every function degrades to
 * "unavailable" rather than throwing (the app still runs under `expo start --web`).
 */
import { Platform } from 'react-native';
import * as storage from './storage';

export const BIOMETRIC_ENABLED_KEY = 'smaart_biometric_enabled';

let LocalAuthentication = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line global-require
    LocalAuthentication = require('expo-local-authentication');
  } catch {
    LocalAuthentication = null;
  }
}

/**
 * What this device can actually do.
 * @returns {Promise<{ available: boolean, enrolled: boolean, label: string }>}
 *   `available` = hardware present, `enrolled` = user has a fingerprint/face registered.
 */
export async function getBiometricCapability() {
  if (!LocalAuthentication) {
    return { available: false, enrolled: false, label: 'Biometrics' };
  }
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    // AuthenticationType: 1 = FINGERPRINT, 2 = FACIAL_RECOGNITION, 3 = IRIS
    let label = 'Biometrics';
    if (types?.includes(2)) label = Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    else if (types?.includes(1)) label = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    else if (types?.includes(3)) label = 'Iris';

    return { available: !!hasHardware, enrolled: !!isEnrolled, label };
  } catch {
    return { available: false, enrolled: false, label: 'Biometrics' };
  }
}

/**
 * Run the OS prompt.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function promptBiometric(promptMessage = 'Unlock SMAART Institute') {
  if (!LocalAuthentication) {
    return { success: false, error: 'unavailable' };
  }
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      // Allow device PIN/pattern as fallback — locking a student out of their own
      // session because a sensor is wet is worse than the marginal security gain.
      disableDeviceFallback: false,
      cancelLabel: 'Use password instead',
    });
    return res?.success ? { success: true } : { success: false, error: res?.error || 'failed' };
  } catch (err) {
    return { success: false, error: err?.message || 'failed' };
  }
}

export async function isBiometricEnabled() {
  try {
    return (await storage.getItem(BIOMETRIC_ENABLED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled) {
  if (enabled) {
    await storage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
  } else {
    await storage.deleteItem(BIOMETRIC_ENABLED_KEY);
  }
}
