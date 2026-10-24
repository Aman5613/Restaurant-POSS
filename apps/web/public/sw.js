// Restaurant POS Service Worker for Web Push & Background Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_e) {
      payload = { title: 'Restaurant Alert', body: event.data.text() };
    }
  }

  const title = payload.title || '🍽️ Restaurant POS Alert';
  const options = {
    body: payload.body || 'Operational notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || `alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: payload.vibrate || [500, 200, 500, 200, 500],
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open POS' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
