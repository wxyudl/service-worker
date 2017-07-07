let oldETagObj = {};
let CACHED_ASSETS = [];

/*!
 * Files which need to add to cache and check modified.
 */
const REQUIRED_DEPENDENCIES = [
    '/test/service_worker/index.html',
    '/test/service_worker/app.js',
    '/test/service_worker/sw.js',
    '/test/service_worker/download.png',
];

/*!
 * This is the message event handler. It receives commands from the client (for
 * example, to clean up cache sizes, add add cache files or observe files modefied).
 */
this.addEventListener('message', function (event) {
    if (event.data === 'observe') {
        let allCachedAssets = CACHED_ASSETS.concat(REQUIRED_DEPENDENCIES);
        for (let file of allCachedAssets) {
            fetchRequest(new Request(file)).then(res => {
                oldETagObj[file] !== res.headers.get("ETag") ?
                    (oldETagObj[file] = res.headers.get("ETag")) &&
                    event.ports[0].postMessage('res') :
                    '';
            });
        }
    } else {
        // Cache new requests from client
        for (file of event.data) {
            fetchRequest(new Request(file));
        }
    }
});

/*!
 * This is the installation handler. It runs when the worker is first installed.
 */
this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            return cache.addAll(REQUIRED_DEPENDENCIES);
        })
        .catch(err => {

        })
    );
});

/*!
 * This is the fetch handler. It runs upon every request. It both serves
 * requests from the cache and adds requests to the cache.
 */
this.addEventListener('fetch', function (event) {
    event.respondWith(
        matchRequest(event.request).catch(function () {
            console.info(`Request ${event.request.url} not in cache.`);
            return fetchRequest(event.request)
        })
    );
});

/*!
 * This is the activation handler. It runs after the worker is installed.
 * It handles the deletion of expired caches.
 */
this.addEventListener('activate', event => {
    // event.waitUntil(
    //     caches.keys()
    //     .then(keys => {
    //         const expired = keys.filter(isCacheExpired);
    //         const deletions = expired.map(key => caches.delete(key));
    //         return Promise.all(deletions);
    //     })
    //     .catch(err => {;
    //     })
    //     .then(clients.claim())
    // );
});


/*!
 * Get a response from the cache.
 */
function matchRequest(req) {
    return caches.match(req).then(res => {
        return res || Promise.reject(
            `matchRequest: could not match ${req.url}`
        );
    });
}

/*!
 * Get a response from the network, and also cache it.
 */
function fetchRequest(req) {
    return fetch(req).then(res => {
        if (res.ok) {
            const clone = res.clone();

            caches.open('v1').then(cache => {
                console.info(`Added ${req.url} to cache.`);
                cache.put(req, clone);

                CACHED_ASSETS.push(req.url);
                CACHED_ASSETS = CACHED_ASSETS.filter(function(value, index, self){
                    return self.indexOf(value) === index;
                });
            });
        }

        return res;
    });
}