/**
 * Production-Ready Scaled WebSocket Service for SMAART Minds
 * Location: /aws-deployment/production-websocket-sync.js
 * 
 * DESIGN RATIONALE:
 * The current system runs BOTH 'socket.io' and raw 'ws' servers concurrently:
 * - socket.io matches users using rooms: `io.to("user:id")`
 * - ws matches users using a local in-memory Map: `clients.get(userId)`
 * 
 * In a multi-node horizontal scaling environment (like AWS ECS Fargate with 2+ tasks):
 * 1. Socket.io instances sync via the standard `@socket.io/redis-adapter`.
 * 2. Raw 'ws' clients are scattered across different container memories. A message sent on Pod A
 *    must reach a raw 'ws' connection on Pod B.
 * 
 * SOLUTION:
 * We use Redis Pub/Sub to synchronize raw 'ws' notifications across all container nodes.
 * When a notification is generated on Pod A, it is published to Redis. Pod B receives the message
 * from Redis, checks its local 'ws' client Map, and delivers the notification.
 */

const { WebSocketServer, WebSocket } = require('ws');
const { Server: SocketIOServer } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const url = require('url');
const logger = require('../utils/logger'); // Ensure relative path is updated if copied

const clients = new Map();
let io = null;
let redisPubClient = null;
let redisSubClient = null;

// Redis Pub/Sub Channel Name for raw 'ws' synchronization
const WS_SYNC_CHANNEL = 'smaart:ws:sync';

/**
 * Validates JWT token and extracts User ID securely
 */
function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return (decoded.id || decoded._id || decoded.userId || '').toString() || null;
  } catch (error) {
    logger.warn(`[WS-AUTH] JWT Verification failed: ${error.message}`);
    return null;
  }
}

/**
 * Initializes scaled WebSockets with Redis Adapter (Socket.io) and Redis Pub/Sub (raw ws)
 */
function initWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Initialize Socket.io server
  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.FRONTEND_URL || "https://app.smaartminds.com",
      credentials: true,
    },
  });

  // Redis Adapter Setup for Socket.io and raw ws Sync
  if (process.env.REDIS_HOST) {
    const redisUrl = `redis://${process.env.REDIS_USERNAME || ''}:${process.env.REDIS_PASSWORD || ''}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
    
    redisPubClient = createClient({ url: redisUrl });
    redisSubClient = redisPubClient.duplicate();

    redisPubClient.on('error', (err) => logger.error(`[REDIS-PUB] Error: ${err.message}`));
    redisSubClient.on('error', (err) => logger.error(`[REDIS-SUB] Error: ${err.message}`));

    Promise.all([redisPubClient.connect(), redisSubClient.connect()])
      .then(() => {
        // 1. Connect Socket.io Redis Adapter
        io.adapter(createAdapter(redisPubClient, redisSubClient));
        logger.info('✅ Scaled Socket.io successfully using Redis Adapter.');

        // 2. Subscribe to raw 'ws' sync channel for multi-pod broadcast
        redisSubClient.subscribe(WS_SYNC_CHANNEL, (message) => {
          try {
            const { type, userId, data } = JSON.parse(message);
            
            // Deliver message to raw 'ws' client if it exists on this specific pod
            const userSet = clients.get(userId);
            if (userSet && userSet.size > 0) {
              const payload = { type, ...data };
              userSet.forEach((ws) => safeSend(ws, payload));
              logger.debug(`[WS-SYNC] Delivered ${type} event to local ws client: ${userId}`);
            }
          } catch (error) {
            logger.error(`[WS-SYNC] Error handling subscription sync: ${error.message}`);
          }
        });
        logger.info('✅ Subscribed raw ws to Redis Pub/Sub synchronization channel.');
      })
      .catch((err) => {
        logger.error(`❌ Redis Scale Setup failed: ${err.message}. WebSockets running in single-instance mode.`);
      });
  }

  // Socket.io Authentication Middleware
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

  // Watch local mongoose notification emitters
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
      logger.info('[WS] Subscribed to local notificationEmitter');
    } catch (error) {
      logger.error('[WS] Failed to subscribe to notificationEmitter:', error.message);
    }
  });

  // Upgrade Raw WebSockets with TLS Authentication validation
  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;

    if (pathname !== '/ws/notifications') {
      return; // Forward to other upgrade handlers (like Socket.io)
    }

    const query = url.parse(req.url, true).query;
    const userId = getUserIdFromToken(query.token);

    if (!userId) {
      logger.warn('[WS-AUTH] Raw WebSocket connection upgrade rejected: Missing or invalid token.');
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    req.userId = userId;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // Raw WebSocket connection handler
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
        // Silent catch for bad payloads
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

/**
 * Publishes events to Redis Pub/Sub to reach raw ws clients on other pods
 */
function publishToRedisSync(userId, type, data) {
  if (redisPubClient && redisPubClient.isOpen) {
    redisPubClient.publish(WS_SYNC_CHANNEL, JSON.stringify({ type, userId, data }))
      .catch(err => logger.error(`[REDIS-PUB] Publish Sync Error: ${err.message}`));
  }
}

function emitToSocketRoom(userId, eventName, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(eventName, payload);
}

function sendNotificationToUser(userId, notification) {
  const userSet = clients.get(userId?.toString());
  
  // 1. Deliver to local raw ws client if connected on this container
  if (userSet && userSet.size > 0) {
    const payload = { type: 'notification', data: notification };
    userSet.forEach((ws) => safeSend(ws, payload));
  }

  // 2. Publish to Redis to deliver to raw ws client if connected on other containers
  publishToRedisSync(userId?.toString(), 'notification', { data: notification });

  // 3. Emit via socket.io (handles cross-pod sync via Redis socket.io-adapter automatically)
  emitToSocketRoom(userId, 'notification', notification);
}

function sendUnreadCountToUser(userId, count) {
  const userSet = clients.get(userId?.toString());
  
  // 1. Deliver locally
  if (userSet && userSet.size > 0) {
    const payload = { type: 'unread_count', count };
    userSet.forEach((ws) => safeSend(ws, payload));
  }

  // 2. Sync to other containers
  publishToRedisSync(userId?.toString(), 'unread_count', { count });

  // 3. Emit via socket.io
  emitToSocketRoom(userId, 'unread_count', { count });
}

function emitNotificationStateToUser(userId, payload) {
  const userSet = clients.get(userId?.toString());
  
  // 1. Deliver locally
  if (userSet && userSet.size > 0) {
    userSet.forEach((ws) => safeSend(ws, { type: 'notification_state', ...payload }));
  }

  // 2. Sync to other containers
  publishToRedisSync(userId?.toString(), 'notification_state', payload);

  // 3. Emit via socket.io
  emitToSocketRoom(userId, 'notification_state', payload);
}

function emitNotificationsClearedToUser(userId) {
  const userSet = clients.get(userId?.toString());
  
  // 1. Deliver locally
  if (userSet && userSet.size > 0) {
    userSet.forEach((ws) => safeSend(ws, { type: 'notifications_cleared' }));
  }

  // 2. Sync to other containers
  publishToRedisSync(userId?.toString(), 'notifications_cleared', {});

  // 3. Emit via socket.io
  emitToSocketRoom(userId, 'notifications_cleared', {});
}

function broadcastToAll(notificationData) {
  // Emit to local ws clients
  clients.forEach((userSet) => {
    const payload = { type: 'notification', data: notificationData };
    userSet.forEach((ws) => safeSend(ws, payload));
  });

  // Sync to other containers (use null or '*' user identifier for broadcast)
  publishToRedisSync('*', 'notification', { data: notificationData });

  if (io) {
    io.emit('notification', notificationData);
  }
}

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(payload));
    } catch (error) {
      logger.error(`[WS-SEND] Send Error: ${error.message}`);
    }
  }
}

async function sendUnreadCountUpdate(userId) {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.getUnreadCount(userId);
    sendUnreadCountToUser(userId, count);
  } catch (error) {
    logger.error(`[WS] Failed to fetch unread notification count: ${error.message}`);
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
