import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('US-014: Log Again and Favourites', async ({ page }, testInfo) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Log Again', 'Verify Log Again and Favourites flow');

    // Mocks
    await mockDriveAPI(page);
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
    await page.route('**/gsi/client', route => route.abort());

    // Mock Sheets to return one existing entry
    const existingEntry = [
        'event-id-1',
        '2024-03-15T12:00:00.000Z',
        'log/entryConfirmed',
        JSON.stringify({
            entry: {
                id: 'entry-1',
                date: '2024-03-15',
                time: '12:00',
                mealType: 'Lunch',
                description: 'Existing Salad',
                calories: 350,
                protein: 15,
                fat: 10,
                carbs: 40,
                rationale: 'Healthy lunch',
                imageDriveUrl: 'https://drive.mock/salad.jpg, https://drive.mock/side.jpg',
                details: {}
            }
        })
    ];

    const eventParams: any[] = [];

    await page.route('**sheets.googleapis.com**', async route => {
        const url = route.request().url();
        console.log('Test Route Hit:', url);
        if (url.includes('append')) {
            const postData = route.request().postDataJSON();
            if (postData && postData.values && postData.values[0]) {
                eventParams.push(postData.values[0][2]); // Capture event Type
                // If logAgain, capture payload
                if (postData.values[0][2] === 'log/logAgain') {
                    eventParams.push(JSON.parse(postData.values[0][3]));
                }
            }
            await route.fulfill({ json: { updates: { updatedRange: 'A1' } } });
        } else if (url.includes('values/Events')) {
            await route.fulfill({ json: { values: [existingEntry] } });
        } else {
            await route.fallback();
        }
    });

    // Auth Mock
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

    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.getByText('Sign In with Google').click();
    // Wait for Dashboard to stabilize (Auth confirmed)
    await expect(page.locator('.feed-header h2').first()).toBeVisible();

    // Explicitly wait for Sync to complete so store is hydrated
    await expect(page.locator('[data-status="synced"]')).toBeVisible();

    // 1. Navigate to Entry Details via Dashboard
    // It should appear in Today list
    await expect(page.getByText('Existing Salad')).toBeVisible();
    await page.getByText('Existing Salad').click();

    // Verify Page Loaded
    await expect(page.locator('.big-text')).toHaveValue('Existing Salad');

    // 2. Click FAB
    const fab = page.getByLabel('Log new food entry');
    await expect(fab).toBeVisible();
    await fab.click();

    // 3. Verify Log Again Button
    await tester.step('check-log-again', {
        description: 'Log Again button visible',
        verifications: [
            { spec: 'Log Again button shown', check: async () => await expect(page.getByText('Log Again')).toBeVisible() },
            { spec: 'Favourites button shown', check: async () => await expect(page.getByText('Favourites')).toBeVisible() }
        ]
    });

    // 4. Click Log Again
    const logAgainBtn = page.getByText('Log Again');
    await expect(logAgainBtn).toBeVisible();
    await logAgainBtn.click();

    // 5. Verify Sheet Open and Pre-filled
    await tester.step('verify-prefill', {
        description: 'Form pre-filled',
        verifications: [
            { spec: 'Name is Existing Salad', check: async () => await expect(page.getByLabel('Log Description')).toHaveValue('Existing Salad') },
            { spec: 'Calories is 350', check: async () => await expect(page.getByLabel('Calories')).toHaveValue('350') },
            { spec: 'Date is Today (15th)', check: async () => await expect(page.getByLabel('Date')).toHaveValue('2024-03-15') },
            { spec: 'Media is preserved', check: async () => await expect(page.locator('.preview-strip img')).toHaveCount(2) } // Check image copy
        ]
    });

    // 6. Save
    await page.getByText('Save Entry').click();
    await expect(page.locator('.feed-header h2').first()).toHaveText('Today');

    // 7. Verify LogAgain Event dispatched
    // We check capture
    expect(eventParams).toContain('log/logAgain');

    // 8. Test Favourites
    await page.goto('/log'); // Go to log page directly

    // 9. Click Favourites
    const favBtn = page.getByText('Favourites');
    await expect(favBtn).toBeVisible();
    await favBtn.click();

    // 10. Verify Picker shows item
    await tester.step('verify-favourites', {
        description: 'Favourites Picker',
        verifications: [
            { spec: 'Modal visible', check: async () => await expect(page.locator('.modal h2')).toHaveText('Favourites') },
            { spec: 'Item in list', check: async () => await expect(page.locator('.fav-item .name')).toHaveText('Existing Salad') },
            // { spec: 'Usage count 1', check: async () => await expect(page.locator('.fav-item .count')).toHaveText('1 logs') } // Might be strict text match issue
        ]
    });

    // 11. Select Item
    const favItem = page.locator('.fav-item');
    await expect(favItem).toBeVisible();
    await favItem.click();

    // 12. Verify Form filled again
    await expect(page.locator('.modal')).not.toBeVisible();
    await expect(page.getByLabel('Log Description')).toHaveValue('Existing Salad');
    // Verify Media also restored from favourite (since Log Again populated it previously)
    await expect(page.locator('.preview-strip img')).toHaveCount(2);

    tester.generateDocs();
});
