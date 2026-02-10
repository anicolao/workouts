# PWA 'Add to Homescreen' Support Walkthrough

I have implemented Progressive Web App (PWA) features to enable a native-like experience when adding the application to the homescreen on iOS and Android.

## Changes

### 1. App Icons
Generated and configured a custom app icon inspired by the dashboard design. The following sizes were created and placed in `static/`:
- `android-chrome-512x512.png` (High-res source)
- `android-chrome-192x192.png` (Standard Android home screen)
- `apple-touch-icon.png` (iOS home screen, 180x180)

<div style="display: flex; gap: 20px;">
  <div style="text-align: center;">
    <img src="/static/apple-touch-icon.png" width="100" height="100" />
    <p>App Icon</p>
  </div>
</div>

### 2. Web Manifest
Created `static/manifest.webmanifest` to define the app's behavior:
- **Name**: Food Fixups
- **Display**: Standalone (hides browser UI)
- **Colors**: Dark mode theme (`#171717`) matches the app's default background.

### 3. HTML Configuration
Updated `src/app.html` to include:
- Link to `manifest.webmanifest`
- `<meta name="apple-mobile-web-app-capable" content="yes">` for iOS standalone mode.
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` for a merged status bar look.

## Verification Results

### Configuration Check
- `manifest.webmanifest` contains correct paths and sizes for icons.
- `src/app.html` correctly links to the manifest and defines iOS meta tags.
- Icon files exist in `static/` with correct dimensions (verified via `sips`).

## How to Test
1. **Desktop**: Open Chrome DevTools > Application > Manifest. Verify no errors and icons are loaded.
2. **Mobile (iOS)**:
   - Open the site in Safari.
   - Tap "Share" > "Add to Home Screen".
   - **Expected**: The new icon appears in the preview.
   - Tap "Add". Open the app from the home screen.
   - **Expected**: App opens without Safari UI (standalone mode).
