import { test, expect } from '../fixtures';
import { mockDriveAPI } from '../helpers/mock-drive';
import { TestStepHelper } from '../helpers/test-step-helper';

test.describe('Sync Error UX', () => {
    test('should display error UI when sync fails', async ({ page }, testInfo) => {
        // 1. Initialize Helper
        const tester = new TestStepHelper(page, testInfo);

        // 2. Mock Drive API & Auth
        await mockDriveAPI(page);

        // 3. Mock Sheets Failed Response (400 Bad Request) - Only for Values (Sync)
        await page.route('**/values/**', async route => {
            // We fail the append or get request
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: {
                        code: 400,
                        message: 'Simulated 400 Error for Verification',
                        status: 'INVALID_ARGUMENT'
                    }
                })
            });
        });

        // 4. Mock Auth Script
        await page.addInitScript(() => {
            (window as any).google = {
                accounts: { oauth2: { initTokenClient: (c: any) => ({ requestAccessToken: () => c.callback({ access_token: 'mock' }) }) } }
            };
        });

        // 5. Navigate & Inject Auth
        await page.goto('/');

        // Clear DB and Inject Auth
        await page.evaluate(async () => {
            const req = indexedDB.deleteDatabase('events-db');
            req.onsuccess = () => console.log('DB Cleared');

            localStorage.setItem('food_log_access_token', 'mock');
            localStorage.setItem('food_log_token_expiry', String(Date.now() + 3600000));
        });
        await page.reload();

        await expect(page).toHaveURL('/');
        // Dashboard should load immediately due to restored session
        await expect(page.locator('.dashboard-grid')).toBeVisible({ timeout: 15000 });

        // 6. Trigger Sync
        // We need to trigger a sync. The layout syncs on mount. 
        // But since we just logged in, a sync might have kicked off but maybe before our route fail took effect?
        // Route was set up at start.
        // Let's force a sync by navigating to settings and clicking Force Sync, or just waiting.
        // The app polls every 2s. Wait for 5s.
        await page.waitForTimeout(5000);

        // 7. Verify Error Icon
        const statusBtn = page.locator('button.network-status:visible');
        await expect(statusBtn).toHaveAttribute('data-status', 'error', { timeout: 10000 });
        await expect(statusBtn).toHaveAttribute('aria-label', /Error/);

        await tester.step('error-icon-visible', {
            description: 'Error icon is displayed on sync failure',
            networkStatus: 'error',
            verifications: [
                { spec: 'Status button has error state', check: async () => await expect(statusBtn).toHaveAttribute('data-status', 'error') }
            ]
        });

        // 8. Verify Navigation to Settings
        await statusBtn.click();
        await expect(page).toHaveURL(/.*\/settings\/network/);

        // 9. Verify Error Message
        const errorSection = page.locator('.error-panel');
        await expect(errorSection).toBeVisible();
        await expect(errorSection).toContainText('400: Bad Request');

        await tester.step('error-details-visible', {
            description: 'Error details and troubleshooting section are visible',
            networkStatus: 'error',
            verifications: [
                { spec: 'Error panel visible', check: async () => await expect(errorSection).toBeVisible() },
                { spec: 'Correct error message', check: async () => await expect(errorSection).toContainText('400: Bad Request') }
            ]
        });

        // 10. Verify Pulse Button
        // 10. Verify Pulse Button
        const resetBtn = page.locator('.error-panel button.danger-glow');
        await expect(resetBtn).toBeVisible();

        tester.generateDocs();
    });
});
