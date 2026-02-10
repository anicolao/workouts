# implementation_plan.md

# Goal Description
Improve the user experience around synchronization failures. Instead of silent console errors or transient toasts, users should see a persistent visual indicator (red icon) when sync fails. Clicking this indicator should lead to the Network Settings page, which will provide a clear error message and actionable resolution steps (specifically, suggesting "Reset Cache & Resync" if the issue persists).

## User Review Required
> [!IMPORTANT]
> This plan introduces a new "Error" state to the `NetworkStatus` component which overrides the "Online/Offline" checkmark.

## Proposed Changes

### Lib Layer

#### [MODIFY] [sync-manager.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/sync-manager.ts)
- Add a writable store `syncError` (or similar state property) to `syncManager`.
- Update `sync()` function to:
    - Clear `syncError` on start or successful completion.
    - Set `syncError` with a user-friendly message/code when exceptions occur (currently caught and logged).
    - Specifically handle `400` errors (already caught) and `403` (auth) errors.

### UI Components

#### [MODIFY] [NetworkStatus.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/NetworkStatus.svelte)
- Subscribe to `syncManager.syncError` (or poll it).
- If `syncError` is present:
    - Show a red warning icon (replacing the green check/offline cloud).
    - Update `aria-label` to indicate error.
    - Ensure click still navigates to `/settings/network`.

### Pages

#### [MODIFY] [src/routes/settings/network/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/settings/network/+page.svelte)
- Subscribe/Poll `syncManager.syncError`.
- Add a new "Sync Status" or "Troubleshooting" section at the top (below header) if an error exists.
- Display the error message.
- Provide a "Recommended Action" text (e.g., "If this persists, try resetting the cache.").
- Highlight the "Reset Cache & Resync" button (maybe duplicate it or point to it).

## Verification Plan

### Manual Verification
1.  **Happy Path**:
    - Load app, ensure green check.
    - Log an item, ensure it syncs (green check returns).
2.  **Error Path (Simulated)**:
    - Temporarily modify `sync-manager.ts` to throw an error during sync (e.g., `throw new Error("Simulated Sync Fail")`).
    - Trigger sync.
    - Verify `NetworkStatus` icon turns red.
    - Click icon -> Verify navigation to `/settings/network`.
    - Verify "Troubleshooting" section appears with "Simulated Sync Fail" message.
    - Verify "Reset Cache & Resync" button is visible/highlighted.
    - Click "Reset Cache", confirm logic runs (console logs).
