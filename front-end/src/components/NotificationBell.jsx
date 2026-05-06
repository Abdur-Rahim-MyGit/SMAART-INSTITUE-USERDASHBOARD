import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TYPE_LABELS = {
  badge: 'Badge',
  assessment: 'Assessment',
  course: 'Course',
  achievement: 'Achievement',
  community: 'Community',
  coaching: 'Coaching',
  support: 'Support',
  task: 'Task',
  certificate: 'Certificate',
  system: 'System',
};

const NotificationBell = () => {
  const { notifications, unreadCount, wsStatus, markRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Add loading state to prevent shaking during initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markRead(notification._id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.link) {
      navigate(notification.link);
    } else {
      navigate('/notifications');
    }
    setIsOpen(false);
  };

  const getStatusColor = () => {
    switch (wsStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusDot = () => {
    switch (wsStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500 animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
          isLoading ? 'opacity-50 pointer-events-none' : ''
        }`}
        title={`Notifications (${unreadCount} unread) - ${wsStatus}`}
        disabled={isLoading}
      >
        <Bell className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${
          isLoading ? 'animate-pulse' : ''
        }`} />
        
        {/* Unread count badge */}
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection status indicator */}
        {!isLoading && (
          <span 
            className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${getStatusDot()}`}
            title={`Connection: ${wsStatus}`}
          />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {wsStatus === 'connected' ? 'Connected' : wsStatus}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${notification.color || '#1a3884'}15` }}
                    >
                      <Bell
                        className="w-4 h-4"
                        style={{ color: notification.color || '#1a3884' }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
                            {TYPE_LABELS[notification.type] || notification.type}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
