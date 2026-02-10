import type { Page } from '@playwright/test';

export async function mockGoogleAuth(page: Page) {
    // 1. Inject __TEST_MODE__ for deterministic UUIDs
    await page.addInitScript(() => {
        (window as any).__TEST_MODE__ = true;
    });

    // 2. Mock Google Identity Services (GSI)
    await page.addInitScript(() => {
        (window as any).google = {
            accounts: {
                oauth2: {
                    initTokenClient: (config: any) => ({
                        requestAccessToken: () => {
                            console.log('Mocking requestAccessToken');
                            config.callback({
                                access_token: 'mock-access-token',
                                expires_in: 3600,
                                scope: config.scope
                            });
                        },
                    }),
                    revoke: (token: string, cb: any) => cb()
                }
            }
        };
    });

    // 3. Block real GSI script
    await page.route('https://accounts.google.com/gsi/client', route => route.abort());

    // 4. Mock User Info API
    await page.route('https://www.googleapis.com/oauth2/v3/userinfo', async route => {
        await route.fulfill({
            json: {
                sub: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
                picture: 'https://example.com/avatar.png'
            }
        });
    });
}
