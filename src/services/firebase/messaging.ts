import {
  getToken,
  onMessage,
  deleteToken,
  type MessagePayload
} from 'firebase/messaging';
import { initializeMessaging, vapidKey } from './config';
import { type FCMTokenData, type NotificationPayload, NotificationType } from '../../types/notification.types';
import api from "../api.ts";

class MessagingService {
  private messaging: any = null;
  private currentToken: string | null = null;
  private messageListeners: ((payload: NotificationPayload) => void)[] = [];
  private tokenRefreshListeners: ((token: string) => void)[] = [];

  async initialize(): Promise<boolean> {
    try {
      this.messaging = await initializeMessaging();
      if (!this.messaging) {
        console.warn('Firebase Messaging is not supported in this browser');
        return false;
      }

      // Setup foreground message listener
      onMessage(this.messaging, (payload: MessagePayload) => {
        console.log('Foreground message received:', payload);
        this.handleForegroundMessage(payload);
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied' as NotificationPermission;
      }

      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      return permission as NotificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  }

  async getRegistrationToken(userId: string): Promise<string | null> {
    try {
      if (!this.messaging) {
        await this.initialize();
      }

      if (!this.messaging) {
        throw new Error('Messaging not initialized');
      }

      // Check if service worker is available
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      const token = await getToken(this.messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Registration token:', token);
        this.currentToken = token;

        // Send token to backend
        await this.sendTokenToServer(token, userId);

        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Failed to get registration token:', error);
      return null;
    }
  }

  async refreshToken(userId: string): Promise<string | null> {
    try {
      // Delete current token
      if (this.currentToken) {
        await this.deleteCurrentToken();
      }

      // Get new token
      const newToken = await this.getRegistrationToken(userId);

      if (newToken) {
        // Notify listeners about token refresh
        this.tokenRefreshListeners.forEach(listener => listener(newToken));
      }

      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  async deleteCurrentToken(): Promise<boolean> {
    try {
      if (!this.messaging || !this.currentToken) {
        return true;
      }

      await deleteToken(this.messaging);

      // Remove token from server
      await this.removeTokenFromServer(this.currentToken);

      this.currentToken = null;
      console.log('Token deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete token:', error);
      return false;
    }
  }

  private async sendTokenToServer(token: string, userId: string): Promise<void> {
    try {
      const tokenData: FCMTokenData = {
        token,
        userId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        }
      };

      const response = await api.post('/notification-service/api/v1/fcm-tokens', tokenData);

      console.log('Token sent to server successfully', response.data);
    } catch (error) {
      console.error('Failed to send token to server:', error);
      throw error;
    }
  }

  private async removeTokenFromServer(token: string): Promise<void> {
    try {
      const response = await api.post('/api/fcm/unregister', { token });
      console.log('Token removed from server successfully', response.data);
    } catch (error) {
      console.error('Failed to remove token from server:', error);
    }
  }

  private handleForegroundMessage(payload: MessagePayload): void {
    const notification: NotificationPayload = {
      id: payload.messageId || Date.now().toString(),
      title: payload.notification?.title || 'New Message',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon,
      image: payload.notification?.image,
      link: payload.fcmOptions?.link,
      data: payload.data,
      timestamp: Date.now(),
      read: false,
      type: this.getNotificationType(payload.data?.type)
    };

    // Notify all listeners
    this.messageListeners.forEach(listener => listener(notification));

    // Store in local storage for history
    this.storeNotification(notification);
  }

  private getNotificationType(type?: string): NotificationType {
    switch (type) {
      case 'success': return NotificationType.SUCCESS;
      case 'warning': return NotificationType.WARNING;
      case 'error': return NotificationType.ERROR;
      case 'social': return NotificationType.SOCIAL;
      case 'system': return NotificationType.SYSTEM;
      default: return NotificationType.INFO;
    }
  }

  private storeNotification(notification: NotificationPayload): void {
    try {
      const stored = localStorage.getItem('fcm_notifications');
      const notifications: NotificationPayload[] = stored ? JSON.parse(stored) : [];

      notifications.unshift(notification);

      // Keep only last 50 notifications
      const trimmed = notifications.slice(0, 50);

      localStorage.setItem('fcm_notifications', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  private getAuthToken(): string | null {
    // Get auth token from your auth context/service
    return localStorage.getItem('auth_token');
  }

  // Public methods for listeners
  onMessage(callback: (payload: NotificationPayload) => void): () => void {
    this.messageListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    this.tokenRefreshListeners.push(callback);

    return () => {
      const index = this.tokenRefreshListeners.indexOf(callback);
      if (index > -1) {
        this.tokenRefreshListeners.splice(index, 1);
      }
    };
  }

  getStoredNotifications(): NotificationPayload[] {
    try {
      const stored = localStorage.getItem('fcm_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  markNotificationAsRead(notificationId: string): void {
    try {
      const stored = localStorage.getItem('fcm_notifications');
      if (!stored) return;

      const notifications: NotificationPayload[] = JSON.parse(stored);
      const notification = notifications.find(n => n.id === notificationId);

      if (notification) {
        notification.read = true;
        localStorage.setItem('fcm_notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  clearAllNotifications(): void {
    localStorage.removeItem('fcm_notifications');
  }
}

// Singleton instance
export const messagingService = new MessagingService();