// Generic service worker for browser push (chat messages, order updates).
// Push display and click-through only — no offline caching.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New notification", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "New notification", {
      body: payload.body || "",
      icon: payload.icon || "/favicon.ico",
      badge: payload.icon || "/favicon.ico",
      tag: payload.tag || undefined,
      renotify: Boolean(payload.tag),
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
