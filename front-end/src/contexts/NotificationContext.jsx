import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiCall, getBackendUrl } from '@/services/api';
import useUser from '@/hooks/useUser';

const NotificationContext = createContext(null);
const SOCKET_URL = getBackendUrl();

export function NotificationProvider({ children }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const socketRef = useRef(null);
  const latestQueryRef = useRef({ unreadOnly: false, limit: 20 });

  const applyUnreadFilter = useCallback((items, options = latestQueryRef.current) => {
    if (!options?.unreadOnly) {
      return items;
    }
    return items.filter((item) => !item.isRead);
  }, []);

  const applyNotificationState = useCallback((payload) => {
    if (!payload?.action) return;

    if (payload.action === 'read') {
      setNotifications((prev) => applyUnreadFilter(
        prev.map((item) => (
          item._id === payload.notificationId ? { ...item, isRead: true } : item
        ))
      ));
      return;
    }

    if (payload.action === 'read_all') {
      setNotifications((prev) => applyUnreadFilter(prev.map((item) => ({ ...item, isRead: true }))));
      return;
    }

    if (payload.action === 'delete') {
      setNotifications((prev) => prev.filter((item) => item._id !== payload.notificationId));
    }
  }, [applyUnreadFilter]);

  const fetchNotifications = useCallback(async (page = 1, append = false, options = {}) => {
    const mergedOptions = {
      ...latestQueryRef.current,
      ...options,
    };
    latestQueryRef.current = mergedOptions;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(mergedOptions.limit || 20),
    });

    if (mergedOptions.unreadOnly) {
      params.set('unreadOnly', 'true');
    }
    
    if (mergedOptions.startDate) {
      params.set('startDate', mergedOptions.startDate);
    }
    if (mergedOptions.endDate) {
      params.set('endDate', mergedOptions.endDate);
    }

    setIsLoading(true);
    try {
      const response = await apiCall(`/notifications?${params.toString()}`);
      const incomingNotifications = applyUnreadFilter(response.notifications || [], mergedOptions);

      setNotifications((prev) => {
        if (!append) {
          return incomingNotifications;
        }

        const existingIds = new Set(prev.map((item) => item._id));
        const merged = [...prev];
        incomingNotifications.forEach((item) => {
          if (!existingIds.has(item._id)) {
            merged.push(item);
          }
        });
        return merged;
      });

      setUnreadCount(response.unreadCount || 0);
      setPagination(response.pagination || { page, pages: 1, total: incomingNotifications.length, limit: mergedOptions.limit || 20 });
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [applyUnreadFilter]);

  const fetchUnreadCount = useCallback(async () => {
    const response = await apiCall('/notifications/unread-count');
    setUnreadCount(response.unreadCount || 0);
    return response.unreadCount || 0;
  }, []);

  const refresh = useCallback(() => fetchNotifications(1, false, latestQueryRef.current), [fetchNotifications]);

  const markRead = useCallback(async (notificationId) => {
    const target = notifications.find((item) => item._id === notificationId);
    if (target?.isRead) return target;

    const response = await apiCall(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });

    setNotifications((prev) => applyUnreadFilter(
      prev.map((item) => (
        item._id === notificationId ? { ...item, isRead: true } : item
      ))
    ));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    return response.notification;
  }, [applyUnreadFilter, notifications]);

  const markAllRead = useCallback(async () => {
    const response = await apiCall('/notifications/read-all', {
      method: 'PATCH',
    });
    setNotifications((prev) => applyUnreadFilter(prev.map((item) => ({ ...item, isRead: true }))));
    setUnreadCount(0);
    return response;
  }, [applyUnreadFilter]);

  const deleteNotification = useCallback(async (notificationId) => {
    const target = notifications.find((item) => item._id === notificationId);
    await apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });

    setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    const response = await apiCall('/notifications/clear-all', {
      method: 'DELETE',
    });
    setNotifications([]);
    setUnreadCount(0);
    setPagination((prev) => ({ ...prev, total: 0, pages: 1, page: 1 }));
    return response;
  }, []);

  useEffect(() => {
    if (!user?._id && !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setWsStatus('disconnected');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) return;

    fetchNotifications(1, false, latestQueryRef.current).catch((error) => {
      console.error('Failed to load notifications:', error);
    });

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;
    setWsStatus('connecting');

    socket.on('connect', () => {
      setWsStatus('connected');
      socket.emit('ping');
    });

    socket.on('disconnect', () => {
      setWsStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Notification socket error:', error.message);
      setWsStatus('error');
    });

    socket.on('connected', () => {
      fetchUnreadCount().catch(() => {});
    });

    socket.on('pong', () => {
      setWsStatus('connected');
    });

    socket.on('notification', (notification) => {
      if (!notification?._id) return;
      if (latestQueryRef.current.unreadOnly && notification.isRead) return;

      setNotifications((prev) => {
        const existingIndex = prev.findIndex((item) => item._id === notification._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...notification };
          return applyUnreadFilter(updated);
        }
        return applyUnreadFilter([notification, ...prev]);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on('unread_count', ({ count }) => {
      setUnreadCount(count || 0);
    });

    socket.on('notification_state', (payload) => {
      applyNotificationState(payload);
    });

    socket.on('notifications_cleared', () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [applyNotificationState, applyUnreadFilter, fetchNotifications, fetchUnreadCount, user?._id, user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        wsStatus,
        pagination,
        fetchNotifications,
        refresh,
        markRead,
        markAllRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
