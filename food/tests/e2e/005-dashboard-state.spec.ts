import { test, expect } from './fixtures';
import { TestStepHelper } from './helpers/test-step-helper';
import { mockDriveAPI } from './helpers/mock-drive';

test('US-014: Dashboard State Persistence', async ({ page }, testInfo) => {
    test.slow(); // Increase timeout for CI/Load
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Dashboard', 'Verifying URL state for date and cards.');

    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

    // await page.emulateMedia({ reducedMotion: 'reduce' });

    // Install Clock to ensure deterministic dates (12:00 PM Local)
    // Using a fixed date avoids "Previous Day" crossing boundaries or timezone issues
    const MOCK_DATE = '2024-06-15T16:00:00Z'; // 12:00 PM EST (UTC-4)
    await page.clock.install({ time: new Date(MOCK_DATE) });

    const today = '2024-06-15';
    const yesterday = '2024-06-14';

    await page.addInitScript(async () => {
        if (navigator.serviceWorker) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        (window as any).google = {
            accounts: {
                oauth2: {
                    initTokenClient: (c: any) => ({ requestAccessToken: () => c.callback({ access_token: 'mock' }) }),
                    revoke: (token: string, cb: any) => cb()
                }
            }
        };
    });

    // Block real Google Identity script to prevent overwriting mocks
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // Robust Google API Mocks
    await mockDriveAPI(page);
    await page.route('**googleapis.com**', async route => {
        const url = route.request().url();

        if (url.includes('drive/v3/files')) {
            await route.fallback();
        } else if (url.includes('sheets.googleapis.com')) {
            if (url.includes('values/Events')) {
                const mockEntry = {
                    id: 'entry-1',
                    date: today,
                    time: '12:00',
                    mealType: 'Lunch',
                    description: 'Mock Salad',
                    calories: 500,
                    protein: 20,
                    fat: 10,
                    carbs: 50,
                    rawJson: {}
                };
                await route.fulfill({
                    json: {
                        values: [
                            ['ev-1', `${today}T12:00:00Z`, 'log/entryConfirmed', JSON.stringify({ entry: mockEntry })]
                        ]
                    }
                });
            } else {
                await route.fulfill({ json: {} });
            }
        } else {
            await route.continue();
        }
    });

    await page.goto('/');

    // Ensure app loaded (matches 001-auth behavior)
    if (!await page.getByTestId('debug-load').isVisible()) {
        console.log('PAGE CONTENT:', await page.content());
    }
    await expect(page.getByTestId('debug-load')).toBeVisible({ timeout: 30000 });

    // Sign In
    await page.waitForFunction(() => (window as any)._authReady);
    await page.getByText('Sign In with Google').click();
    await expect(page.locator('.feed-header h2')).toBeVisible({ timeout: 10000 });

    // 1. Verify Default State
    // Wait for sync to populate data to avoid screenshot mismatch (empty vs populated)
    await expect(page.locator('.activity-card').first()).toBeVisible();
    // Wait for network to settle to Synced to avoid icon animation frame diffs
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('initial-load', {
        description: 'Dashboard loads today',
        verifications: [
            { spec: 'Title is Today', check: async () => await expect(page.locator('.feed-header h2').first()).toHaveText('Today') },
            // URL should NOT have date param by default
            { spec: 'URL has no date param', check: async () => expect(page.url()).not.toContain('date=') },
            // "Log New" removed
            { spec: 'Log New link is gone', check: async () => await expect(page.getByText('Log New')).not.toBeVisible() }
        ]
    });

    // 2. Navigate Next/Prev
    const prevBtn = page.locator('button[aria-label="Previous Day"]');
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    await expect(page.locator('.feed-header h2').first()).toHaveText('Yesterday'); // Explicit wait
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('prev-day', {
        description: 'Navigate to Yesterday',
        verifications: [
            { spec: 'URL has date param', check: async () => expect(page.url()).toContain(`date=${yesterday}`) }
        ]
    });

    // 3. Deep Link Reload
    await page.reload();
    // Wait for hydration/render before screenshotting
    await expect(page.locator('.feed-header h2').first()).toBeVisible();
    await expect(page.locator('[data-status="synced"]')).toBeVisible();
    await tester.step('reload', {
        description: 'Reload preserves date',
        verifications: [
            { spec: 'URL still has date', check: async () => expect(page.url()).toContain(`date=${yesterday}`) }
        ]
    });

    // 4. Navigate Forward
    await page.locator('button[aria-label="Next Day"]').click();
    await expect(page.locator('.feed-header h2').first()).toHaveText('Today');
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('next-day', {
        description: 'Return to Today',
        verifications: [
            { spec: 'URL date updated', check: async () => expect(page.url()).toContain(`date=${today}`) }
        ]
    });

    // 5. Card Collapse State - Using simpler verification to avoid flaky visual checks
    await tester.step('card-collapse', {
        description: 'Toggle card collapse state',
        verifications: [
            {
                spec: 'Toggle adds param', check: async () => {
                    // Ensure we are on a page with a card (Today has 'entry-1')
                    // We just navigated back to Today in previous step
                    await expect(page.locator('.activity-card')).toBeVisible();
                    await page.locator('.activity-card .header-btn').first().click();
                    await expect(page.url()).toContain('collapsed=');
                }
            }
        ]
    });

    await page.reload();
    await expect(page.locator('.activity-card')).toBeVisible(); // Ensure content rerendered
    await expect(page.locator('[data-status="synced"]')).toBeVisible();
    await tester.step('reload-collapse', {
        description: 'Reload preserves collapse state',
        verifications: [
            { spec: 'URL still has collapsed', check: async () => await expect(page.url()).toContain('collapsed=') }
        ]
    });
});
