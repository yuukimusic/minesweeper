/* Purple Mine ∞ — オフライン用 Service Worker
   更新したら VERSION の日付を変えること。古いキャッシュは自動で消える。 */
var VERSION = '2026-11-21b';
var CACHE   = 'mugen-kodo-' + VERSION;
var ASSETS  = ['./', './index.html', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  // すぐには切り替えない。ページ側が「更新」を押すまで待機する
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});

/* 端末内のコピーを即返しつつ、裏で新しいものを取りに行く */
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
