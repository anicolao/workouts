import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('User starts a workout session', async ({ page }, testInfo) => {
    // 1. Initialize
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Start Workout', 'As a user, I want to start a new workout session.');

    // 2. Perform Action & Verify
    await page.goto('/');
    await tester.step('initial-load', {
        description: 'Dashboard is visible',
        verifications: [
            { spec: 'Title is Workouts', check: async () => await expect(page).toHaveTitle('Workouts') },
            { spec: 'Start Workout button is visible', check: async () => await expect(page.getByTestId('start-workout-btn')).toBeVisible() }
        ]
    });

    await page.getByTestId('start-workout-btn').click();

    await tester.step('workout-started', {
        description: 'Workout session is active',
        verifications: [
            { spec: 'Navigated to workout page', check: async () => await expect(page).toHaveURL(/\/workout\/[a-f0-9-]+/) },
            { spec: 'Active Workout header is visible', check: async () => await expect(page.getByRole('heading', { name: 'Active Workout' })).toBeVisible() }
        ]
    });

    // 3. Conclude
    tester.generateDocs();
});
