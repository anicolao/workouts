# Auth Refresh on Click Walkthrough

## Changes
- **Modified `src/routes/+layout.svelte`**:
    - Added global `document.addEventListener('click', ...)` in `onMount`.
    - Handler calls `ensureValidToken()` from `$lib/auth`.
    - Added cleanup logic in `$effect` return.

## Verification
### Manual Verification Steps
1.  **Wait for Expiry**: Allow token to expire (or artificially set expiry in localStorage to past).
2.  **Click anywhere**: Click on the "Log Food" button or any neutral area.
3.  **Observe Console**: Check DevTools console for `[Auth] Token expired/buffered... Refreshing...` followed by successful token acquisition.
4.  **No Sign-out**: Ensure the user is NOT signed out and can proceed with logging immediately.

## Automated Tests
- No new E2E tests added as "user gesture" context is specific to browser security models and hard to mock reliably in headless Chrome without actually triggering the same security constraints. The existing auth unit tests ensure `ensureValidToken` logic itself is sound.
