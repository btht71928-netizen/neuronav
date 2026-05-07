const CACHE = 'neuronav-v5';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // 即時有効化（古いSWを待たず新しいSWに切り替え）
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// アプリから「今すぐ更新」ボタンを押した時のメッセージも受け付ける
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ナビゲーションはネットワーク優先（常に最新のindex.htmlを取得）
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
    );
  }
});
