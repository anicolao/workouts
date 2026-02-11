import { test, expect } from '@playwright/test';
import { TestStepHelper } from './helpers/test-step-helper';
import { mockGoogleAuth } from './helpers/mock-auth';

test('Config Sync: Creates sheet and syncs exercises', async ({ page }, testInfo) => {
    // 1. Initialize
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Config Sync', 'As a user, my exercises should be synced from a Google Sheet.');

    // 2. Mock Auth
    await mockGoogleAuth(page);

    // 3. Mock Sheets API
    let createdSheetId: string | null = null;
    let appendedImages: any[] = [];

    // Mock File Search (return empty first to trigger create)
    await page.route('https://www.googleapis.com/drive/v3/files?*', async route => {
        await route.fulfill({ json: { files: [] } });
    });

    // Mock Create Sheet
    await page.route('https://sheets.googleapis.com/v4/spreadsheets', async route => {
        const body = route.request().postDataJSON();
        createdSheetId = 'new-sheet-id';
        await route.fulfill({ json: { spreadsheetId: createdSheetId } });
    });

    // Mock Append Rows
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*/values/*:append*', async route => {
        const body = route.request().postDataJSON();
        appendedImages.push(body);
        await route.fulfill({ json: {} });
    });

    // Mock Read Rows (return existing defaults + one custom)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*/values/Exercise Catalog!A2:D', async route => {
        await route.fulfill({
            json: {
                values: [
                    ['Custom Press', 'Push', '8', 'Chest, Custom']
                ]
            }
        });
    });

    // 4. Perform Action
    await page.goto('/');

    // Sign In
    await page.getByTestId('sign-in-btn').click();
    await page.waitForSelector('[data-testid="start-workout-btn"]');

    // 5. Verify App State (Custom Exercise should be in store)
    // 5. Verify App State (Custom Exercise should be in store)
    await page.waitForFunction(() => (window as any)._authReady);

    // Wait for sync to happen (it's async after auth)
    await page.waitForTimeout(2000); // Give it a moment for the async fetch calls to resolve

    await tester.step('sync-complete', {
        description: 'Sync should complete and populate store',
        verifications: [
            {
                spec: 'Sheet was created',
                check: async () => expect(createdSheetId).toBe('new-sheet-id')
            },
            {
                spec: 'Defaults were appended',
                check: async () => expect(appendedImages.length).toBeGreaterThan(0)
            }
        ]
    });

    // Verify via store state (expose store to window or check via UI if possible)
    // For now, checks are indirect via mocks being called.

    // 3. Conclude
    tester.generateDocs();
});
