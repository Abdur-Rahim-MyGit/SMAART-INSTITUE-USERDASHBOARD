import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationsAPI } from '../api/notifications';

// Foreground display behavior — required once, app-wide. Lives here rather
// than App.js since it's push-specific config, called from App.js at module
// scope alongside SplashScreen.preventAutoHideAsync().
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let cachedToken = null;

/**
 * Fetches (or reuses) this device's Expo push token and registers it with
 * the backend against the signed-in user. Only meaningful once real push
 * delivery is wired up server-side (FCM V1 credentials uploaded to EAS for
 * Android — see docs.expo.dev/push-notifications/fcm-credentials); until
 * then this still runs safely, it just registers a token nothing sends to
 * yet.
 *
 * Never throws — push registration must not be able to block sign-in.
 */
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) return null; // simulators/emulators have no real token

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
    console.warn('[push] registration failed:', err.message);
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
