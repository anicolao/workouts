import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('US-001: User signs in', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Authentication', 'Verify user can sign in.');

    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Mock Google Auth & Drive Discovery
    await page.addInitScript(() => {
        (window as any).google = {
            accounts: {
                oauth2: {
                    initTokenClient: (c: any) => ({ requestAccessToken: () => c.callback({ access_token: 'mock-token' }) }),
                    revoke: (token: string, cb: any) => cb()
                }
            }
        };
    });

    // Generic Google Drive & Sheets Mocks
    await mockDriveAPI(page);

    // Block real Google Identity script to prevent overwriting mocks
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    await page.goto('/');
    // Dump content if debug not found
    if (!await page.getByTestId('debug-load').isVisible()) {
        console.log('PAGE CONTENT:', await page.content());
    }

    await expect(page.getByTestId('debug-load')).toBeVisible({ timeout: 30000 });
    await tester.step('initial-load', {
        description: 'User sees sign in button',
        verifications: [
            { spec: 'Sign In button visible', check: async () => await expect(page.getByText('Sign In with Google')).toBeVisible() }
        ]
    });

    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    await page.getByText('Sign In with Google').click();

    // Verify authenticated state
    await expect(page.locator('img[alt="Synced"]')).toBeVisible();

    await tester.step('authenticated', {
        description: 'User is signed in',
        verifications: [
            { spec: 'Food Log title visible', check: async () => await expect(page.locator('.feed-header h2')).toHaveText('Today') },
            { spec: 'Log Food link visible', check: async () => await expect(page.getByLabel('Log new food entry')).toBeVisible() },
            { spec: 'Settings link visible', check: async () => await expect(page.locator('.mobile-nav a[href*="/settings"]').first()).toBeVisible() }
        ]
    });

    // Go to settings to sign out
    await page.locator('.mobile-nav a[href*="/settings"]').first().click();
    await page.getByText('Sign Out').first().click();
    await page.waitForURL('**/'); // Wait for navigation to home

    await tester.step('signed-out', {
        description: 'User signs out',
        verifications: [
            { spec: 'Sign In button visible', check: async () => await expect(page.getByText('Sign In with Google')).toBeVisible() }
        ]
    });

    tester.generateDocs();
});
