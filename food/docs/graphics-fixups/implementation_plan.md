# Graphics Fixups Plan

We will regenerate the application icons and sync status assets to match a unified "glassmorphic neon on black" style.

## Proposed Changes

### Assets

#### [MODIFY] App Icons
- Generate a new master app icon.
- Replace:
    - `static/apple-touch-icon.png`
    - `static/android-chrome-192x192.png` (Resize/Copy)
    - `static/android-chrome-512x512.png` (Resize/Copy)

#### [MODIFY] Sync Status Icons
- **Reference Style:** `static/images/icon-status-synced.png` (Current "Double line" version will be used as style source for others before being replaced).

1.  **Sync Failure** (`static/images/icon-status-error.png`)
    -   Style: Neon glow, pure black background.
    -   Content: Failure/Error symbol (e.g., Exclamation mark or broken sync).
2.  **Pending Status** (`static/images/icon-status-pending.png`)
    -   Style: Neon glow, pure black background.
    -   Content: Pending/Waiting symbol. **NO WORDS**.
3.  **Offline Status** (`static/images/icon-status-offline.png`)
    -   Style: Neon glow, pure black background.
    -   Content: Offline symbol (e.g., Cloud slash). **NO WORDS**.

4.  **Synced Status** (`static/images/icon-status-synced.png`)
    -   **Regenerate this last** or separately.
    -   Change: Single neon line outline instead of double line.

## Verification Plan

### Manual Verification
- **Visual Inspection:** Open the generated images in the Artifacts list or file explorer to verify:
    -   Style matches "neon on black".
    -   Background is pure black.
    -   No text in Pending/Offline icons.
    -   Sync icon has single line.
-   **PWA Verification:** (Optional/User to conduct) consistency of app icon.
