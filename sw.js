const CACHE_NAME = 'cloudinary-video-pwa-v2';
const APP_VERSION = '2.0.0';

// Core assets for offline functionality
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/cloudinary-video-player@1.9.5/dist/cld-video-player.min.css',
  'https://unpkg.com/cloudinary-core@2.13.0/cloudinary-core-shrinkwrap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle video requests differently
  if (event.request.url.match(/\.(mp4|webm|m3u8|mpd)(\?.*)?$/i) || 
      event.request.url.includes('cloudinary.com/video')) {
    // For video files, use network only (don't cache)
    event.respondWith(fetch(event.request));
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses (except videos)
        if (response.ok && !response.url.match(/\.(mp4|webm|m3u8|mpd)(\?.*)?$/i)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache and is HTML request, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./');
            }
            
            // Otherwise return error
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-video-data') {
    console.log('Background sync triggered');
    event.waitUntil(syncVideoData());
  }
});

async function syncVideoData() {
  // Implement background sync logic here
  console.log('Syncing video data in background...');
}

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New video available!',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iMTAiIGZpbGw9IiM0RjQ2RTUiLz4KPHBhdGggZD0iTTM2IDIwQzI3LjIgMjAgMjAgMjcuMiAyMCAzNkMyMCA0NC44IDI3LjIgNTIgMzYgNTJDNDQuOCA1MiA1MiA0NC44IDUyIDM2QzUyIDI3LjIgNDQuOCAyMCAzNiAyMFpNMzYgNDhDMzEuMiA0OCAyNy4yIDQ0IDI3LjIgNDBDMjcuMiAzNiAzMS4yIDMyIDM2IDMyQzQyIDMyIDQ4IDM2IDQ4IDQwQzQ4IDQ0IDQyIDQ4IDM2IDQ4WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTY0IDM2SDU0LjA0QzU0LjA0IDI3LjIgNDYuOCAyMCAzNiAyMEMyNS4yIDIwIDE4IDI3LjIgMTggMzZIMEMwIDI3LjIgMTQuNCAxMiAzNiAxMkM1Ny42IDEyIDY0IDI3LjIgNjQgMzZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMTIiIGZpbGw9IiNGRjQ0NDQiLz4KPHBhdGggZD0iTTQ4IDI0QzM0LjggMjQgMjQgMzQuOCAyNCA0OEMyNCA2MS4yIDM0LjggNzIgNDggNzJDNjEuMiA3MiA3MiA2MS4yIDcyIDQ4QzcyIDM0LjggNjEuMiAyNCA0OCAyNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Cloudinary Video Player', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === './' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

// Periodic sync registration
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('update-content', {
    minInterval: 24 * 60 * 60 * 1000 // 24 hours
  }).catch(error => {
    console.log('Periodic sync registration failed:', error);
  });
}