const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_MESSAGES_PER_REQUEST = 100; // Expo's own per-request cap

const isExpoPushToken = (token) =>
  typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

/**
 * Sends one push message to every token in `tokens` via Expo's push service.
 * Silently drops malformed tokens and never throws — a push failure must
 * never break the in-app notification it's piggybacking on.
 *
 * NOTE: this only reaches a device once the project has FCM V1 credentials
 * uploaded to EAS (Android) — see docs.expo.dev/push-notifications/fcm-credentials.
 * Until then Expo's push service will accept the request but the message
 * won't actually be delivered to Android devices.
 */
async function sendExpoPushToTokens(tokens, { title, body, data, sound = 'default' } = {}) {
  const validTokens = [...new Set((tokens || []).filter(isExpoPushToken))];
  if (!validTokens.length) return { sent: 0, tickets: [] };

  const messages = validTokens.map((to) => ({ to, title, body, data, sound }));
  const tickets = [];

  for (const batch of chunk(messages, MAX_MESSAGES_PER_REQUEST)) {
    try {
      const res = await axios.post(EXPO_PUSH_URL, batch, {
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        timeout: 10000,
      });
      tickets.push(...(res.data?.data || []));
    } catch (error) {
      console.error('[expoPush] batch send failed:', error.message);
    }
  }

  return { sent: validTokens.length, tickets };
}

/**
 * Looks up `userId` in Student then User (mirrors the lookup order already
 * used elsewhere in this file's callers) and pushes to every token on file.
 */
async function sendExpoPushToUser(userId, payload) {
  try {
    const Student = require('../models/Student');
    const User = require('../models/User');

    let owner = await Student.findById(userId).select('expoPushTokens').lean();
    if (!owner) owner = await User.findById(userId).select('expoPushTokens').lean();
    if (!owner?.expoPushTokens?.length) return { sent: 0, tickets: [] };

    return await sendExpoPushToTokens(owner.expoPushTokens, payload);
  } catch (error) {
    console.error('[expoPush] sendExpoPushToUser failed:', error.message);
    return { sent: 0, tickets: [] };
  }
}

/**
 * Bulk variant of sendExpoPushToUser — looks up every token across all
 * `userIds` in two queries (Student + User) instead of one round trip per
 * user, then sends a single (chunked) push. Used by broadcast-style paths
 * that call Notification.insertMany directly and so skip the per-notification
 * hook in models/Notification.js.
 */
async function sendExpoPushToUsers(userIds, payload) {
  const ids = [...new Set((userIds || []).map((id) => id?.toString()).filter(Boolean))];
  if (!ids.length) return { sent: 0, tickets: [] };

  try {
    const Student = require('../models/Student');
    const User = require('../models/User');

    const [students, users] = await Promise.all([
      Student.find({ _id: { $in: ids } }).select('expoPushTokens').lean(),
      User.find({ _id: { $in: ids } }).select('expoPushTokens').lean(),
    ]);

    const tokens = [...students, ...users].flatMap((doc) => doc.expoPushTokens || []);
    if (!tokens.length) return { sent: 0, tickets: [] };

    return await sendExpoPushToTokens(tokens, payload);
  } catch (error) {
    console.error('[expoPush] sendExpoPushToUsers failed:', error.message);
    return { sent: 0, tickets: [] };
  }
}

module.exports = { sendExpoPushToTokens, sendExpoPushToUser, sendExpoPushToUsers, isExpoPushToken };
