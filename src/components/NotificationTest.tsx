import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationTest: React.FC = () => {
  const {
    permission,
    requestPermission,
    token,
    requestToken,
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearMessages,
    isLoading,
    error
  } = useNotification();

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Firebase Cloud Messaging Test</h2>
      
      <div className="space-y-4">
        <div>
          <p><strong>Permission:</strong> {permission}</p>
          <p><strong>Token:</strong> {token ? 'Generated' : 'None'}</p>
          <p><strong>Unread Count:</strong> {unreadCount}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Request Permission
          </button>

          <button
            onClick={requestToken}
            disabled={isLoading || permission !== 'granted'}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Get FCM Token
          </button>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Mark All Read
          </button>

          <button
            onClick={clearMessages}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear All Messages
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto">
          <h3 className="font-semibold">Messages:</h3>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 border rounded mb-2 ${
                message.read ? 'bg-gray-100' : 'bg-blue-50'
              }`}
            >
              <p className="font-medium">{message.title}</p>
              <p className="text-sm">{message.body}</p>
              <p className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleString()}
              </p>
              {!message.read && (
                <button
                  onClick={() => markAsRead(message.id)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-1"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {token && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p className="text-xs"><strong>FCM Token:</strong></p>
          <p className="text-xs break-all">{token}</p>
        </div>
      )}
    </div>
  );
};