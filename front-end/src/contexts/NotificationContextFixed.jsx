/**
 * NotificationContextFixed.jsx
 * -------------------------
 * Simplified, stable notification context without WebSocket complexity
 * Prevents infinite loops and buffering issues
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useUser from '@/hooks/useUser';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthHeaders]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user, getAuthHeaders]);

  // Mark as read
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
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [getAuthHeaders]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [getAuthHeaders]);

  // Clear all
  const clearAll = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [getAuthHeaders]);

  // Refresh
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initialize on user change
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        wsStatus: 'disabled', // Simplified - no WebSocket
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
      isLoading: false,
      wsStatus: 'disabled',
      markRead: () => {},
      markAllRead: () => {},
      clearAll: () => {},
      refresh: () => {},
      fetchNotifications: () => {},
    };
  }
  return ctx;
}
