import { test, expect } from '@playwright/test';
import { TestStepHelper } from './helpers/test-step-helper';
import { mockGoogleAuth } from './helpers/mock-auth';

test('Action Persistence: Logs actions and shows sync status', async ({ page }, testInfo) => {
    // 1. Initialize
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Action Persistence', 'As a user, my actions should be logged to a spreadsheet and I should see sync status.');

    // 2. Mock Auth
    await mockGoogleAuth(page);


    // 3. Mock APIs
    let createdLogSheetId: string | null = null;
    let appendedActions: any[] = [];

    // Mock File Search (Folder & Sheet)
    await page.route('**/drive/v3/files*', async route => {
        const url = decodeURIComponent(route.request().url());
        console.log('Mock Drive List:', url);
        if (url.includes("mimeType='application/vnd.google-apps.folder'")) {
            await route.fulfill({ json: { files: [{ id: 'workouts-folder-id', name: 'Workouts' }] } }); // Folder already exists
        } else if (url.includes("mimeType='application/vnd.google-apps.spreadsheet'")) {
            // Config sheet or Log sheet
            if (url.includes('InternalEventLog') || url.includes('event_log')) {
                await route.fulfill({ json: { files: [] } }); // Trigger create for log
            } else {
                await route.fulfill({ json: { files: [{ id: 'config-sheet-id' }] } }); // Config exists
            }
        } else {
            // Other searches return empty
            await route.fulfill({ json: { files: [] } });
        }
    });

    // Mock Create Sheet (Log)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets', async route => {
        const body = route.request().postDataJSON();
        console.log('Mock Sheets Create:', body);
        if (body.properties.title === 'InternalEventLog') {
            createdLogSheetId = 'log-sheet-id';
            await route.fulfill({
                json: {
                    spreadsheetId: createdLogSheetId,
                    sheets: [{ properties: { title: 'Log' } }]
                }
            });
        } else {
            await route.fulfill({ json: { spreadsheetId: 'unknown-id' } });
        }
    });

    // Mock Patch (Metadata)
    await page.route('https://www.googleapis.com/drive/v3/files/*?addParents=*', async route => {
        console.log('Mock Drive Patch:', route.request().url());
        await route.fulfill({ json: {} });
    });

    // Mock Append Rows (Log entries)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*/values/*:append*', async route => {
        const body = route.request().postDataJSON();
        const url = route.request().url();
        console.log('Mock Sheets Append:', url);

        // Check if appending to Log sheet
        if (url.includes('Log!A:D')) {
            appendedActions.push(body.values[0]);
        }

        await route.fulfill({ json: {} });
    });

    // Mock Read Rows (Config)
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/*/values/Exercise Catalog!A2:D', async route => {
        await route.fulfill({ json: { values: [] } });
    });

    // 4. Perform Action
    await page.goto('/');

    // Sign In
    await page.getByTestId('sign-in-btn').click();
    await page.waitForSelector('[data-testid="start-workout-btn"]');
    await page.waitForFunction(() => (window as any)._authReady);

    // Start Workout -> Should trigger 'workout/start' log
    await page.getByTestId('start-workout-btn').click();

    // 5. Verify
    await page.waitForTimeout(10000); // Wait for async logging

    await tester.step('check-log-creation', {
        description: 'InternalEventLog spreadsheet should be created',
        verifications: [
            {
                spec: 'Log sheet created',
                check: async () => expect(createdLogSheetId).toBe('log-sheet-id')
            }
        ]
    });

    await tester.step('check-action-logged', {
        description: 'workout/start action should be appended to log',
        verifications: [
            {
                spec: 'Action appended',
                check: async () => {
                    // appendedActions is [[EventID, Timestamp, ActionType, Payload]]
                    const workoutStartAction = appendedActions.find(row => row[2] === 'workout/start');
                    expect(workoutStartAction).toBeDefined();
                }
            }
        ]
    });

    await tester.step('check-sync-ui', {
        description: 'Sync status icon should be visible',
        verifications: [
            {
                spec: 'Sync icon visible',
                check: async () => expect(page.locator('.sync-status-icon')).toBeVisible()
            }
        ]
    });

    // Click sync icon to go to status page
    await page.locator('.sync-status-icon').click();
    await expect(page).toHaveURL(/.*\/sync/);
    await expect(page.locator('h1')).toHaveText('Network & Sync');

    // 6. Conclude
    tester.generateDocs();
});
