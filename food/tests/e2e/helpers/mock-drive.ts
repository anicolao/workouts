
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mocks the Google Drive & Sheets API to support robust metadata discovery and generic operations.
 * 
 * Handled Drive Endpoints:
 * - Search by `appProperties` (Robust Discovery)
 * - Search by `FoodLog` folder
 * - Search by Legacy Name
 * - Get Metadata / Patch File (files/{id})
 * - Create File
 * 
 * Handled Sheets Endpoints:
 * - batchUpdate (Create Sheet)
 * - values/Events (Append / Get) - Returns empty by default
 */
export async function mockDriveAPI(page: Page) {
    // 0. Serve Local Fixtures (Apple)
    await page.route('**/mock-images/apple.png', async route => {
        const buffer = fs.readFileSync(path.resolve(process.cwd(), 'tests/e2e/fixtures/apple.png'));
        await route.fulfill({ body: buffer, contentType: 'image/png' });
    });

    // 1. Mock Drive API
    await page.route('**/drive/v3/**', async route => {
        const url = route.request().url();
        const method = route.request().method();

        // 1. Robust Discovery: Search by Tag
        if (url.includes('appProperties')) {
            await route.fulfill({
                json: {
                    files: [{
                        id: 'mock-sheet-id',
                        name: 'Food Log Data',
                        modifiedTime: '2024-01-01T12:00:00Z',
                        appProperties: { type: 'food_tracker_db' }
                    }]
                }
            });
            return;
        }

        // 2. Folder Search
        if (url.includes('FoodLog')) {
            await route.fulfill({ json: { files: [{ id: 'mock-folder-id', name: 'FoodLog' }] } });
            return;
        }

        // 3. Turn off Legacy Search
        if (url.includes('TheFoodTrackerEventLog')) {
            await route.fulfill({ json: { files: [{ id: 'mock-sheet-id', name: 'TheFoodTrackerEventLog' }] } });
            return;
        }

        // 4. Single File Operations
        if (url.match(/\/files\/[^/?]+(\?|$)/)) {
            // If it is a media request, allow fallback so specific tests can handle it (or network)
            if (url.includes('alt=media')) {
                await route.fallback();
                return;
            }

            if (method === 'PATCH') {
                const body = route.request().postDataJSON();
                await route.fulfill({
                    json: {
                        id: 'mock-sheet-id',
                        name: body.name || 'Renamed File',
                        appProperties: { type: 'food_tracker_db' }
                    }
                });
            } else {
                await route.fulfill({
                    json: {
                        id: 'mock-sheet-id',
                        name: 'Food Log Data',
                        mimeType: 'application/vnd.google-apps.spreadsheet'
                    }
                });
            }
            return;
        }

        // 5. Upload (Multipart or regular)
        if (url.includes('/upload/drive/v3/files')) {
            await route.fulfill({
                status: 200,
                json: {
                    id: 'mock-uploaded-file-id',
                    name: 'Uploaded File',
                    // Use generic mock apple so it looks real
                    thumbnailLink: 'http://localhost:5174/mock-images/apple.png',
                    webViewLink: 'http://localhost:5174/mock-images/apple.png'
                }
            });
            return;
        }

        // 6. Generic Creation (POST to files)
        if (method === 'POST' && url.includes('/files')) {
            await route.fulfill({ json: { id: 'mock-sheet-id', name: 'New Database' } });
            return;
        }

        await route.fulfill({ json: { files: [] } });
    });

    // 2. Mock Sheets API
    await page.route('**sheets.googleapis.com**', async route => {
        const url = route.request().url();
        const method = route.request().method();

        if (url.includes('batchUpdate')) {
            await route.fulfill({ json: { replies: [{ addSheet: { properties: { title: 'Events' } } }] } });
            return;
        }

        if (url.includes('values/Events')) {
            if (method === 'POST') {
                await route.fulfill({ json: { updates: { updatedRange: 'Events!A1' } } });
            } else {
                // Return empty values by default
                await route.fulfill({ json: { values: [] } });
            }
            return;
        }

        if (url.includes('values/Identity')) {
            if (method === 'PUT' || method === 'POST') {
                await route.fulfill({ json: { updatedRange: 'Identity!A1:B2' } });
            } else {
                await route.fulfill({
                    json: {
                        values: [
                            ['Name', 'Test User'],
                            ['Avatar', 'http://localhost:5174/mock-images/apple.png']
                        ]
                    }
                });
            }
            return;
        }

        // Get Spreadsheet (Metadata)
        if (url.match(/spreadsheets\/[^/]+$/)) {
            await route.fulfill({ json: { sheets: [{ properties: { title: 'Events' } }] } });
            return;
        }

        // Catch-all for other sheets calls
        await route.fulfill({ json: {} });
    });

    // 3. Mock Photos Picker API
    await page.route('**photospicker.googleapis.com**', async route => {
        const url = route.request().url();
        const method = route.request().method();

        if (url.includes('sessions')) {
            if (!url.includes('mediaItems')) {
                // Session Management
                if (method === 'POST') {
                    // Create Session
                    await route.fulfill({ json: { id: 'sess-1', pickerUri: 'http://mock-picker.com' } });
                } else {
                    // Poll Session (GET)
                    // Default to 'mediaItemsSet: true' to prevent hanging, or false?
                    // 004 sets it to true. 002 sets it to false.
                    // Default to false (polling) to mimic real behavior, but tests might timeout?
                    // Let's check 005.
                    await route.fulfill({ json: { mediaItemsSet: false } });
                }
                return;
            }
        }

        if (url.includes('mediaItems')) {
            // List Items
            await route.fulfill({
                json: {
                    mediaItems: [{
                        id: 'item-1',
                        mediaFile: {
                            baseUrl: 'https://lh3.googleusercontent.com/picker-img',
                            mimeType: 'image/jpeg',
                            filename: 'picked.jpg'
                        }
                    }]
                }
            });
            return;
        }

        await route.fulfill({ json: {} });
    });

    // 4. Mock Google User Content (Images)
    await page.route('**lh3.googleusercontent.com**', async route => {
        // Return a placeholder image
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwftQAAAABJRU5ErkJggg==', 'base64');
        await route.fulfill({ body: buffer, contentType: 'image/png' });
    });

    // 5. Mock UserInfo
    await page.route('**googleapis.com/oauth2/v3/userinfo**', async route => {
        await route.fulfill({
            json: {
                name: 'Test User',
                email: 'test@example.com',
                picture: 'http://localhost:5174/mock-images/apple.png'
            }
        });
    });
}
