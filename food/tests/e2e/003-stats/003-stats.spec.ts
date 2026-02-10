import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('US-012: Stats persist after reload', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Stats', 'Verify stats load from history.');
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    // Fix Clock to 2024-03-15 12:00 Local
    await page.clock.install({ time: new Date('2024-03-15T12:00:00') });

    // Mock Auth
    await page.addInitScript(() => {
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

    // Mock Sheets fetching existing events AND Drive Discovery
    // Mock Drive Discovery (Robust)
    await mockDriveAPI(page);

    // Mock Sheets fetching existing events explicitly
    await page.route('**googleapis.com**', async route => {
        const url = route.request().url();

        if (url.includes('sheets.googleapis.com') && url.includes('values/Events')) {
            await route.fulfill({
                json: {
                    values: [
                        // Row 1: Confirmed Entry (No Header)
                        ['uuid-1', '2024-03-15', 'log/entryConfirmed', JSON.stringify({
                            entry: {
                                id: '1',
                                date: '2024-03-15', // Matches fixed clock
                                time: '12:00',
                                description: 'Mock Apple',
                                calories: 500,
                                protein: 20,
                                fat: 10,
                                carbs: 50,
                                mealType: 'Lunch'
                            }
                        })]
                    ]
                }
            });
        } else {
            await route.fallback();
        }
    });

    await page.goto('/');
    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    await page.getByText('Sign In with Google').click();

    await expect(page.locator('img[alt="Synced"]')).toBeVisible();

    await tester.step('stats-loaded', {
        description: 'Stats loaded from sheet',
        verifications: [
            { spec: 'Calories = 500', check: async () => await expect(page.locator('.hero-ring .value-text').first()).toHaveText('500') },
            // Bubble value format is now "Value/Max" e.g. "20/180" inside the bubble.
            { spec: 'Protein = 20', check: async () => await expect(page.locator('.bubble-value').first()).toHaveText('20/150') },
            { spec: 'History shows entry', check: async () => await expect(page.getByText('Mock Apple')).toBeVisible() }
        ]
    });

    tester.generateDocs();
});
