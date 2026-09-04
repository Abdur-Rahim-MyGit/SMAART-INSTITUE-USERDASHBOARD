const axios = require('axios');
const PushToken = require('../models/PushToken');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
// Expo's push API accepts at most 100 messages per request.
const EXPO_PUSH_BATCH_SIZE = 100;

const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 180;

const truncate = (str, max) => {
  if (!str) return str;
  const s = String(str);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * POST one batch (≤100 messages) to Expo's push API and prune tokens Expo
 * reports as DeviceNotRegistered (app uninstalled / token rotated).
 * Ticket order matches message order, which is how errors map back to tokens.
 */
const sendBatch = async (messages) => {
  const response = await axios.post(EXPO_PUSH_URL, messages, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    timeout: 10000,
  });

  const tickets = response?.data?.data;
  if (!Array.isArray(tickets)) return;

  const deadTokens = [];
  tickets.forEach((ticket, i) => {
    if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
      deadTokens.push(messages[i].to);
    }
  });

  if (deadTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: deadTokens } });
    console.log(`[ExpoPush] Pruned ${deadTokens.length} unregistered push token(s)`);
  }
};

/**
 * Send a push notification to every registered device of the given users.
 * Throws only on programmer error — network/Expo failures are logged.
 *
 * @param {Array<string|ObjectId>|string|ObjectId} userIds
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} payload.body
 * @param {Object} [payload.data]  – arbitrary JSON delivered to the app
 */
const sendPushToUsers = async (userIds, { title, body, data = {} }) => {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (ids.length === 0) return;

  const tokens = await PushToken.find({ user: { $in: ids } })
    .select('token')
    .lean();
  if (tokens.length === 0) return;

  const messages = tokens.map(({ token }) => ({
    to: token,
    sound: 'default',
    title: truncate(title, MAX_TITLE_LENGTH),
    body: truncate(body, MAX_BODY_LENGTH),
    data,
    channelId: 'default',
    priority: 'high',
  }));

  for (const batch of chunk(messages, EXPO_PUSH_BATCH_SIZE)) {
    try {
      await sendBatch(batch);
    } catch (err) {
      console.error('[ExpoPush] Batch send failed:', err?.response?.data || err.message);
    }
  }
};

/**
 * Fire-and-forget mirror of an in-app notification as a push notification.
 * Intentionally NOT awaited by callers — a push failure must never fail the
 * request that created the notification.
 *
 * @param {Object} notification – a Notification document (or plain object)
 */
const sendPushForNotification = (notification) => {
  try {
    if (!notification || !notification.userId) return;

    sendPushToUsers(notification.userId, {
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification._id ? notification._id.toString() : null,
        type: notification.type || 'system',
      },
    }).catch((err) => {
      console.error('[ExpoPush] sendPushForNotification error:', err.message);
    });
  } catch (err) {
    console.error('[ExpoPush] sendPushForNotification sync error:', err.message);
  }
};

module.exports = {
  sendPushToUsers,
  sendPushForNotification,
};
