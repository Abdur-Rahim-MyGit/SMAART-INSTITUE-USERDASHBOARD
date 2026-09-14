import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { notificationsAPI } from '../api/notifications';
import { resolveNotificationTarget } from './notificationRouting';

/**
 * expo-notifications is loaded lazily and only after we have confirmed the
 * native side is actually present in the running binary.
 *
 * Importing it runs `requireNativeModule('ExpoPushTokenManager')` at module
 * scope, which throws "Cannot find native module 'ExpoPushTokenManager'"
 * anywhere that module isn't compiled in:
 *   - Expo Go on Android (push was removed from Expo Go in SDK 53 — a
 *     development build is required for it), and
 *   - any dev-client APK built before expo-notifications was installed.
 *
 * A plain try/catch around `require()` is NOT enough. Metro's runtime loader
 * (metro-runtime/src/polyfills/require.js, guardedLoadModule) catches a module
 * initialisation error itself and hands it to ErrorUtils.reportFatalError —
 * a red-box ERROR in dev, a hard crash in release — and then returns
 * undefined to the caller, so our catch never runs. The only safe approach is
 * to ask Expo whether the module exists *before* requiring the package.
 * `requireOptionalNativeModule` returns null instead of throwing.
 */
const PUSH_NATIVE_MODULE = 'ExpoPushTokenManager';

let notificationsModule; // undefined = not probed yet, null = unavailable

function isPushNativeAvailable() {
  try {
    return requireOptionalNativeModule(PUSH_NATIVE_MODULE) != null;
  } catch {
    return false;
  }
}

function loadNotifications() {
  if (notificationsModule !== undefined) return notificationsModule;

  if (!isPushNativeAvailable()) {
    notificationsModule = null;
    const why = isRunningInExpoGo()
      ? 'Expo Go does not include push notifications (SDK 53+). Open the app in the development build instead.'
      : 'This build was compiled without expo-notifications. Rebuild it: npx expo run:android (or eas build --profile development).';
    console.log(`[push] disabled — native module "${PUSH_NATIVE_MODULE}" not found. ${why}`);
    return null;
  }

  try {
    notificationsModule = require('expo-notifications');
  } catch {
    notificationsModule = null;
  }
  return notificationsModule;
}

function loadDevice() {
  try {
    return require('expo-device');
  } catch {
    return null;
  }
}

/** Foreground display behavior. Safe to call anywhere — no-ops without the module. */
export function setupNotificationHandler() {
  const Notifications = loadNotifications();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[push] notification handler unavailable:', err.message);
  }
}

/**
 * Routes a tapped notification to the screen it is about.
 *
 * The backend attaches a link to every push, but nothing on the client ever
 * read it: tapping a notification just resumed whatever screen was last open.
 * Handles both cases — the app already running (`addNotificationResponse…`) and
 * the app launched cold by the tap (`getLastNotificationResponseAsync`).
 *
 * @param {import('@react-navigation/native').NavigationContainerRef} navigationRef
 * @returns {() => void} unsubscribe
 */
export function setupNotificationTapHandler(navigationRef) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  const go = (response) => {
    try {
      const data = response?.notification?.request?.content?.data;
      const [screen, params] = resolveNotificationTarget(data);
      if (navigationRef?.isReady?.()) navigationRef.navigate(screen, params);
    } catch (err) {
      console.warn('[push] could not open the tapped notification:', err.message);
    }
  };

  // A tap that cold-started the app is delivered here, not to the subscription.
  Notifications.getLastNotificationResponseAsync?.()
    .then((response) => response && go(response))
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener(go);
  return () => sub?.remove?.();
}

let cachedToken = null;

/**
 * Fetches (or reuses) this device's Expo push token and registers it with the
 * backend against the signed-in user. Returns null — without throwing — when
 * push isn't available (Expo Go, emulator, permission denied, or no FCM
 * credentials yet).
 *
 * Actual delivery additionally needs FCM V1 credentials uploaded to EAS for
 * Android; see docs.expo.dev/push-notifications/fcm-credentials.
 */
export async function registerForPushNotifications() {
  const Notifications = loadNotifications();
  if (!Notifications) return null;

  try {
    const Device = loadDevice();
    if (Device && !Device.isDevice) return null; // emulators have no real token

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = token;

    await notificationsAPI.registerDevice(token);
    return token;
  } catch (err) {
    console.warn('[push] registration skipped:', err.message);
    return null;
  }
}

/** Best-effort — called on sign-out so a logged-out device stops getting pushes. */
export async function unregisterPushNotifications() {
  if (!cachedToken) return;
  const token = cachedToken;
  cachedToken = null;
  try {
    await notificationsAPI.unregisterDevice(token);
  } catch {
    // Sign-out already proceeds regardless.
  }
}
