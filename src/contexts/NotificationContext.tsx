import {
  type NotificationPayload,
  type NotificationPermission,
  type NotificationSettings,
  NotificationType,
} from "../types/notification.types.ts";
import {createContext, useEffect, useContext} from "react";
import {useState, type ReactNode} from "react";
import {useAuth} from "../hooks/useAuth.ts";
import {useFirebaseMessaging, useForegroundMessages, useNotificationPermission} from "../hooks/useFirebaseMessaging.ts";
import toast from 'react-hot-toast';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  isSupported: boolean;
  isInitialized: boolean;

  token: string | null;
  requestToken: () => Promise<string | null>;
  refreshToken: () => Promise<string | null>;
  deleteToken: () => Promise<void>;

  messages: NotificationPayload[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearMessages: () => void;

  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  isLoading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultSettings: NotificationSettings = {
  enabled: true,
  types: {
    [NotificationType.INFO]: true,
    [NotificationType.SUCCESS]: true,
    [NotificationType.WARNING]: true,
    [NotificationType.ERROR]: true,
    [NotificationType.SOCIAL]: true,
    [NotificationType.SYSTEM]: true
  },
  sound: true,
  vibration: true
}

interface NotificationProviderProps {
  children: ReactNode;
}

// Helper function to show toast notifications
const showToastNotification = (notification: NotificationPayload) => {
  const toastOptions = {
    duration: 5000,
    position: 'top-right' as const,
  };

  switch (notification.type) {
    case NotificationType.SUCCESS:
      toast.success(`${notification.title}: ${notification.body}`, toastOptions);
      break;
    case NotificationType.ERROR:
      toast.error(`${notification.title}: ${notification.body}`, toastOptions);
      break;
    case NotificationType.WARNING:
      toast(`${notification.title}: ${notification.body}`, {
        ...toastOptions,
        icon: '⚠️',
      });
      break;
    default:
      toast(`${notification.title}: ${notification.body}`, toastOptions);
  }
};

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const { permission, isSupported, requestPermission: requestNotificationPermission } = useNotificationPermission();

  const {
    isInitialized,
    token,
    error,
    isLoading,
    requestPermissionAndToken,
    refreshToken: refreshFCMToken,
    deleteToken: deleteFCMToken,
  } = useFirebaseMessaging(user?.sub);

  const {
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useForegroundMessages();

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const storedSettings = localStorage.getItem('notificationSettings');
    return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  });

  // Auto-request permission for authenticated users
  useEffect(() => {
    if (user && isInitialized && permission === 'default' && settings.enabled) {
      const shouldAutoRequest = localStorage.getItem('notification_auto_request') !== 'false';
      if (shouldAutoRequest) {
        requestPermissionAndToken();
      }
    }
  }, [user, isInitialized, permission, settings.enabled, requestPermissionAndToken]);

  // Show toast notifications for new messages
  useEffect(() => {
    if (!settings.enabled) return;

    if (messages.length > 0) {
      const latestMessage = messages[0];
      if (latestMessage && !latestMessage.read) {
        if (settings.types[latestMessage.type]) {
          showToastNotification(latestMessage);
        }
      }
    }
  }, [messages, settings]);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const requestToken = async () => {
    return await requestPermissionAndToken();
  };

  const refreshToken = async () => {
    return await refreshFCMToken();
  };

  const deleteToken = async () => {
    await deleteFCMToken();
  };

  const value: NotificationContextType = {
    permission,
    requestPermission: requestNotificationPermission,
    isSupported,
    isInitialized,
    token,
    requestToken,
    refreshToken,
    deleteToken,
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearMessages: clearAll,
    settings,
    updateSettings,
    isLoading,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};