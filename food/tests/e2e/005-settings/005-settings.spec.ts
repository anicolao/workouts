import { test, expect } from '../fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';
import { mockDriveAPI } from '../helpers/mock-drive';

test('User configures macro settings', async ({ page }, testInfo) => {
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Macro Settings', 'User adjusts daily calorie and macro goals with cascading logic.');

    await mockDriveAPI(page);

    // 1. Initial Load
    await page.goto('/settings');
    await tester.step('initial-load', {
        description: 'Settings page loads with defaults',
        verifications: [
            { spec: 'Url is correct', check: async () => await expect(page).toHaveURL(/\/settings/) },
            { spec: 'Title is visible', check: async () => await expect(page.locator('.header h1')).toContainText('Macro Goals', { timeout: 15000 }) },
            { spec: 'Donut chart is visible', check: async () => await expect(page.locator('.donut-chart svg')).toBeVisible() },
            {
                spec: 'Calories input is 2000', check: async () => {
                    const el = page.locator('input.cals-input');
                    await el.waitFor({ state: 'visible' });
                    await expect(el).toHaveValue('2000', { timeout: 10000 });
                }
            },
            { spec: 'Protein slider is 30%', check: async () => await expect(page.locator('.protein-slider')).toHaveValue('30') },
            { spec: 'Save button is disabled', check: async () => await expect(page.locator('.save-btn')).toBeDisabled() }
        ]
    });

    // 2. Adjust Calories
    await page.fill('.cals-input', '2500');
    await tester.step('adjust-calories', {
        description: 'Changed calories to 2500',
        verifications: [
            { spec: 'Dirty state (Save enabled)', check: async () => await expect(page.locator('.save-btn')).toBeEnabled() },
            { spec: 'Center text updates', check: async () => await expect(page.locator('.cals-input')).toHaveValue('2500') },
            {
                spec: 'Protein Grams updates (30% of 2500 / 4)', check: async () => {
                    // 0.3 * 2500 = 750 kcal / 4 = 187.5 ~ 188g
                    // Check input value (number)
                    await expect(page.locator('.macro-card', { hasText: 'Protein' }).locator('.gram-input')).toHaveValue('188');
                }
            }
        ]
    });

    // 3. Adjust Macros (Cascading Logic)
    // Increase Protein from 30 -> 50 (+20)
    // Fat (35) should decrease by 20 -> 15.
    // Carbs (35) should stay 35.
    await page.fill('.protein-slider', '50');
    // Trigger input event manually if needed, checking if fill triggers it for range
    await page.locator('.protein-slider').evaluate(el => el.dispatchEvent(new Event('input')));

    await tester.step('adjust-macro-protein', {
        description: 'Increased Protein to 50%',
        verifications: [
            { spec: 'Protein is 50%', check: async () => await expect(page.locator('.protein-slider')).toHaveValue('50') },
            { spec: 'Fat reduced to 15%', check: async () => await expect(page.locator('.fat-slider')).toHaveValue('15') },
            { spec: 'Carbs remains 35%', check: async () => await expect(page.locator('.carbs-slider')).toHaveValue('35') },
            {
                spec: 'Chart segment updates', check: async () => {
                    // Can check text labels on chart
                    await expect(page.locator('.donut-chart text', { hasText: '50%' })).toBeVisible();
                    await expect(page.locator('.donut-chart text', { hasText: '15%' })).toBeVisible();
                }
            }
        ]
    });

    // 4. Boundary Test
    // Increase Protein to 90.
    // P=50->90 (+40).
    // Fat=15. Can give 15 -> 0. Remainder = 25.
    // Carbs=35. Can give 25 -> 10.
    // Result: P=90, F=0, C=10.
    await page.fill('.protein-slider', '90');
    await page.locator('.protein-slider').evaluate(el => el.dispatchEvent(new Event('input')));

    await tester.step('adjust-macro-boundary', {
        description: 'Increased Protein to 90% (consuming Fat and Carbs)',
        verifications: [
            { spec: 'Protein is 90%', check: async () => await expect(page.locator('.protein-slider')).toHaveValue('90') },
            { spec: 'Fat is 0%', check: async () => await expect(page.locator('.fat-slider')).toHaveValue('0') },
            { spec: 'Carbs is 10%', check: async () => await expect(page.locator('.carbs-slider')).toHaveValue('10') }
        ]
    });

    // 5. Save
    // 5. Save
    await page.click('.save-btn');

    await tester.step('save-changes', {
        description: 'Saved settings and redirected',
        verifications: [
            {
                spec: 'Redirected to dashboard', check: async () => {
                    await expect(page).toHaveURL(/\/$/); // Ends in slash (root)
                }
            }
        ]
    });

    tester.generateDocs();
});
