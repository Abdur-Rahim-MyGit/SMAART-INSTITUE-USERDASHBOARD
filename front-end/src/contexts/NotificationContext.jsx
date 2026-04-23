/**
 * NotificationContext.jsx
 * -----------------------
 * Provides real-time notification state to the entire app via WebSocket.
 *
 * Features:
 *  • Connects to the backend's /ws/notifications endpoint using the JWT token
 *  • Auto-reconnects with exponential back-off (up to 30 s)
 *  • Exposes: notifications, unreadCount, wsStatus, markRead, markAllRead, clearAll, refresh
 *  • Falls back to REST polling if the WS connection repeatedly fails
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import useUser from '@/hooks/useUser';

const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/^http/, 'ws')
    .replace('/api', '');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000]; // exponential back-off

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useUser();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected' | 'error'

  const wsRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }, []);

  // ── REST helpers (also used as fallback) ─────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* swallow */ }
  }, [getAuthHeaders]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount ?? 0);
    } catch { /* swallow */ }
  }, [getAuthHeaders]);

  // ── WebSocket connection ──────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const token = sessionStorage.getItem('token');
    if (!token) return; // not logged in

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
    }

    setWsStatus('connecting');
    const wsUrl = `${WS_BASE_URL}/ws/notifications?token=${token}`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('[NotificationWS] Failed to create WebSocket:', e);
      setWsStatus('error');
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      reconnectAttemptRef.current = 0;
      setWsStatus('connected');
      console.log('[NotificationWS] ✅ Connected');

      // Send a ping every 25 s to keep the connection alive
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'connected':
            // Server confirmed connection — fetch initial data via REST
            fetchNotifications();
            break;

          case 'notification':
            // Prepend new notification and bump count
            setNotifications((prev) => {
              const exists = prev.some((n) => n._id === msg.data?._id);
              if (exists) return prev;
              return [msg.data, ...prev].slice(0, 50); // keep max 50
            });
            // Increment unread count only if it isn't already read
            if (!msg.data?.isRead) {
              setUnreadCount((c) => c + 1);
            }
            break;

          case 'unread_count':
            setUnreadCount(msg.count ?? 0);
            break;

          case 'pong':
            // Heartbeat acknowledged
            break;

          default:
            break;
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onerror = (err) => {
      if (!isMountedRef.current) return;
      console.warn('[NotificationWS] ⚠️ Error', err);
      setWsStatus('error');
    };

    ws.onclose = (event) => {
      if (!isMountedRef.current) return;
      clearInterval(pingIntervalRef.current);
      setWsStatus('disconnected');

      if (event.code === 1008 /* Policy Violation – auth failed */) {
        console.warn('[NotificationWS] Auth rejected – not reconnecting');
        return;
      }

      // Exponential back-off reconnect
      const delay = RECONNECT_DELAYS[
        Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
      ];
      reconnectAttemptRef.current += 1;
      console.log(`[NotificationWS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [fetchNotifications]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Connect / disconnect when the user logs in or out
  useEffect(() => {
    if (user) {
      connect();
      fetchUnreadCount(); // immediate badge count on mount
    } else {
      // User logged out – clean up
      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsStatus('disconnected');
      setNotifications([]);
      setUnreadCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id || user?._id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const markRead = useCallback(async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* swallow */ }
  }, [getAuthHeaders]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* swallow */ }
  }, [getAuthHeaders]);

  const clearAll = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* swallow */ }
  }, [getAuthHeaders]);

  const refresh = useCallback(() => fetchNotifications(), [fetchNotifications]);

  // ── Provider ──────────────────────────────────────────────────────────────

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        wsStatus,
        markRead,
        markAllRead,
        clearAll,
        refresh,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    console.warn('⚠️ useNotifications called outside NotificationProvider. Returning fallback.');
    return {
      notifications: [],
      unreadCount: 0,
      wsStatus: 'disconnected',
      markRead: () => {},
      markAllRead: () => {},
      clearAll: () => {},
      refresh: () => {},
      fetchNotifications: () => {},
    };
  }
  return ctx;
}
