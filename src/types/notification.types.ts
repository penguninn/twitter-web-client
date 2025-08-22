export interface FCMMessage {
  messageId: string;
  data?: Record<string, string>;
  notification?: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    badge?: string;
  };
  fcmOptions?: {
    link?: string;
    analyticsLabel?: string;
  };
  from?: string;
  collapseKey?: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  link?: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  type: NotificationType;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SOCIAL = 'social',
  SYSTEM = 'system',
}

export enum NotificationPermission {
  GRANTED = 'granted',
  DENIED = 'denied',
  DEFAULT = 'default',
}

export interface NotificationSettings {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  sound: boolean;
  vibration: boolean;
}

export interface FCMTokenData {
  token: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    timestamp: number;
  };
}