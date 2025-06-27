const CACHE_NAME = "healthai-v1";
  const urlsToCache = [
    "/",
    "/index.html",
    "/manifest.json",
    "/icons/icon-192x192.svg",
    "/icons/icon-512x512.svg"
  ];

  // Dynamic asset patterns to cache
  const assetPatterns = [
    /\/assets\/index-.*\.js$/,
    /\/assets\/index-.*\.css$/,
    /\/assets\/.*\.(js|css|woff|woff2|ttf|eot)$/
  ];

  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache);
      })
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cache);
              return caches.delete(cache);
            }
          })
        )
      )
    );
  });

  self.addEventListener("fetch", (event) => {
    // Skip API requests and external resources
    if (event.request.url.includes("http://localhost:8000") || 
        event.request.url.includes("firebase") ||
        event.request.url.includes("gpteng.co")) {
      console.log("Service Worker: Skipping external request", event.request.url);
      event.respondWith(fetch(event.request));
      return;
    }

    // Check if request matches dynamic asset patterns
    const url = new URL(event.request.url);
    const shouldCache = assetPatterns.some(pattern => pattern.test(url.pathname));

    // Cache-first strategy for cached resources
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log("Service Worker: Serving from cache", event.request.url);
          return response;
        }
        console.log("Service Worker: Fetching from network", event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // Cache the new response if it's a GET request and matches our patterns
          if (event.request.method === "GET" && (shouldCache || urlsToCache.includes(url.pathname))) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
      }).catch((error) => {
        console.error("Service Worker: Fetch failed", error);
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw error;
      })
    );
  });