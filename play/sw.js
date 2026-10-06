const CACHE_NAME = 'city-life-v6';
// (src/suin-words.js is ~260 KB and only loads when you first open a classmate chat, so it isn't
// downloaded up front — it gets cached the first time it's used.)
const ASSETS = [
    './', './index.html', './style.css', './manifest.json',
    './src/data.js', './src/state.js', './src/world.js', './src/homelife.js', './src/events.js',
    './src/minigames.js', './src/travel.js', './src/store.js', './src/seasons.js', './src/gifts.js',
    './src/school.js', './src/suin-brain.js', './src/chat.js', './src/core.js', './src/main.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first: always serve the freshest version when online, so updates
// show up immediately for returning visitors. Falls back to cache only when offline.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
