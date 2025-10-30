self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const APP_BRAND_NAME = 'PlayCourt';
const GENERIC_NOTIFICATION_MESSAGE = `Tienes una nueva notificación en ${APP_BRAND_NAME}.`;

function getNotificationPayload(event) {
  if (!event.data) {
    return {
      title: APP_BRAND_NAME,
      body: GENERIC_NOTIFICATION_MESSAGE,
      data: {},
    };
  }

  try {
    const parsed = event.data.json();
    return parsed;
  } catch (error) {
    return {
      title: APP_BRAND_NAME,
      body: event.data.text(),
      data: {},
    };
  }
}

self.addEventListener('push', (event) => {
  const payload = getNotificationPayload(event);
  const title = payload.title || APP_BRAND_NAME;
  const options = {
    body: payload.body || GENERIC_NOTIFICATION_MESSAGE,
    icon: payload.icon || './assets/club-logo.png',
    badge: payload.badge || './assets/club-logo.png',
    data: payload.data || {},
    tag: payload.tag || 'cn-playa-san-marcos-notification',
    renotify: Boolean(payload.renotify),
  };

  if (Array.isArray(payload.actions)) {
    options.actions = payload.actions;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (!client.url) continue;
          const normalizedUrl = new URL(client.url, self.location.origin);
          if (normalizedUrl.pathname.startsWith('/app/')) {
            if ('focus' in client) {
              client.focus();
            }
            if (targetUrl && normalizedUrl.href !== new URL(targetUrl, self.location.origin).href && 'navigate' in client) {
              return client.navigate(targetUrl);
            }
            return undefined;
          }
        }
        if (targetUrl) {
          return self.clients.openWindow(targetUrl);
        }
        return self.clients.openWindow('/app/');
      })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // When the subscription changes we just clear it so the app can resubscribe on next sync.
  event.waitUntil(Promise.resolve());
});
