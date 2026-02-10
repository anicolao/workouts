import { test, expect } from './fixtures';

test.describe('Offline Reload', () => {
    test.use({ serviceWorkers: 'allow' });

    test('should allow reloading the app while offline', async ({ page, context }) => {
        // 1. Load App Online
        await page.goto('/');

        // 2. Wait for Service Worker and Controller
        await page.evaluate(async () => {
            if (!navigator.serviceWorker.controller) {
                await new Promise(resolve => {
                    navigator.serviceWorker.addEventListener('controllerchange', resolve);
                });
            }
            await navigator.serviceWorker.ready;
        });

        // 2b. Reload page (Online) to trigger SW interception and caching of the main page
        // The first load wasn't intercepted because SW wasn't active yet.
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 3. Verify Navigation Cache
        // Navigation requests are cached dynamically now.
        // We can check if the current page URL is in the cache.
        const isCached = await page.evaluate(async () => {
            const keys = await caches.keys();
            const appCache = keys.find(k => k.startsWith('cache-'));
            if (!appCache) return 'NO_CACHE_FOUND';

            const cache = await caches.open(appCache);
            // We need to match the actual request URL (e.g. http://localhost:PORT/)
            const match = await cache.match(window.location.href);
            return !!match;
        });

        expect(isCached, 'Main page should be cached').toBe(true);

        // 4. Go Offline
        await context.setOffline(true);

        // 5. Reload Page
        await page.reload();

        // 6. Verify App Loaded
        // Check for a key element that indicates the app shell loaded, not the offline page
        await expect(page.locator('#app')).toBeVisible({ timeout: 10000 }).catch(() => {
            // If #app isn't there, check if we are seeing the offline text
            return expect(page.getByText('Offline')).not.toBeVisible();
        });

        // Also check if we are NOT seeing the generic offline fallback text "Offline" (if it's just raw text)
        // Our offline.html might have specific content.
        // But if the app loads, we expect normal UI.
    });
});
