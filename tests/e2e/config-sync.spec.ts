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

    // Mock File Search (Folder & Sheet)
    await page.route('https://www.googleapis.com/drive/v3/files?*', async route => {
        const url = route.request().url();
        if (url.includes("mimeType='application/vnd.google-apps.folder'")) {
            // Return empty for folder search -> trigger create
            await route.fulfill({ json: { files: [] } });
        } else if (url.includes("mimeType='application/vnd.google-apps.spreadsheet'")) {
            // Return empty for sheet search -> trigger create
            await route.fulfill({ json: { files: [] } });
        } else {
            await route.continue();
        }
    });

    // Mock Create File (Folder)
    await page.route('https://www.googleapis.com/drive/v3/files', async route => {
        const body = route.request().postDataJSON();
        if (body.mimeType === 'application/vnd.google-apps.folder') {
            await route.fulfill({ json: { id: 'new-folder-id' } });
        } else {
            await route.continue();
        }
    });

    // Mock Create Sheet
    await page.route('https://sheets.googleapis.com/v4/spreadsheets', async route => {
        const body = route.request().postDataJSON();
        createdSheetId = 'new-sheet-id';
        // Return sheets array to simulate successful creation
        await route.fulfill({
            json: {
                spreadsheetId: createdSheetId,
                sheets: [
                    { properties: { title: 'Instructions' } },
                    { properties: { title: 'Exercise Catalog' } }
                ]
            }
        });
    });

    // Mock Get Spreadsheet (for checking tabs)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                json: {
                    sheets: [
                        { properties: { title: 'Instructions' } },
                        { properties: { title: 'Exercise Catalog' } }
                    ]
                }
            });
        } else {
            await route.continue();
        }
    });

    // Mock Batch Update (Add Sheet)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*:batchUpdate', async route => {
        await route.fulfill({ json: {} });
    });

    // Mock Move to Folder
    await page.route('https://www.googleapis.com/drive/v3/files/*?addParents=*', async route => {
        await route.fulfill({ json: {} });
    });

    // Mock Append Rows
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*/values/*:append*', async route => {
        const body = route.request().postDataJSON();
        appendedImages.push(body);
        await route.fulfill({ json: {} });
    });

    // Mock Read Rows
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
