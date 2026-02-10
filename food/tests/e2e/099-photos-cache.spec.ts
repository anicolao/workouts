import { test, expect } from './fixtures';

test.describe('Photos Cache', () => {
    test.use({ serviceWorkers: 'allow' });

    test('should cache Google Drive photos for offline access', async ({ page, context }) => {
        // 1. Mock minimal Auth & Discovery to allow app to boot
        await page.route('**googleapis.com/oauth2/v3/userinfo**', async route => {
            await route.fulfill({
                json: { name: 'Test User', email: 'test@example.com', picture: 'http://localhost/mock.png' }
            });
        });
        await page.route('**/drive/v3/files?q=*appProperties*', async route => {
            await route.fulfill({ json: { files: [] } });
        });

        // 2. Define the target photo
        const photoId = 'solid-test-photo-id';
        const photoUrl = `https://www.googleapis.com/drive/v3/files/${photoId}?alt=media`;

        // 3. Setup Network Interception for the Photo (Context Level to catch SW)
        // Use simple glob to ensure matching
        await context.route(`**/files/${photoId}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'image/jpeg',
                body: Buffer.from('fake-image-data'),
                headers: {
                    'access-control-allow-origin': '*',
                    'cache-control': 'public, max-age=31536000'
                }
            });
        });

        // 4. Load App
        await page.goto('/');

        // 5. Wait for SW Activation
        await page.evaluate(async () => {
            // Wait for controller
            if (!navigator.serviceWorker.controller) {
                await new Promise(resolve => {
                    navigator.serviceWorker.addEventListener('controllerchange', resolve);
                });
            }
            // Ensure ready
            await navigator.serviceWorker.ready;
        });

        // 6. Trigger Fetch (Online)
        // We use fetch directly to ensure we hit the SW interception logic
        await page.evaluate(async (url) => {
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) throw new Error('Online Fetch Failed: ' + res.status);
            await res.blob();
        }, photoUrl);

        // 7. Verify Entry in Cache Storage
        const isCached = await page.evaluate(async (url) => {
            const cacheName = 'photos-v1';
            const cache = await caches.open(cacheName);
            const match = await cache.match(url);
            return !!match;
        }, photoUrl);

        expect(isCached, 'Photo should be present in photos-v1 cache').toBe(true);

        // 8. Go Offline
        await context.setOffline(true);

        // 9. Trigger Fetch (Offline) - Should succeed via Cache
        await page.evaluate(async (url) => {
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) throw new Error('Offline Fetch Failed: ' + res.status);
            const blob = await res.blob();
            if (blob.size === 0) throw new Error('Offline Blob is empty');
        }, photoUrl);
    });
});
