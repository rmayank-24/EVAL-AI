import { useState, useRef, useEffect, ElementType } from 'react';
import { Bell, Clock, MessageCircle, FileText, X } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotificationFeed';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    // FIX: Changed handleClickContainersOutside to handleClickOutside
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: Notification['type']): ElementType => {
    switch (type) {
      case 'review': return FileText;
      case 'student_comment':
      case 'teacher_comment': return MessageCircle;
      default: return Bell;
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full transition-colors"
        aria-label={`You have ${unreadCount} unread notifications`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-gray-900/50 border border-white/10 rounded-xl shadow-2xl z-50 backdrop-blur-lg"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-heading">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors" aria-label="Close notifications"><X className="w-5 h-5" /></button>
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1 font-mono">
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-body">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <button
                      type="button"
                      key={notification.id}
                      className={`w-full text-left p-4 border-b border-white/10 hover:bg-gray-800/40 transition-colors ${!notification.isRead ? 'bg-blue-500/10' : ''}`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800/50 text-gray-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 mb-1 font-body">{notification.text}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-mono truncate">{notification.teacherEmail || notification.studentEmail}</p>
                            <div className="flex items-center text-xs text-gray-500 font-mono flex-shrink-0 ml-2">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimeAgo(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" aria-label="Unread notification"></div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;