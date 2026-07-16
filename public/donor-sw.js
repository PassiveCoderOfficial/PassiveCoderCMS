// Service worker for donor urgent-request web push.
// Kept deliberately minimal — it only handles push display and click-through,
// no offline caching (the site is server-rendered).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Urgent blood request", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Urgent blood request", {
      body: payload.body || "",
      icon: "/blood-favicon.png",
      badge: "/blood-favicon.png",
      tag: payload.requestId ? `req-${payload.requestId}` : "blood-request",
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: payload.url || "/donors/requests" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/donors/requests";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Focus an already-open tab if we have one, else open a new one.
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
