import { createContext, useState, ReactNode, FC, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => number;
  showError: (message: string, duration?: number) => number;
  showWarning: (message: string, duration?: number) => number;
  showInfo: (message: string, duration?: number) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationItem: FC<{
  notification: ToastNotification;
  onRemove: (id: number) => void;
}> = ({ notification, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = icons[notification.type] || Info;

  return (
    <div className={`border rounded-lg p-4 mb-2 ${colors[notification.type]} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider: FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  let notificationIdCounter = 0;

  const addNotification = (
    message: string,
    type: NotificationType = 'info',
    duration = 5000
  ): number => {
    notificationIdCounter += 1;
    const id = Date.now() + notificationIdCounter;
    const notification: ToastNotification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }

    return id;
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const contextValue: NotificationContextType = {
    showSuccess: (msg, duration) => addNotification(msg, 'success', duration),
    showError: (msg, duration) => addNotification(msg, 'error', duration),
    showWarning: (msg, duration) => addNotification(msg, 'warning', duration),
    showInfo: (msg, duration) => addNotification(msg, 'info', duration),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// ✅ Hook to access notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};

export const useNotification = useNotificationContext;
