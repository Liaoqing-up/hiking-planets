const CACHE_NAME = "hikerplanets-v5.3.0-little-prince";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 云端同源网关 (/sb/*) 与 AI 边缘接口 (/api/*) 一律直通网络，禁止 Service Worker 拦截或写缓存
  if (url.pathname.startsWith("/sb/") || url.pathname.startsWith("/api/")) return;

  // 所有静态资源与首页 HTML：全面采用「Stale-While-Revalidate (有本地缓存 0ms 瞬回 + 后台静默更新)」！
  // 彻底消灭之前先等 3.5 秒网络超时再回退缓存的卡死问题！
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req, { ignoreSearch: url.pathname === "/" || url.pathname.endsWith("/index.html") }).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);

        // 只要缓存命中，0 毫秒立即返回给浏览器渲染！后台悄悄拉取新版写入缓存
        return cached || fetchPromise;
      })
    )
  );
});
