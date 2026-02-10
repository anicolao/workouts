# Add to Homescreen Support Implementation Plan

## Goal Description
Enable a native app-like experience when the user adds the website to their homescreen on iOS and Android. This includes proper manifest configuration, meta tags for standalone mode, and a custom-generated app icon that matches the application's aesthetic.

## Proposed Changes

### Configuration
#### [NEW] [static/manifest.webmanifest](file:///Users/anicolao/projects/antigravity/food-fixups/static/manifest.webmanifest)
- Create a web manifest file defining:
    - Name: "Food Fixups"
    - Short Name: "Food Fixups"
    - Start URL: "/"
    - Display mode: `standalone`
    - Background color: `#FFFFFF` (or matching theme)
    - Theme color: `#FFFFFF` (or matching theme)
    - Icons:
        - `android-chrome-192x192.png`
        - `android-chrome-512x512.png`

### HTML Structure
#### [MODIFY] [src/app.html](file:///Users/anicolao/projects/antigravity/food-fixups/src/app.html)
- Add `<link rel="manifest" href="/manifest.webmanifest">`
- Add iOS specific meta tags:
    - `<meta name="apple-mobile-web-app-capable" content="yes">`
    - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
    - `<meta name="apple-mobile-web-app-title" content="Food Fixups">`
    - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`

### Assets
#### [NEW] Icons
- Generate a new app icon using `design/mockups/mobile_dashboard.png` as inspiration.
- The icon should be simple, distinct, and match the UI's glassmorphism/modern aesthetic.
- Save as:
    - `static/android-chrome-192x192.png`
    - `static/android-chrome-512x512.png`
    - `static/apple-touch-icon.png`

## Verification Plan
### Manual Verification
- Deploy/Serve locally (`npm run dev -- --host`).
- Use Chrome DevTools > Application > Manifest to verify configuration.
- Use iOS Simulator or local device to:
    - Open in Safari.
    - "Add to Home Screen".
    - Verify icon is correct.
    - Launch from home screen and verify no browser UI (standalone mode).
