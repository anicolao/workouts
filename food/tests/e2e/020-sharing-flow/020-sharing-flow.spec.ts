import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('Sharing Flow', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Sharing Flow', 'US-20: Users can view shared logs in read-only mode.');

    // Mock API
    await mockDriveAPI(page);

    // Setup Specific Mock Data for Sharing
    const SHARED_FOLDER_ID = 'SHARED_FOLDER_123';
    const SHARED_DB_ID = 'SHARED_DB_456';

    // Custom Route Handler for Shared Folder Discovery
    await page.route(`**/drive/v3/files?q=*${SHARED_FOLDER_ID}*`, async route => {
        // Mock finding the DB inside the shared folder
        await route.fulfill({
            json: {
                files: [{
                    id: SHARED_DB_ID,
                    name: 'Food Log Data',
                    modifiedTime: '2024-01-01T12:00:00Z',
                    appProperties: { type: 'food_tracker_db' }
                }]
            }
        });
    });

    // Mock Data for the Shared DB
    await page.route(`**/*${SHARED_DB_ID}/values/Events*`, async route => {
        if (route.request().method() === 'GET') {
            const events = [
                { eventId: '1', type: 'log/entryConfirmed', timestamp: '2024-01-01T12:00:00Z', payload: { entry: { id: 'e1', date: '2024-01-01', time: '12:00', description: 'Shared Pasta', calories: 500, protein: 20, carbs: 80, fat: 10, mealType: 'Lunch' } } }
            ];

            // Return Sheets API format
            await route.fulfill({
                json: {
                    values: events.map(e => [e.eventId, e.timestamp, e.type, JSON.stringify(e.payload)])
                }
            });
        } else {
            await route.continue();
        }
    });


    // 1. Visit Sharing URL
    // We need to simulate Auth state "Ready" or "SignedIn"
    // The app will prompt for sign in if not authenticated.
    // We should mimic the auth flow or assume already signed in via localStorage injection if possible, 
    // but the test helper usually handles clean slate.
    // Let's use the UI to Sign In first if standard flow.

    // Actually, let's inject a token to skip the "Welcome Back" screen for the sharing user
    await page.addInitScript(() => {
        localStorage.setItem('food_log_access_token', 'mock-token');
        localStorage.setItem('food_log_token_expiry', (Date.now() + 3600000).toString());
    });

    await page.goto(`/sharing?folderId=${SHARED_FOLDER_ID}&date=2024-01-01`);

    await tester.step('load-shared-log', {
        description: 'Shared Log Loads',
        verifications: [
            {
                spec: 'Shared Title Visible', check: async () => {
                    if (await page.locator('.error-container').isVisible()) {
                        const err = await page.locator('.error-container p').textContent();
                        console.log('Error Container Found:', err);
                    }
                    // Use more specific locator
                    await expect(page.getByRole('heading', { name: 'Shared Food Log' })).toBeVisible({ timeout: 10000 });
                }
            },
            { spec: 'Content Visible', check: async () => await expect(page.getByText('Shared Pasta')).toBeVisible() },
            {
                spec: 'Link is Correct', check: async () => {
                    // Verify the link points to sharing route
                    const link = page.getByRole('link', { name: /Shared Pasta/ });
                    const href = await link.getAttribute('href');
                    expect(href).toContain('/sharing/entry/');
                    expect(href).toContain(SHARED_FOLDER_ID);
                }
            },
            { spec: 'Calories Ring Visible', check: async () => await expect(page.locator('.stats-section').getByText('500')).toBeVisible() }
        ]
    });

    // 2. Click Entry to View Detail
    await page.getByText('Shared Pasta').click();

    await tester.step('view-shared-entry', {
        description: 'View Shared Entry Detail (Read Only)',
        verifications: [
            { spec: 'Description is disabled', check: async () => await expect(page.locator('input[type="text"]').first()).toBeDisabled() },
            { spec: 'Save Button Hidden', check: async () => await expect(page.locator('button.save-btn')).not.toBeVisible() },
            { spec: 'Delete Button Hidden', check: async () => await expect(page.locator('button.delete-link')).not.toBeVisible() }
        ]
    });

    // 3. Navigate Back
    await page.click('text=Back');

    await tester.step('navigate-back', {
        description: 'Return to Shared List',
        verifications: [
            { spec: 'Back to List', check: async () => await expect(page.getByText('Shared Pasta')).toBeVisible() }
        ]
    });


    tester.generateDocs();
});
