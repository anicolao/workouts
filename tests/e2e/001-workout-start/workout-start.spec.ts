import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('User signs in and starts a workout session', async ({ page }, testInfo) => {
    // 1. Initialize
    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Start Workout', 'As a user, I want to sign in and start a new workout session.');

    // 2. Perform Action & Verify
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto('/');
    await tester.step('initial-load', {
        description: 'Sign In button is visible',
        verifications: [
            { spec: 'Title is Workouts', check: async () => await expect(page).toHaveTitle('Workouts') },
            { spec: 'Sign In button is visible', check: async () => await expect(page.getByTestId('sign-in-btn')).toBeVisible() }
        ]
    });

    await page.getByTestId('sign-in-btn').click();

    await page.waitForSelector('[data-testid="start-workout-btn"]');

    await tester.step('signed-in', {
        description: 'User is signed in and sees dashboard',
        verifications: [
            { spec: 'Start Workout button is visible', check: async () => await expect(page.getByTestId('start-workout-btn')).toBeVisible() }
        ]
    });

    await page.getByTestId('start-workout-btn').click();

    await tester.step('workout-started', {
        description: 'Workout session is active',
        verifications: [
            { spec: 'Navigated to workout page', check: async () => await expect(page).toHaveURL(/\/workout\/test-workout-id/) },
            { spec: 'Active Workout header is visible', check: async () => await expect(page.getByRole('heading', { name: 'Active Workout' })).toBeVisible() }
        ]
    });

    // 3. Conclude
    tester.generateDocs();
});
