self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open('pose-app-cache').then((cache) => {
        return cache.addAll([
          './',
          './index.html',
          './sketch3.js', // your p5.js code
          './icon192.png',
          './icon512.png'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (e) => {
    e.respondWith(
      caches.match(e.request).then((response) => response || fetch(e.request))
    );
  });
  