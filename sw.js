const CACHE = 'neuronav-v3';
const ASSETS = ['./index.html', './manifest.json'];

// インストール時：キャッシュを保存するが自動でskipWaitingしない
// → アプリ側からメッセージを受けた時だけ更新する（ユーザー操作で更新）
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // self.skipWaiting() は呼ばない → waitingになりアプリ側で検知できるようにする
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// アプリから「今すぐ更新」ボタンを押した時にメッセージを受信してskipWaiting
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ネットワーク優先→キャッシュフォールバック（常に最新を取得しようとする）
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    // ページ遷移はネットワーク優先でキャッシュ更新
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
