# Photos Cache Design

## Objective
Enable offline access and improve performance for photos loaded from Google Drive by implementing a caching strategy in the Service Worker.

## Problem
Currently, the service worker explicitly ignores all requests to `googleapis.com`.
```typescript
// IGNORE requests for Google APIs
if (e.request.url.includes('googleapis.com')) return;
```
This means every time a user views a log entry, the application fetches the image from Google Drive even if it hasn't changed. This wastes bandwidth, slows down the UI, and renders images broken when the user is offline.

## Proposed Design

### 1. Service Worker Strategy
We will modify `src/service-worker.ts` to intercept requests targeting the Google Drive get-file endpoint with `alt=media`.

**Target URL Pattern:**
`https://www.googleapis.com/drive/v3/files/{fileId}?alt=media`

**Cache Strategy:** Cache First / Cache Only (for immutable content)
Since the user stated photos "never change", we can treat them as immutable.
1. Check specific `photos` cache.
2. If found -> Return cached response.
3. If not found -> Fetch from network, cache response, return response.
4. If network fails -> Return offline placeholder (or fail if matched by `resolveDriveImage` error handling).

### 2. Implementation Details

#### Unique Cache Name
Use a separate cache bucket (e.g., `photos-v1`) to decouple photo persistence from the application build version (`cache-v{version}`). This ensures that deploying a new version of the app (which clears `cache-vX`) does not wipe the gigabytes of cached user photos.

#### Handling Authorization
The requests to Google Drive include an `Authorization: Bearer ...` header. The Cache API uses the request URL as the key.
- We must ensure we don't accidentally serve a "403 Forbidden" or "401 Unauthorized" response from the cache if one was captured.
- We should only cache 200 OK responses.

#### Code Changes (`src/service-worker.ts`)

1. Define `PHOTOS_CACHE_NAME = 'photos-v1'`.
2. Add a `whiteListedGoogleApis` check before the generic ignore rule.
```typescript
const isDrivePhoto = e.request.url.includes('googleapis.com/drive/v3/files') && e.request.url.includes('alt=media');

if (e.request.url.includes('googleapis.com') && !isDrivePhoto) return;
```
3. Implement the handler for `isDrivePhoto` inside the `respond` function or as a separate branch.

```typescript
if (isDrivePhoto) {
    const cache = await caches.open(PHOTOS_CACHE_NAME);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    
    try {
        const network = await fetch(e.request);
        if (network.ok) {
            cache.put(e.request, network.clone());
        }
        return network;
    } catch (err) {
        // Return nothing or custom offline image?
        // resolveDriveImage handles failures, so throwing/returning offline response is fine.
        throw err;
    }
}
```

### 3. Lifecycle Management
- **Pruning**: Since photos are immutable, the cache effectively grows forever. We may need a Least Recently Used (LRU) expiration policy in the future, but for now, we will rely on browser eviction (quota management) as this is likely "good enough" for the initial version.
- **Versioning**: If we change the logic, we can bump `photos-v1` to `photos-v2`.

## Verification Plan
1. **Online Load**: Verify images load and are added to Cache Storage (inspect DevTools > Application > Cache Storage).
2. **Offline Load**: Switch Network to "Offline" in DevTools. Verify images still load from cache.
3. **Performance**: Verify second load does not trigger network request.
