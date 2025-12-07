const CACHE_NAME = 'cloudinary-video-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://unpkg.com/cloudinary-video-player@1.9.5/dist/cld-video-player.min.css',
    'https://unpkg.com/cloudinary-video-player@1.9.5/dist/cld-video-player.min.js',
    'https://unpkg.com/cloudinary-core@2.13.0/cloudinary-core-shrinkwrap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // For video requests, don't cache, just fetch
                if (event.request.url.includes('.mp4') || 
                    event.request.url.includes('.webm') ||
                    event.request.url.includes('cloudinary.com')) {
                    return fetch(event.request);
                }
                
                // For HTML pages, return cached page
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            })
    );
});