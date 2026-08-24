/**
 * Camera permission, behind a guarded require.
 *
 * `react-native-vision-camera` is a native module. This file is reachable from
 * the assessment flow, which is reachable from a bottom tab — so a plain
 * top-level import would put the native module on the boot path and take the
 * whole app down on any binary compiled before it was added:
 *
 *     Cannot find native module 'VisionCamera'
 *
 * Same reasoning and same shape as `components/CourseVideoPlayer.js` (expo-video),
 * `utils/biometrics.js` (expo-local-authentication) and `utils/device.js`
 * (expo-device). On a binary without the module, `requestCameraPermission()`
 * answers `'unavailable'` and the assessment runs unproctored rather than
 * crashing — which is the correct trade: a missing proctor must never cost a
 * student their attempt.
 */

let Camera = null;
try {
  // eslint-disable-next-line global-require
  Camera = require('react-native-vision-camera').Camera;
} catch {
  Camera = null;
}

export const isCameraModuleAvailable = () => Camera != null;

/**
 * @returns {Promise<'granted'|'denied'|'blocked'|'unavailable'>}
 *
 * `blocked` means the OS will not prompt again and only Settings can change it.
 * VisionCamera reports that as `'denied'` after a previous refusal, so the two
 * are distinguished by asking what the current status was before requesting.
 */
export async function requestCameraPermission() {
  if (!Camera) return 'unavailable';

  try {
    const before = await Camera.getCameraPermissionStatus();
    if (before === 'granted') return 'granted';

    const after = await Camera.requestCameraPermission();
    if (after === 'granted') return 'granted';

    // Already refused once before this attempt → the OS dialog never appeared.
    return before === 'denied' || before === 'restricted' ? 'blocked' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Current status without prompting. Used to detect a revoke mid-attempt. */
export async function getCameraPermissionStatus() {
  if (!Camera) return 'unavailable';
  try {
    return await Camera.getCameraPermissionStatus();
  } catch {
    return 'unavailable';
  }
}
