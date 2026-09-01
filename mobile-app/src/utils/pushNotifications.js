import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsAPI } from '../api/notifications';
import { navigate } from '../navigation/navigationRef';

// Foreground presentation — without this, notifications arriving while the app
// is open are silently swallowed. SDK 57 deprecates `shouldShowAlert` in favor
// of the granular banner/list pair (per NotificationsHandler in expo-notifications 57).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// The Expo push token of the install we most recently registered with the
// backend, kept so unregister works after sign-out flows and so a second
// registration in the same session becomes a cheap no-op.
let registeredToken = null;

const ANDROID_CHANNEL_ID = 'default';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'General notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
  });
}

async function ensurePermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  if (settings.status === 'undetermined' || settings.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    return !!requested.granted;
  }
  return false;
}

function getProjectId() {
  // getExpoPushTokenAsync can infer this itself, but in bare/dev-client builds
  // the inference can fail — resolve it explicitly and pass it in.
  return (
    Constants?.easConfig?.projectId ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

/**
 * Register this device for push notifications and store the Expo push token
 * on the backend. Safe to call repeatedly; never throws.
 * @returns {Promise<string|null>} the Expo push token, or null when unavailable
 */
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) {
      console.warn('[Push] Skipping registration: push notifications require a physical device');
      return null;
    }

    await ensureAndroidChannel();

    const granted = await ensurePermissions();
    if (!granted) {
      console.warn('[Push] Notification permission not granted');
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      // SDK 57 throws from getExpoPushTokenAsync when no projectId can be
      // inferred (bare workflow / missing EAS config) — bail out gracefully.
      console.warn('[Push] No EAS projectId found in app config; cannot fetch Expo push token');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;

    if (token !== registeredToken) {
      await notificationsAPI.registerPushToken(token, Platform.OS);
      registeredToken = token;
    }
    return token;
  } catch (err) {
    console.warn('[Push] Registration failed:', err?.message || err);
    return null;
  }
}

/**
 * Remove this device's push token from the backend. Call BEFORE the auth
 * token is cleared (the DELETE is authenticated). Never throws.
 */
export async function unregisterPushNotifications() {
  try {
    let token = registeredToken;
    if (!token) {
      const projectId = getProjectId();
      if (!Device.isDevice || !projectId) return;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    }
    if (!token) return;

    await notificationsAPI.unregisterPushToken(token);
    registeredToken = null;
  } catch (err) {
    console.warn('[Push] Unregister failed:', err?.message || err);
  }
}

/**
 * Where a tapped push lands, by the Notification model's `type` (the server
 * sends it in the push data payload as { notificationId, type }). Values are
 * either a stack route name or [tab-container, nested tab]. Anything unmapped
 * (system, info, warning, task, …) falls back to the Notifications list,
 * which every push mirrors into.
 */
const TAP_ROUTES = {
  assessment: 'Assessments',
  certificate: 'Certificates',
  support: 'Support',
  course: ['MainTabs', 'Learning'],
  community: ['MainTabs', 'Community'],
  coaching: ['MainTabs', 'Career'],
  badge: ['MainTabs', 'Profile'],
  achievement: ['MainTabs', 'Profile'],
};

function openForNotification(response) {
  const type = response?.notification?.request?.content?.data?.type;
  const route = TAP_ROUTES[type];
  if (Array.isArray(route)) {
    navigate(route[0], { screen: route[1] });
  } else {
    navigate(route || 'Notifications');
  }
}

/**
 * Subscribe to notification taps while the app is running (foreground or
 * background). Returns a cleanup function.
 */
export function subscribeToNotificationTaps() {
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openForNotification(response);
    });
    return () => subscription.remove();
  } catch (err) {
    console.warn('[Push] Could not subscribe to notification taps:', err?.message || err);
    return () => {};
  }
}

/**
 * Handle the notification tap that launched the app from a killed state.
 * Call once the NavigationContainer is ready.
 */
export function handleInitialNotificationResponse() {
  try {
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      Notifications.clearLastNotificationResponse();
      openForNotification(response);
    }
  } catch (err) {
    console.warn('[Push] Cold-start notification handling failed:', err?.message || err);
  }
}
