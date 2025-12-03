// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch handler to meet PWA requirements
  // You can add caching logic here if needed
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    return;
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.data?.conversationId ? `chat-${data.data.conversationId}` : 'notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus().then(() => {
            // Navigate to the specific conversation if possible
            if (urlToOpen && client.navigate) {
              return client.navigate(urlToOpen);
            }
            return client;
          });
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('Resubscribed to push notifications:', subscription);
        // You might want to send this new subscription to your server
      })
  );
});
