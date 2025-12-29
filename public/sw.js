const CACHE_NAME = 'blueice-driver-v1';
const OFFLINE_URL = '/deliveries';

// Essential assets to cache on install
const PRECACHE_ASSETS = ['/', '/deliveries', '/manifest.json'];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }),
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (we'll handle them separately)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache successful API responses for offline fallback
          if (response.ok && request.url.includes('/api/orders')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Return cached API response if offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving cached API response:', request.url);
              return cachedResponse;
            }
            // Return offline JSON response
            return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        }),
    );
    return;
  }

  // For navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Serve from cache or offline page
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      }),
    );
    return;
  }

  // For other requests (CSS, JS, images)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }

      // Fetch from network and cache
      return fetch(request).then((response) => {
        // Clone for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }),
  );
});

// Background sync for pending deliveries
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-deliveries') {
    event.waitUntil(syncPendingDeliveries());
  }

  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocationUpdates());
  }
});

// Sync pending delivery completions
async function syncPendingDeliveries() {
  console.log('[SW] Syncing pending deliveries...');

  try {
    // Open IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-deliveries', 'readonly');
    const store = tx.objectStore('pending-deliveries');
    const pendingDeliveries = await store.getAll();

    console.log('[SW] Found pending deliveries:', pendingDeliveries.length);

    for (const delivery of pendingDeliveries) {
      try {
        const response = await fetch('/api/orders/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(delivery.data),
        });

        if (response.ok) {
          // Remove from pending queue
          const deleteTx = db.transaction('pending-deliveries', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending-deliveries');
          await deleteStore.delete(delivery.id);
          console.log('[SW] Synced delivery:', delivery.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync delivery:', delivery.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Re-throw to retry later
  }
}

// Sync location updates
async function syncLocationUpdates() {
  console.log('[SW] Syncing location updates...');

  try {
    const db = await openDB();
    const tx = db.transaction('location-queue', 'readonly');
    const store = tx.objectStore('location-queue');
    const locations = await store.getAll();

    for (const location of locations) {
      try {
        const response = await fetch('/api/drivers/me/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(location.data),
        });

        if (response.ok) {
          const deleteTx = db.transaction('location-queue', 'readwrite');
          const deleteStore = deleteTx.objectStore('location-queue');
          await deleteStore.delete(location.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync location:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Location sync failed:', error);
  }
}

// Helper to open IndexedDB from service worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blueice-driver', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pending-deliveries')) {
        db.createObjectStore('pending-deliveries', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('location-queue')) {
        db.createObjectStore('location-queue', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('todays-orders')) {
        db.createObjectStore('todays-orders', { keyPath: 'id' });
      }
    };
  });
}

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Blue Ice';
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data || '/deliveries';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if already open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
