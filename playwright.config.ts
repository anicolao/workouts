import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
        launchOptions: {
            args: [
                '--font-render-hinting=none',
                '--disable-font-subpixel-positioning',
                '--disable-lcd-text',
                '--disable-skia-runtime-opts',
                '--disable-system-font-check',
                '--disable-features=FontAccess,WebRtcHideLocalIpsWithMdns',
                '--force-device-scale-factor=1',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--use-gl=swiftshader',
                '--disable-smooth-scrolling',
            ],
        },
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 1,
        timezoneId: 'America/New_York',
        locale: 'en-CA',
        actionTimeout: 2000,
    },
    snapshotPathTemplate: '{testDir}/{testFileDir}/screenshots/{arg}.png',
    expect: {
        timeout: 2000,
        toHaveScreenshot: { maxDiffPixels: 0 }
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5174',
        reuseExistingServer: !process.env.CI,
    },
});
