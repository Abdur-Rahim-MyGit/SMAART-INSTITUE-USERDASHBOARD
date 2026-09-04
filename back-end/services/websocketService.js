const { WebSocketServer, WebSocket } = require('ws');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const url = require('url');

const clients = new Map();
let io = null;

function getUserIdFromToken(token) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return (decoded.id || decoded._id || decoded.userId || '').toString() || null;
  } catch (error) {
    return null;
  }
}

function initWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // In production, only the configured frontend origin(s) may open a credentialed
  // socket connection. In development, any localhost origin is allowed.
  // FRONTEND_URL may be a comma-separated list (Docker frontend + Vite dev
  // server) — split it the same way the Express CORS middleware in server.js
  // does, otherwise the whole string is compared as one origin and never matches.
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: isProduction ? (allowedOrigins.length ? allowedOrigins : false) : true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return next(new Error('Unauthorized'));
    }

    socket.userId = userId;
    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.emit('connected', { message: 'Real-time notifications active' });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  setImmediate(() => {
    try {
      const { notificationEmitter } = require('../models/Notification');
      notificationEmitter.on('new_notification', (notification) => {
        const userId = notification.userId?.toString();
        if (userId) {
          sendNotificationToUser(userId, notification);
          sendUnreadCountUpdate(userId);
        }
      });
      console.log('[WS] Subscribed to notificationEmitter');
    } catch (error) {
      console.error('[WS] Failed to subscribe to notificationEmitter:', error.message);
    }
  });

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;

    if (pathname !== '/ws/notifications') {
      // SECURITY (audit): destroy non-matching upgrade sockets instead of
      // leaving them open (a bare return leaks the socket → slow resource DoS).
      socket.destroy();
      return;
    }

    const query = url.parse(req.url, true).query;
    const userId = getUserIdFromToken(query.token);

    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    req.userId = userId;

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

    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);

    safeSend(ws, { type: 'connected', message: 'Real-time notifications active' });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          safeSend(ws, { type: 'pong' });
        }
      } catch (error) {
        return;
      }
    });

    ws.on('close', () => {
      const userSet = clients.get(userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          clients.delete(userId);
        }
      }
    });
  });

  return wss;
}

function emitToSocketRoom(userId, eventName, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(eventName, payload);
}

function sendNotificationToUser(userId, notification) {
  const userSet = clients.get(userId?.toString());
  if (userSet && userSet.size > 0) {
    const payload = { type: 'notification', data: notification };
    userSet.forEach((ws) => safeSend(ws, payload));
  }

  emitToSocketRoom(userId, 'notification', notification);
}

function sendUnreadCountToUser(userId, count) {
  const userSet = clients.get(userId?.toString());
  if (userSet && userSet.size > 0) {
    const payload = { type: 'unread_count', count };
    userSet.forEach((ws) => safeSend(ws, payload));
  }

  emitToSocketRoom(userId, 'unread_count', { count });
}

function emitNotificationStateToUser(userId, payload) {
  const userSet = clients.get(userId?.toString());
  if (userSet && userSet.size > 0) {
    userSet.forEach((ws) => safeSend(ws, { type: 'notification_state', ...payload }));
  }

  emitToSocketRoom(userId, 'notification_state', payload);
}

function emitNotificationsClearedToUser(userId) {
  const userSet = clients.get(userId?.toString());
  if (userSet && userSet.size > 0) {
    userSet.forEach((ws) => safeSend(ws, { type: 'notifications_cleared' }));
  }

  emitToSocketRoom(userId, 'notifications_cleared', {});
}

function broadcastToAll(notificationData) {
  clients.forEach((userSet) => {
    const payload = { type: 'notification', data: notificationData };
    userSet.forEach((ws) => safeSend(ws, payload));
  });

  if (io) {
    io.emit('notification', notificationData);
  }
}

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function sendUnreadCountUpdate(userId) {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.getUnreadCount(userId);
    sendUnreadCountToUser(userId, count);
  } catch (error) {
    return;
  }
}

module.exports = {
  initWebSocket,
  sendNotificationToUser,
  sendUnreadCountToUser,
  sendUnreadCountUpdate,
  emitNotificationStateToUser,
  emitNotificationsClearedToUser,
  broadcastToAll,
};
