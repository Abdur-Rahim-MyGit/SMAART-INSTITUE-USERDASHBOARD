/**
 * websocketService.js
 * -------------------
 * Manages all WebSocket connections for real-time notifications.
 * Attaches to the existing Express HTTP server; no separate port needed.
 *
 * Protocol:
 *   Client → Server:  { type: 'ping' }
 *   Server → Client:  { type: 'pong' }
 *                     { type: 'notification', data: <notification object> }
 *                     { type: 'unread_count', count: <number> }
 *                     { type: 'auth_error', message: '...' }
 *                     { type: 'connected', message: '...' }
 */

const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// userId (string) → Set of WebSocket instances
const clients = new Map();

/**
 * Attach the WebSocket server to the given HTTP server.
 * @param {import('http').Server} httpServer
 */
function initWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Listen to the Notification model emitter to push real-time updates.
  // We require lazily here to avoid circular-dependency issues at module load.
  setImmediate(() => {
    try {
      const { notificationEmitter } = require('../models/Notification');
      notificationEmitter.on('new_notification', (notification) => {
        const userId = notification.userId?.toString();
        if (userId) {
          sendNotificationToUser(userId, notification);
          // Also update the badge count for that user
          sendUnreadCountUpdate(userId);
        }
      });
      console.log('[WS] ✅ Subscribed to notificationEmitter');
    } catch (e) {
      console.error('[WS] Failed to subscribe to notificationEmitter:', e.message);
    }
  });

  // Intercept the HTTP upgrade request to perform JWT auth before
  // handing off to the WebSocket server.
  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;

    // Only handle our dedicated WS endpoint
    if (pathname !== '/ws/notifications') {
      socket.destroy();
      return;
    }

    // Extract token from query string: ?token=<jwt>
    const query = url.parse(req.url, true).query;
    const token = query.token;

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Attach user info to the request before the upgrade completes
    req.userId = decoded.id || decoded._id || decoded.userId;
    req.userRole = decoded.role;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req) => {
    const userId = req.userId?.toString();

    if (!userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Register the new client
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);

    console.log(`[WS] ✅ Client connected — userId: ${userId} (total connections: ${getTotalConnections()})`);

    // Confirm connection
    safeSend(ws, { type: 'connected', message: 'Real-time notifications active' });

    // Handle incoming messages from the client
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          safeSend(ws, { type: 'pong' });
        }
      } catch {
        // ignore malformed frames
      }
    });

    // Clean up on disconnect
    ws.on('close', () => {
      const userSet = clients.get(userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`[WS] ❌ Client disconnected — userId: ${userId} (total connections: ${getTotalConnections()})`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for userId ${userId}:`, err.message);
    });
  });

  console.log('[WS] ✅ WebSocket server initialised on /ws/notifications');
  return wss;
}

/**
 * Send a real-time notification to a specific user (all their tabs/devices).
 * @param {string} userId
 * @param {object} notification – the Mongoose notification document (as plain object)
 */
function sendNotificationToUser(userId, notification) {
  const userSet = clients.get(userId?.toString());
  if (!userSet || userSet.size === 0) return;

  const payload = { type: 'notification', data: notification };
  userSet.forEach((ws) => safeSend(ws, payload));
}

/**
 * Send an updated unread count to a specific user.
 * @param {string} userId
 * @param {number} count
 */
function sendUnreadCountToUser(userId, count) {
  const userSet = clients.get(userId?.toString());
  if (!userSet || userSet.size === 0) return;

  const payload = { type: 'unread_count', count };
  userSet.forEach((ws) => safeSend(ws, payload));
}

/**
 * Broadcast a notification payload to ALL connected users.
 * Used for admin broadcast announcements.
 * @param {object} notificationData – the raw notification data (without userId)
 */
function broadcastToAll(notificationData) {
  clients.forEach((userSet, uid) => {
    const payload = { type: 'notification', data: notificationData };
    userSet.forEach((ws) => safeSend(ws, payload));
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function getTotalConnections() {
  let total = 0;
  clients.forEach((set) => { total += set.size; });
  return total;
}

/**
 * Query the DB for the current unread count and push it to the user.
 * @param {string} userId
 */
async function sendUnreadCountUpdate(userId) {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.getUnreadCount(userId);
    sendUnreadCountToUser(userId, count);
  } catch (e) {
    // non-critical – just swallow
  }
}

module.exports = {
  initWebSocket,
  sendNotificationToUser,
  sendUnreadCountToUser,
  sendUnreadCountUpdate,
  broadcastToAll,
};
