# Auth Refresh on Click Implementation Plan

## Problem
Users returning to the app after a long absence (>1h, <48h) find their session expired. The automatic background refresh might be failing due to lack of user gesture (browser restrictions on `requestAccessToken` or 3rd party cookie blocking), requiring a full sign-out/sign-in.

## Solution
Attach a global `click` listener in the root layout that triggers `ensureValidToken()`. This ensures that when a user interacts with the app (e.g., clicking "Log Food" or "Save"), the token refresh process is initiated *with* a user gesture context, improving reliability. Since `ensureValidToken` dedupes requests via `refreshPromise`, this is efficient and safe.

## Proposed Changes

### [Layout]
#### [MODIFY] [src/routes/+layout.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
- Add `onMount` event listener for `click` (capture phase).
- Handler calls `ensureValidToken()` from `$lib/auth`.
- Log the preemptive check for debugging.

## Verification Plan

### Automated
- We cannot easily test "user gesture requirements" in a headless browser standard test, but we can verify that `ensureValidToken` is called on click.
- We will rely on manual verification or existing auth tests to ensure no regression.

### Manual Verification
1.  **Simulate Expiry**: Manually set `food_log_token_expiry` in localStorage to a time in the past (but within 48h).
2.  **Click Interaction**: Click anywhere in the app.
3.  **Verify Refresh**: Check console logs for "Refreshing auth token..." and confirm it succeeds without signing out.
4.  **Verify Sync**: Perform an action (like Logging) and ensure it succeeds immediately.
