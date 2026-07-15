var CACHE='calcviaje-base-v1.0.0';
var FILES=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){
    return cache.addAll(FILES);
  }));
  self.skipWaiting();
});

self.addEventListener('activate',function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){
      return key !== CACHE;
    }).map(function(key){
      return caches.delete(key);
    }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(event){
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).then(function(response){
        var copy = response.clone();
        caches.open(CACHE).then(function(cache){
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});