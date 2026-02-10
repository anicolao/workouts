import { test, expect } from '@playwright/test';
import { mockDriveAPI } from '../helpers/mock-drive';
import { TestStepHelper } from '../helpers/test-step-helper';

test('013-detailed-nutrition: Log and Edit Detailed Nutrition', async ({ page }) => {
    const tester = new TestStepHelper(page, test.info());
    page.on('console', msg => console.log(msg.text()));


    // Block real GSI aggressively
    await page.route('**/gsi/client', route => route.abort());

    // Mock Auth
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
    // Block real Google Identity script
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // Mock Clock for stable date
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });

    await tester.step('setup_mock', {
        description: 'Setup: Mock Drive and Gemini',
        verifications: [{
            spec: 'Drive and Gemini APIs mocked',
            check: async () => {
                await mockDriveAPI(page);

                // Mock Gemini Analysis Response with details
                await page.route('**/v1beta/models/gemini-2.5-flash:generateContent*', async route => {
                    const json = {
                        candidates: [{
                            content: {
                                parts: [{
                                    text: JSON.stringify({
                                        is_label: true,
                                        item_name: "Detailed Salad",
                                        rationale: "Rich in nutrients",
                                        calories: 350,
                                        protein: 15,
                                        fat: { total: 20 },
                                        carbohydrates: { total: 30 },
                                        details: {
                                            saturatedFat: 5,
                                            transFat: 0,
                                            cholesterol: 10,
                                            sodium: 450,
                                            fiber: 8,
                                            sugar: 12,
                                            addedSugar: 2,
                                            caffeine: 0
                                        },
                                        searchQuery: "healthy salad"
                                    })
                                }]
                            }
                        }]
                    };
                    await route.fulfill({ json });
                });

                // Mock Wikimedia Search to return a valid local image
                await page.route('**commons.wikimedia.org/w/api.php*', async route => {
                    await route.fulfill({
                        json: {
                            query: {
                                pages: {
                                    '12345': {
                                        imageinfo: [{ url: 'http://localhost:5174/mock-images/apple.png' }]
                                    }
                                }
                            }
                        }
                    });
                });
            }
        }]
    });

    await tester.step('navigate_and_log', {
        description: 'Action: Navigate to Log and Enter Text',
        verifications: [{
            spec: 'Log page reachable and analysis returns details',
            check: async () => {
                await page.goto('/');
                // Allow polling to initialize tokenClient
                await page.waitForFunction(() => (window as any)._authReady);
                await page.getByText('Sign In with Google').click();
                await expect(page.locator('.feed-header h2').first()).toHaveText('Today'); // Wait for home

                await page.goto('/log');
                await page.waitForLoadState('domcontentloaded');
                await page.getByRole('button', { name: 'Text' }).click();
                await page.getByRole('textbox').fill('Big salad with everything');
                await page.getByRole('button', { name: 'Analyze' }).click();
                // Wait for analysis to complete before snapshot
                await expect(page.getByLabel('Log Description')).toHaveValue('Detailed Salad');
            }
        }]
    });

    await tester.step('verify_form', {
        description: 'Verification: Check Unified Form with Details',
        verifications: [
            {
                spec: 'Item name populated',
                check: async () => await expect(page.getByLabel('Log Description')).toHaveValue('Detailed Salad')
            },
            {
                spec: 'Calories match',
                check: async () => expect(page.getByLabel('Calories')).toHaveValue('350')
            },
            {
                spec: 'Detailed fields visible after toggle',
                check: async () => {
                    // Toggle button is now an icon button
                    await page.locator('.icon-toggle').click();
                    await expect(page.getByLabel('Saturated')).toHaveValue('5');
                    await expect(page.getByLabel('Sodium')).toHaveValue('450');
                    await expect(page.getByLabel('Fiber')).toHaveValue('8');
                }
            }
        ]
    });

    await tester.step('save_entry', {
        description: 'Action: Save Entry',
        verifications: [{
            spec: 'Save redirects to home',
            check: async () => {
                await page.getByRole('button', { name: 'Save Entry' }).click();
                await expect(page).toHaveURL(/\/$/);
                // Ensure sync completes before potential screenshots (User reported flake)
                await expect(page.locator('[data-status="synced"]')).toBeVisible();
            }
        }]
    });

    await tester.step('open_detail', {
        description: 'Action: Open Entry in Detail View',
        verifications: [{
            spec: 'Entry opens',
            check: async () => {
                await page.getByText('Detailed Salad').click();
                await expect(page.locator('.feed-header h2')).toBeVisible();
                await page.waitForTimeout(500); // Animations
            }
        }]
    });

    await tester.step('verify_persistence', {
        description: 'Verification: Check Details Persisted',
        verifications: [{
            spec: 'Details align with mocked data',
            check: async () => {
                await page.locator('.icon-toggle').click();
                await expect(page.getByLabel('Saturated')).toHaveValue('5');
                await expect(page.getByLabel('Sodium')).toHaveValue('450');
            }
        }]
    });

    await tester.step('edit_detail', {
        description: 'Action: Edit Detail (Independent Fields)',
        verifications: [{
            spec: 'Edit Fiber does NOT update Total Carbs (Decoupled)',
            check: async () => {
                // Initial: Fiber 8, Sugar 12, Carbs 30.

                // Change Fiber to 40. 
                await page.getByLabel('Fiber').fill('40');

                // Total should remain 30 because logic is decoupled
                await expect(page.getByLabel('Carbohydrates')).toHaveValue('30');

                // Also edit Caffeine for persistence check
                await page.getByLabel('Caffeine').fill('50');

                await page.getByRole('button', { name: 'Save Changes' }).click();
            }
        }]
    });

    await tester.step('verify_edit', {
        description: 'Verification: Verify Edit Persisted',
        verifications: [
            {
                spec: 'Caffeine value is now 50',
                check: async () => {
                    await page.getByText('Detailed Salad').click();
                    await page.locator('.icon-toggle').click();
                    await expect(page.getByLabel('Caffeine')).toHaveValue('50');
                }
            },
            {
                spec: 'Fiber is 40 and Carbs is 30',
                check: async () => {
                    await expect(page.getByLabel('Fiber')).toHaveValue('40');
                    await expect(page.getByLabel('Carbohydrates')).toHaveValue('30');
                }
            }
        ]
    });

    await tester.generateDocs();
});
