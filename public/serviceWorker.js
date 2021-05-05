// start the install
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open("static").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/index.js",
        "/manifest.webmanifest",
        "./icons/icon-192x192.png",
        "./icons/icon-512x512.png/",
      ]);
    })
  );

  // activate this service worker immediately upon install
  self.skipWaiting();
});

// fetch
self.addEventListener("fetch", function (evt) {
  //cache successful requests to API
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches
        .open("data")
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }
  // if the request is not for the API, serve static assets using "offline-first" approach.
  evt.respondWith(
    caches.match(evt.request).then(function (response) {
      return response || fetch(evt.request);
    })
  );
});
