import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('US-023: Auth Persistence', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Auth Persistence', 'Verifying session survives reload.');

    // Mock Clock for Expiry Check (Start at T0)
    // 12:00 PM EDT = 16:00 PM UTC
    const T0 = new Date('2024-03-15T16:00:00Z');
    await page.clock.install({ time: T0 });

    // Block real GSI aggressively
    await page.route('**/gsi/client', route => route.abort());

    // Mock Google Script
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
                    initTokenClient: (c: any) => ({
                        requestAccessToken: () => c.callback({
                            access_token: 'mock-persistent-token',
                            expires_in: 3600 // 1 hour
                        })
                    })
                }
            }
        };
    });
    // Block real GSI
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // Mock Services (Minimal)
    await mockDriveAPI(page);

    await page.goto('/');
    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    await page.waitForTimeout(1000);
    await page.getByText('Sign In with Google').click();
    await expect(page.locator('.mobile-nav a').filter({ hasText: 'Settings' }).first()).toBeVisible();

    await tester.step('persisted', {
        description: 'Reload page and verify session',
        verifications: [
            {
                spec: 'Token in localStorage',
                check: async () => {
                    const token = await page.evaluate(() => localStorage.getItem('food_log_access_token'));
                    expect(token).toBe('mock-persistent-token');
                }
            },
            {
                spec: 'User still logged in after reload',
                check: async () => {
                    await page.reload();
                    await expect(page.locator('.mobile-nav a').filter({ hasText: 'Settings' }).first()).toBeVisible();
                    // Should NOT see "Sign In" button
                    await expect(page.getByText('Sign In with Google')).not.toBeVisible();
                }
            }
        ]
    });

    // Test Silent Recovery (< 48h)
    await tester.step('silent_recovery', {
        description: 'Simulate token expiration within 48h window',
        verifications: [
            {
                spec: 'Silent refresh keeps user logged in',
                check: async () => {
                    // Update stored expiry to be in the past (expired 1s ago)
                    await page.evaluate(() => {
                        localStorage.setItem('food_log_token_expiry', (Date.now() - 1000).toString());
                    });

                    await page.reload();
                    // Should attempt silent refresh and SUCCEED because of mocked Google client
                    await expect(page.locator('.mobile-nav a').filter({ hasText: 'Settings' }).first()).toBeVisible();
                    await expect(page.getByText('Sign In with Google')).not.toBeVisible();
                }
            }
        ]
    });

    // Test Hard Expiry (> 48h)
    await tester.step('hard_expiry', {
        description: 'Simulate token expiration beyond 48h window',
        verifications: [
            {
                spec: 'Logged out after 48h expiry',
                check: async () => {
                    // Update stored expiry to be > 48h in the past
                    await page.evaluate(() => {
                        const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
                        localStorage.setItem('food_log_token_expiry', (Date.now() - FORTY_EIGHT_HOURS_MS - 10000).toString());
                    });

                    await page.reload();
                    await expect(page.getByText('Sign In with Google')).toBeVisible();
                }
            }
        ]
    });

    tester.generateDocs();
});
