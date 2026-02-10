import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';
import * as fs from 'fs';
import * as path from 'path';

test('US-013 to US-017: Smart Date Formatting', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Smart Dates', 'Verifying date formatting rules.');

    // Promise Gate for Gemini
    let resolveGemini: () => void;
    // Re-initialize for each sub-test/iteration if needed, or just one if only called once?
    // 004 calls logItem 3 times! We need a way to reset it.
    // Actually, logItem does the interaction. We should create a new promise for each call?
    // Or just a queue?
    // Let's make it a queue or a resettable gate.
    // Simplest: expose a function to reset it.

    let geminiGate: Promise<void> = Promise.resolve();
    let releaseGemini: () => void = () => { };

    const resetGate = () => {
        geminiGate = new Promise(r => { releaseGemini = r; });
    };
    resetGate();

    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERR: ${err}`));

    // Block real GSI aggressively
    await page.route('**/gsi/client', route => route.abort());

    // Mock Auth & Unregister SW
    // 12:00 PM EDT = 16:00 PM UTC
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
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

    // Mock Drive/Photos/Sheets (via helper)
    await mockDriveAPI(page);

    // Specific Mock for Gemini (not in helper)
    await page.route('**generativelanguage.googleapis.com**', async route => {
        await geminiGate;
        await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: JSON.stringify({ is_label: false, item_name: 'Test Food', calories: 100, fat: { total: 0 }, carbohydrates: { total: 0 }, protein: 0 }) }] } }] } });
    });

    // Mock Drive Image Download explicitly if needed (mockDriveAPI handles lh3...)
    // 004 uses local fixture upload.
    await page.route(/drive\.mock/, async route => {
        const buffer = fs.readFileSync('tests/e2e/fixtures/apple.png');
        await route.fulfill({ body: buffer, contentType: 'image/png' });
    });

    await page.goto('/');
    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    await page.waitForTimeout(1000);
    await page.getByText('Sign In with Google').click();

    // Helper to log an item with specific date
    // Note: Creating a log redirects to TODAY.
    async function logItem(date: string, time: string, name: string) {
        await page.getByLabel('Log new food entry').first().click();
        await expect(page).toHaveURL(/\/log/);
        await expect(page.getByText('Camera').first()).toBeVisible();
        const fileInput = page.locator('input[type="file"]:not([capture])');
        await fileInput.setInputFiles('tests/e2e/fixtures/apple.png');
        await expect(page.getByText('Analyzing 1 images with Gemini...')).toBeVisible();
        releaseGemini(); // Release the mock

        await expect(async () => {
            const val = await page.getByLabel('Log Description').first().inputValue();
            expect(val === 'Test Food').toBeTruthy();
        }).toPass();

        await page.getByLabel('Log Description').first().fill(name);
        await page.getByLabel('Date').first().fill(date);
        await page.getByLabel('Time').first().fill(time);
        await page.getByText('Save Entry').first().click();

        // Wait for feed to load (it loads TODAY by default)
        await expect(page.locator('.feed-header h2').first()).toHaveText('Today');
        // Reset gate for next run
        resetGate();
    }

    // 1. Log Today's Item (2024-03-15)
    await logItem('2024-03-15', '12:00', 'Today Food');

    // 2. Log Yesterday's Item (2024-03-14)
    await logItem('2024-03-14', '12:00', 'Yesterday Food');

    // 3. Log Last Monday's Item (2024-03-11)
    await logItem('2024-03-11', '12:00', 'Monday Food');

    // --- Verification ---

    // 1. Verify Today (Should only see 'Today Food')
    await expect(page.locator('[data-status="synced"]')).toBeVisible();
    await tester.step('check-today', {
        description: 'Verify Today View',
        verifications: [
            { spec: 'Header says Today', check: async () => await expect(page.locator('.feed-header h2').first()).toHaveText('Today') },
            { spec: 'Today Food visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Today Food' })).toBeVisible() },
            { spec: 'Yesterday Food NOT visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Yesterday Food' })).not.toBeVisible() },
            { spec: 'Monday Food NOT visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Monday Food' })).not.toBeVisible() }
        ]
    });

    // 2. Navigate to Yesterday (2024-03-14)
    await page.locator('.nav-btn.prev').first().click();
    await expect(page.locator('.feed-header h2').first()).toHaveText('Yesterday');
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('check-yesterday', {
        description: 'Verify Yesterday View',
        verifications: [
            { spec: 'Header says Yesterday', check: async () => await expect(page.locator('.feed-header h2').first()).toHaveText('Yesterday') },
            { spec: 'Yesterday Food visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Yesterday Food' })).toBeVisible() },
            { spec: 'Today Food NOT visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Today Food' })).not.toBeVisible() }
        ]
    });

    // 3. Navigate to Last Monday (2024-03-11)
    // We are at 14th. Need 11th. 3 more clicks.
    for (let i = 0; i < 3; i++) {
        await page.locator('.nav-btn.prev').first().click();
    }
    // Monday 11th should show "Mon, Mar 11"
    await expect(page.locator('.feed-header h2').first()).toHaveText('Mon, Mar 11');
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('check-monday', {
        description: 'Verify Monday View',
        verifications: [
            { spec: 'Header says Mon, Mar 11', check: async () => await expect(page.locator('.feed-header h2').first()).toHaveText('Mon, Mar 11') },
            { spec: 'Monday Food visible', check: async () => await expect(page.locator('.activity-card').filter({ hasText: 'Monday Food' })).toBeVisible() }
        ]
    });

    tester.generateDocs();
});
