import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';
import * as fs from 'fs';

test('US-018 to US-022: Details, Edit and Delete', async ({ page }, testInfo) => {
    test.slow(); // Increase timeout for complex interactions
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Edit/Delete', 'Verifying details page, edit and delete.');

    // Promise Gate for Gemini
    let resolveGemini: () => void = () => { };
    const geminiPromise = new Promise<void>(r => { resolveGemini = r; });

    // Mock Auth & Clock
    // 12:00 PM EDT = 16:00 PM UTC
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
    // Block real GSI aggressively
    await page.route('**/gsi/client', route => route.abort());

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
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // Basic Service Mock
    await mockDriveAPI(page);
    await page.route(/drive\.mock/, async route => {
        const buffer = fs.readFileSync('tests/e2e/fixtures/apple.png');
        await route.fulfill({ body: buffer, contentType: 'image/png' });
    });

    // FORCE Fixture File Timestamp to match Mocked Clock
    const mockDate = new Date('2024-03-15T16:00:00Z');
    fs.utimesSync('tests/e2e/fixtures/apple.png', mockDate, mockDate);

    // Mock Gemini
    await page.route('**generativelanguage.googleapis.com**', async route => {
        await geminiPromise;
        // Original Food Logic
        await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: JSON.stringify({ is_label: false, item_name: 'Original Food', calories: 100, fat: { total: 10 }, carbohydrates: { total: 10 }, protein: 10 }) }] } }] } });
    });

    await page.goto('/');
    // Allow polling to initialize tokenClient
    await page.waitForFunction(() => (window as any)._authReady);
    await page.waitForTimeout(1000);
    await page.getByText('Sign In with Google').click();

    // 1. Create Entry
    await page.getByLabel('Log new food entry').first().click();
    await expect(page).toHaveURL(/\/log/);
    await expect(page.getByText('Camera').first()).toBeVisible();
    await page.locator('input[type="file"]:not([capture])').first().setInputFiles([
        'tests/e2e/fixtures/apple.png',
        'tests/e2e/fixtures/apple.png'
    ]);
    await expect(page.getByText('Analyzing 2 images with Gemini...')).toBeVisible();
    resolveGemini();

    await expect(async () => {
        const val = await page.getByLabel('Log Description').first().inputValue();
        expect(val === 'Original Food').toBeTruthy();
    }).toPass();
    await page.getByLabel('Date').fill('2024-03-15', { force: true });
    await page.getByLabel('Time').fill('12:00', { force: true }); // Explicit time to match expect
    await page.getByText('Save Entry').click();

    // 2. Verify on Home
    // 2. Verify on Home
    // ActivityCard shows "Lunch" (based on 12:00 PM), verified expanded by default
    await expect(page.locator('.activity-card').first()).toBeVisible();

    await expect(page.locator('.item-name').filter({ hasText: 'Original Food' }).first()).toBeVisible();

    // Stats check: 100
    await expect(page.locator('.hero-ring').getByText('100', { exact: true })).toBeVisible();

    // 3. Go to Details
    await page.getByText('Original Food').first().click();

    await tester.step('details-view', {
        description: 'Details page loaded',
        verifications: [
            { spec: 'Name field populated', check: async () => await expect(page.getByLabel('Item Name').first()).toHaveValue('Original Food') },
            { spec: 'Cals field populated', check: async () => await expect(page.getByLabel('Calories').first()).toHaveValue('100') },
            { spec: 'Multiple images shown', check: async () => await expect(page.locator('.hero-image').first()).toBeVisible() },
            {
                spec: 'Carousel scrolls on click',
                check: async () => {
                    const gallery = page.locator('.gallery');
                    const initialScroll = await gallery.evaluate(el => el.scrollLeft);
                    const box = await gallery.boundingBox();
                    if (box) {
                        // Click on the right side (80% width)
                        await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
                        // Wait for scroll
                        await page.waitForFunction((init) => {
                            const params = init as unknown as number; // Cast via unknown
                            return document.querySelector('.gallery')!.scrollLeft > params;
                        }, initialScroll);
                        const newScroll = await gallery.evaluate(el => el.scrollLeft);
                        expect(newScroll).toBeGreaterThan(initialScroll);
                    }
                }
            }
        ]
    });

    // 4. Edit
    await page.getByLabel('Item Name').fill('Edited Food');
    await page.getByLabel('Calories').fill('200');
    // Save
    await page.getByText('Save Changes').click();

    await tester.step('edited-state', {
        description: 'Returned to Home after edit',
        verifications: [
            // Expanded by default
            { spec: 'Name updated in list', check: async () => await expect(page.locator('.item-name').filter({ hasText: 'Edited Food' }).first()).toBeVisible() },
            { spec: 'Calories updated in list', check: async () => await expect(page.locator('.item-cal').filter({ hasText: '200' }).first()).toBeVisible() },
            { spec: 'Total Calories updated', check: async () => await expect(page.locator('.hero-ring .value-text').first()).toContainText('200') }
        ]
    });

    // 5. Delete
    await page.getByText('Edited Food').first().click();

    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.getByText('Delete').click();

    await tester.step('deleted-state', {
        description: 'Returned to Home after delete',
        verifications: [
            { spec: 'Entry removed', check: async () => await expect(page.getByText('Edited Food')).not.toBeVisible() },
            { spec: 'Total Calories reset', check: async () => await expect(page.locator('.value-text').first()).toContainText('0') }
        ]
    });

    tester.generateDocs();
});
