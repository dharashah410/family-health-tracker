const CACHE = 'family-health-v6';
const ASSETS = ['/', '/index.html', '/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  // Don't block SW activation on cache failures — a failed fetch during install
  // would leave the SW stuck in "installing" state, causing .ready to hang forever.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(err => console.warn('[sw] Cache install failed (non-fatal):', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});

// ─── Push notifications ────────────────────────────────────────────────────

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Family Health';
  const body  = data.body  || 'Reminder';
  const tag   = data.tag   || data.reminderId || 'reminder';

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon:   '/icons/favicon.svg',
      badge:  '/icons/favicon.svg',
      vibrate: [100, 50, 100],
      data:   { reminderId: data.reminderId, url: data.url || null },
      actions: [
        { action: 'snooze15',  title: '⏱ 15 min' },
        { action: 'snooze60',  title: '⏰ 1 hour' },
        { action: 'snoozeTmr', title: '🌅 Tomorrow' },
      ],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const reminderId = e.notification.data?.reminderId;

  if (e.action === 'snooze15' || e.action === 'snooze60' || e.action === 'snoozeTmr') {
    const minutes = e.action === 'snooze15' ? 15 : e.action === 'snooze60' ? 60 : 60 * 16;
    e.waitUntil(
      fetch('/api/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, minutes }),
      })
    );
    return;
  }

  // If notification carries a URL (e.g. WhatsApp grocery link), open it directly
  const openUrl = e.notification.data?.url;
  if (openUrl) {
    e.waitUntil(clients.openWindow(openUrl));
    return;
  }

  // Default — open/focus the app
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});
