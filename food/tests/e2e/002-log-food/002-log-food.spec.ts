import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';
import * as fs from 'fs';
import * as path from 'path';

test('US-003 to US-010: User logs food flow', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Logging', 'User logs a meal.');

    // Promise Gate for Gemini
    let resolveGemini: () => void = () => { };
    const geminiPromise = new Promise<void>(r => { resolveGemini = r; });

    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    // Mock Auth & Services
    // Mock Auth & Services
    // Use UTC to ensure it maps to 12:00 PM EDT (UTC-4) in the browser
    // 12:00 PM EDT = 16:00 PM UTC
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
    // Disable animations for stability and speed
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Block real GSI aggressively
    await page.route('**/gsi/client', route => route.abort());

    await page.addInitScript(async () => {
        // Unregister any polluting Service Workers from localhost
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

    // Stateful Mock for Sheets
    const events: any[] = [];

    // Mock Drive Images
    await mockDriveAPI(page);
    await page.route(/drive\.mock/, async route => {
        const buffer = fs.readFileSync('tests/e2e/fixtures/apple.png');
        await route.fulfill({ body: buffer, contentType: 'image/png' });
    });

    // FORCE Fixture File Timestamp to match Mocked Clock (UTC-4 logic handled by browser, but fs uses system time)
    const mockDate = new Date('2024-03-15T16:00:00Z');
    fs.utimesSync('tests/e2e/fixtures/apple.png', mockDate, mockDate);

    // Mock Sheets for Event Capture
    await page.route('**sheets.googleapis.com**', async route => {
        const url = route.request().url();
        if (url.includes('append')) {
            // Capture append
            const postData = route.request().postDataJSON();
            if (postData && postData.values && postData.values[0]) {
                events.push(postData.values[0]);
            }
            await route.fulfill({ json: { updates: { updatedRange: 'A1' } } });
        } else if (url.includes('values/Events')) {
            // Return events
            await route.fulfill({ json: { values: events } });
        } else {
            // Fallback to mockDriveAPI or default
            await route.fallback();
        }
    });

    // Mock Gemini
    await page.route('**generativelanguage.googleapis.com**', async route => {
        // Wait for test to signal readiness (Analyzing UI visible)
        await geminiPromise;
        await route.fulfill({
            json: {
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                is_label: true,
                                item_name: 'Mock Apple',
                                calories: 95,
                                fat: { total: 0 },
                                carbohydrates: { total: 25 },
                                protein: 0
                            })
                        }]
                    }
                }]
            }
        });
    });

    await page.goto('/');
    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    const signInBtn = page.getByText('Sign In with Google');
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Wait for Dashboard to stabilize (Auth confirmed)
    await expect(page.locator('.feed-header h2').first()).toHaveText('Today');

    const logBtn = page.getByLabel('Log new food entry').first();
    await expect(logBtn).toBeVisible();
    await expect(logBtn).toBeEnabled();

    await logBtn.click();
    await expect(page).toHaveURL(/\/log/, { timeout: 2000 });

    // Mandatory URL Wait for stability
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Log Food' })).toBeVisible({ timeout: 2000 });

    await tester.step('log-page', {
        description: 'User on log page',
        verifications: [
            { spec: 'Camera button visible', check: async () => await expect(page.getByText('Camera').first()).toBeVisible({ timeout: 2000 }) },
            { spec: 'Upload button visible', check: async () => await expect(page.getByText('Library').first()).toBeVisible({ timeout: 2000 }) },
            { spec: 'Voice button visible', check: async () => await expect(page.getByText('Voice').first()).toBeVisible({ timeout: 2000 }) },
            { spec: 'Text button visible', check: async () => await expect(page.getByText('Text').first()).toBeVisible({ timeout: 2000 }) }
        ]
    });

    // Upload File
    const fileInput = page.locator('input[type="file"]:not([capture])');
    await fileInput.setInputFiles('tests/e2e/fixtures/apple.png');

    await tester.step('preview', {
        description: 'Image preview shown',
        verifications: [
            { spec: 'Preview visible', check: async () => await expect(page.locator('.sheet-thumb')).toBeVisible() },
            { spec: 'Status is Analyzing', check: async () => await expect(page.getByText('Analyzing 1 images with Gemini...')).toBeVisible({ timeout: 10000 }) }
        ]
    });

    // Release Mock
    resolveGemini();

    // Wait for Gemini Mock
    await expect(page.getByLabel('Log Description')).toHaveValue('Mock Apple');

    // Ensure nutrition form icons are loaded (User reported flake)
    await expect(page.locator('.icon-toggle')).toBeVisible();

    await tester.step('analysis', {
        description: 'AI Analysis Received',
        verifications: [
            { spec: 'Calories populated', check: async () => await expect(page.getByLabel('Calories')).toHaveValue('95') }
        ]
    });

    // Verify default value (Time might dictate Breakfast/Lunch based on file mod time)
    // We force set to Lunch to ensure downstream assertions pass deterministically
    // We ALSO force set the Date to match our mocked "Today" (2024-03-15) because the image EXIF might change it.
    await page.getByLabel('Date').fill('2024-03-15', { force: true });
    await page.getByLabel('Meal').selectOption('Lunch');
    await expect(page.getByLabel('Meal')).toHaveValue('Lunch');

    // Edit to 100
    await page.getByLabel('Calories').fill('100');

    await tester.step('edited', {
        description: 'User corrects analysis',
        verifications: [
            { spec: 'Calories updated to 100', check: async () => await expect(page.getByLabel('Calories')).toHaveValue('100') },
            { spec: 'Meal type is Lunch', check: async () => await expect(page.getByLabel('Meal')).toHaveValue('Lunch') }
        ]
    });

    // Save
    await page.getByText('Save Entry').first().click();

    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    await tester.step('saved', {
        description: 'Returned to Dashboard',
        verifications: [
            { spec: 'On Dashboard', check: async () => await expect(page.locator('.feed-header h2').first()).toHaveText('Today') },

            // 1. Verify Activity Card exists (Group)
            { spec: 'Activity Card appears', check: async () => await expect(page.locator('.activity-card').first()).toBeVisible() },
            { spec: 'Meal type shown in header', check: async () => await expect(page.locator('.activity-card h3').first()).toHaveText('Lunch') },
            { spec: 'Total Cals shown in header', check: async () => await expect(page.locator('.total-cals').first()).toContainText('100') },

            // 2. Verify Detail Item (Already expanded)
            { spec: 'Item name shown', check: async () => await expect(page.locator('.item-name').first()).toHaveText('Mock Apple') },
            { spec: 'Item calories shown', check: async () => await expect(page.locator('.item-cal').first()).toHaveText('100 kcal') }
        ]
    });

    tester.generateDocs();
});
