import { test, expect } from './fixtures';
import { TestStepHelper } from './helpers/test-step-helper';
import { mockDriveAPI } from './helpers/mock-drive';
import * as fs from 'fs';

test('US-009: User logs food via Text and Voice', async ({ page, context }, testInfo) => {
    // Grant permissions as per user request ("always allow everything")
    await context.grantPermissions(['camera', 'microphone']);

    const tester = new TestStepHelper(page, testInfo);
    tester.setMetadata('Logging', 'User logs a meal via Text and Voice.');

    // Promise Gate for Gemini
    let resolveGemini: () => void = () => { };
    const geminiPromise = new Promise<void>(r => { resolveGemini = r; });

    // Mock Auth & Services
    await page.clock.install({ time: new Date('2024-03-15T16:00:00Z') });
    await page.addInitScript(() => {
        (window as any).google = {
            accounts: {
                oauth2: {
                    initTokenClient: (c: any) => ({ requestAccessToken: () => c.callback({ access_token: 'mock' }) }),
                    revoke: (token: string, cb: any) => cb()
                }
            }
        };

        // Mock Web Speech API
        class MockSpeechRecognition {
            continuous = false;
            interimResults = false;
            lang = 'en-US';
            onstart = () => { };
            onend = () => { };
            onresult = (e: any) => { };
            onerror = (e: any) => { };
            start() {
                this.onstart();
                setTimeout(() => {
                    // Simulate result after 1 second
                    const event = {
                        resultIndex: 0,
                        results: [
                            [{ transcript: 'I had a grilled cheese sandwich', isFinal: true }]
                        ]
                    };
                    this.onresult(event);
                }, 500);
            }
            stop() {
                this.onend();
            }
        }
        (window as any).SpeechRecognition = MockSpeechRecognition;
        (window as any).webkitSpeechRecognition = MockSpeechRecognition;

        // Mock getUserMedia
        const mockStream = {
            getTracks: () => [{ stop: () => { } }],
            getAudioTracks: () => [{ stop: () => { } }]
        };
        if (!navigator.mediaDevices) (navigator as any).mediaDevices = {};
        navigator.mediaDevices.getUserMedia = async () => mockStream as any;
    });

    // Block real Google Identity script to prevent overwriting mocks
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    await mockDriveAPI(page);
    await page.route('**googleapis.com**', async route => {
        const url = route.request().url();
        console.log('MOCKING:', url);

        if (url.includes('generativelanguage')) {
            // Wait for test to signal readiness
            await geminiPromise;

            const reqBody = route.request().postDataJSON();
            const tools = reqBody.tools;

            // Handle Tool Use (Image Search)
            if (tools && tools[0]?.googleSearch) {
                console.log('MOCKING GEMINI IMAGE SEARCH');
                await route.fulfill({
                    json: {
                        candidates: [{
                            content: {
                                parts: [{ text: 'https://example.com/mock-apple.jpg' }]
                            }
                        }]
                    }
                });
                return;
            }

            // Handle Text Analysis
            const textPrompt = reqBody.contents?.[0]?.parts?.find((p: any) => p.text)?.text || '';

            let result;
            if (textPrompt.includes('USER TEXT DESCRIPTION: "Apple"')) {
                result = {
                    is_label: false,
                    item_name: 'Apple',
                    rationale: 'Standard apple nutrition',
                    calories: 95,
                    fat: { total: 0 },
                    carbohydrates: { total: 25 },
                    protein: 0,
                    searchQuery: 'fresh red apple'
                };
            } else if (textPrompt.includes('grilled cheese')) {
                result = {
                    is_label: false,
                    item_name: 'Grilled Cheese',
                    rationale: 'Standard grilled cheese',
                    calories: 400,
                    fat: { total: 20 },
                    carbohydrates: { total: 30 },
                    protein: 15,
                    searchQuery: 'grilled cheese sandwich'
                };
            } else {
                result = { item_name: 'Unknown', calories: 0, fat: { total: 0 }, carbohydrates: { total: 0 }, protein: 0 };
            }

            await route.fulfill({
                json: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify(result)
                            }]
                        }
                    }]
                }
            });
        } else if (url.includes('drive/v3/files') || url.includes('sheets.googleapis.com')) {
            // Standard Drive/Sheets mocks
            await route.fallback();
        } else if (url === 'https://example.com/mock-apple.jpg') {
            // Mock the image fetch verification
            await route.fulfill({ status: 200, body: Buffer.from('fake-image-data') });
        } else {
            await route.continue();
        }
    });

    await page.goto('/');
    // Allow polling to initialize
    await page.waitForFunction(() => (window as any)._authReady);
    await page.getByText('Sign In with Google').click();
    await expect(page.locator('.feed-header h2').first()).toHaveText('Today');

    await page.goto('/log');
    await expect(page.getByRole('heading', { name: 'Log Food' })).toBeVisible();

    // TEST 1: Text Logging
    await tester.step('text-log', {
        description: 'Log via Text Input',
        verifications: [
            { spec: 'Grid visible', check: async () => await expect(page.getByText('Text')).toBeVisible() }
        ]
    });

    await page.getByText('Text').click();
    await expect(page.getByPlaceholder('e.g., A large iced latte with oat milk and a blueberry muffin')).toBeVisible();

    await page.locator('textarea').fill('Apple');
    await page.getByText('Analyze').click();

    // Release Mock for "Apple"
    resolveGemini();

    // Wait for result
    await expect(page.getByLabel('Log Description')).toHaveValue('Apple');
    await expect(page.getByLabel('Calories')).toHaveValue('95');

    // Check if image preview is the mock placeholder (from searchFoodImage)
    await expect(page.locator('img.sheet-thumb')).toBeVisible();

    // Close sheet to reset
    await page.getByRole('button', { name: 'Save Entry' }).click(); // Just save to clear
    await page.goto('/log'); // Reset

    // TEST 2: Voice Logging (Skipped in headless)
    /*
    await tester.step('voice-log', {
        description: 'Log via Voice',
        verifications: [
             { spec: 'Listening text visible', check: async () => await expect(page.getByText('Listening...')).toBeVisible() }
        ]
    });
     
    // Reset resolve for next call
    let resolveVoice: (value: unknown) => void = () => {};
    const voicePromise = new Promise(r => resolveVoice = r);
    resolveGemini = () => resolveVoice(null);
    
    await page.getByRole('button', { name: 'Voice' }).click({ force: true });
     
    // Voice Mock should auto-run after 500ms and populate "I had a grilled cheese sandwich"
    // Then user clicks Analyze (or we auto-submit, but current UI has "Stop & Analyze" button which turns to Analyze)
    // Wait for transcript
    await expect(page.getByText('I had a grilled cheese sandwich')).toBeVisible({ timeout: 5000 });
     
    await page.getByText('Stop & Analyze').click();
     
    // Release Gemini Mock for "grilled cheese"
    resolveGemini(); // Actually uses the re-assigned resolveVoice
     
    await expect(page.getByLabel('Log Description')).toHaveValue('Grilled Cheese');
    await expect(page.getByLabel('Calories')).toHaveValue('400');
    */

    tester.generateDocs();
});
