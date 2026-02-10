
import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('US-023: Date Navigation', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Date Nav', 'Verify date navigation and Filtering');

    // Mock Auth & Clock
    // "Today" is March 15th, 12:00 PM
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
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
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // Mock Data: 
    // 1. Entry Today (March 15)
    // 2. Entry Yesterday (March 14)
    await mockDriveAPI(page);
    await page.route('**googleapis.com**', async route => {
        const url = route.request().url();
        if (url.includes('values/Events')) {
            await route.fulfill({
                json: {
                    values: [
                        ['HeaderID', 'Time', 'Type', 'Payload'],
                        // Today: March 15
                        ['uuid-1', '2024-03-15', 'log/entryConfirmed', JSON.stringify({
                            entry: {
                                id: '1', date: '2024-03-15', time: '12:00',
                                description: 'Today Food', calories: 500, mealType: 'Lunch'
                            }
                        })],
                        // Yesterday: March 14
                        ['uuid-2', '2024-03-14', 'log/entryConfirmed', JSON.stringify({
                            entry: {
                                id: '2', date: '2024-03-14', time: '18:00',
                                description: 'Yesterday Food', calories: 300, mealType: 'Dinner'
                            }
                        })]
                    ]
                }
            });
        } else if (url.includes('drive/v3/files')) {
            // Standard file mocks
            await route.fallback();
        } else if (url.includes('userinfo')) {
            await route.fulfill({
                json: { name: 'Test User', picture: '' }
            });
        } else {
            await route.fulfill({ json: {} });
        }
    });

    await page.goto('/');
    await page.waitForFunction(() => (window as any)._authReady);
    await page.getByText('Sign In with Google').click();

    await tester.step('view-today', {
        description: 'Default view is Today',
        verifications: [
            { spec: 'Header says Today', check: async () => await expect(page.locator('.feed-header h2:not([inert])')).toHaveText('Today') },
            { spec: 'Next button disabled', check: async () => await expect(page.locator('.nav-btn.next')).toBeDisabled() },
            { spec: 'Today food visible', check: async () => await expect(page.getByText('Today Food')).toBeVisible() },
            { spec: 'Yesterday food NOT visible', check: async () => await expect(page.getByText('Yesterday Food')).not.toBeVisible() },
            { spec: 'Total Cals = 500', check: async () => await expect(page.locator('.hero-ring .value-text').first()).toHaveText('500') }
        ]
    });

    // Go to Yesterday
    await page.locator('.nav-btn.prev').click();

    await tester.step('view-yesterday', {
        description: 'Navigated to Yesterday',
        verifications: [
            { spec: 'Header says Yesterday', check: async () => await expect(page.locator('.feed-header h2:not([inert])')).toHaveText('Yesterday') },
            { spec: 'Next button enabled', check: async () => await expect(page.locator('.nav-btn.next')).toBeEnabled() },
            { spec: 'Yesterday food visible', check: async () => await expect(page.getByText('Yesterday Food')).toBeVisible() },
            { spec: 'Today food NOT visible', check: async () => await expect(page.getByText('Today Food')).not.toBeVisible() },
            { spec: 'Total Cals = 300', check: async () => await expect(page.locator('.hero-ring .value-text').first()).toHaveText('300') }
        ]
    });

    // Go back to Today
    await page.locator('.nav-btn.next').click();

    await tester.step('return-today', {
        description: 'Navigated back to Today',
        verifications: [
            { spec: 'Header says Today', check: async () => await expect(page.locator('.feed-header h2:not([inert])')).toHaveText('Today') },
            { spec: 'Total Cals restored', check: async () => await expect(page.locator('.hero-ring .value-text').first()).toHaveText('500') }
        ]
    });

    tester.generateDocs();
});
