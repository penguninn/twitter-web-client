importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDeyqa42wBRfioKTvTKLLaI9w-mORdwU3I',
  authDomain: 'twitter-fcm-2e5e2.firebaseapp.com',
  projectId: 'twitter-fcm-2e5e2',
  storageBucket: 'twitter-fcm-2e5e2.firebasestorage.app',
  messagingSenderId: '871541732343',
  appId: '1:871541732343:web:67c4faff68acf764ceb4f2'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || 'You have a new message',
        icon: payload.notification?.icon || '/firebase-logo.png',
        badge: payload.notification?.badge || '/badge-icon.png',
        image: payload.notification?.image,
        data: {
            ...payload.data,
            click_action: payload.fcmOptions?.link || '/',
            messageId: payload.messageId,
        },
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: '/open-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/dismiss-icon.png'
            }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'general'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received:', event);

    event.notification.close();

    const clickAction = event.notification.data?.click_action || '/';
    const messageId = event.notification.data?.messageId;

    if (event.action === 'dismiss') {
        // Just close the notification
        return;
    }

    // Handle notification click
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Try to focus existing window
            for (let client of clientList) {
                if (client.url.includes(clickAction) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Open new window if no existing window found
            if (clients.openWindow) {
                const url = new URL(clickAction, self.location.origin).href;
                return clients.openWindow(url);
            }
        })
    );

    // Mark notification as clicked (send to analytics)
    if (messageId) {
        fetch(`${self.location.origin}/api/notifications/${messageId}/clicked`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch(err => console.log('Failed to track notification click:', err));
    }
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
    console.log('[firebase-messaging-sw.js] Notification closed:', event);

    const messageId = event.notification.data?.messageId;
    if (messageId) {
        // Track notification dismissal
        fetch(`${self.location.origin}/api/notifications/${messageId}/dismissed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch(err => console.log('Failed to track notification dismissal:', err));
    }
});