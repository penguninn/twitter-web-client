import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../services/firebase/messaging';
import {type NotificationPayload, NotificationPermission } from '../types/notification.types';

export const useFirebaseMessaging = (userId?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize messaging service
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        setIsLoading(true);
        const initialized = await messagingService.initialize();
        setIsInitialized(initialized);

        // Check current permission
        if ('Notification' in window) {
          setPermission(Notification.permission as NotificationPermission);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize messaging');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMessaging();
  }, []);

  // Request permission and get token
  const requestPermissionAndToken = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request permission
      const newPermission = await messagingService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        // Get registration token
        const newToken = await messagingService.getRegistrationToken(userId);
        setToken(newToken);
        return newToken;
      } else {
        setError('Notification permission denied');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get permission and token';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newToken = await messagingService.refreshToken(userId);
      setToken(newToken);
      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh token';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Delete token
  const deleteToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await messagingService.deleteCurrentToken();
      if (success) {
        setToken(null);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete token';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isInitialized,
    permission,
    token,
    error,
    isLoading,
    requestPermissionAndToken,
    refreshToken,
    deleteToken,
  };
};

export const useForegroundMessages = () => {
  const [messages, setMessages] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to foreground messages
    const unsubscribe = messagingService.onMessage((payload) => {
      setMessages(prev => [payload, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Load stored notifications on mount
    const storedNotifications = messagingService.getStoredNotifications();
    setMessages(storedNotifications);
    setUnreadCount(storedNotifications.filter(n => !n.read).length);

    return unsubscribe;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    messagingService.markNotificationAsRead(notificationId);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === notificationId ? { ...msg, read: true } : msg
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadMessages = messages.filter(msg => !msg.read);
    unreadMessages.forEach(msg => {
      messagingService.markNotificationAsRead(msg.id);
    });

    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    setUnreadCount(0);
  }, [messages]);

  const clearAll = useCallback(() => {
    messagingService.clearAllNotifications();
    setMessages([]);
    setUnreadCount(0);
  }, []);

  return {
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};

export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Notifications not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, [isSupported]);

  return {
    permission,
    isSupported,
    requestPermission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
  };
};