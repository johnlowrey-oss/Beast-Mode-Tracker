// Beast Hub Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Beast Hub Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Beast Hub Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a prep reminder!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      mealId: data.mealId
    },
    actions: [
      { action: 'view', title: 'View Prep Tasks' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'prep-reminder',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Beast Hub Prep Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
