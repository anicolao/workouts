# OAuth Token Auto-Refresh Implementation Plan

## Goal Description
Implement proactive token refreshment to keep the user logged in as long as possible. Currently, the access token expires in 1 hour, forcing the user to re-authenticate. We will add logic to silently refresh the token before it expires using Google Identity Services `requestAccessToken({ prompt: '' })`.

## Proposed Changes

### Auth Library
#### [MODIFY] [auth.ts](file:///Users/anicolao/projects/antigravity/food-fixups/src/lib/auth.ts)
- Add a `refreshAuth()` function that calls `tokenClient.requestAccessToken({ prompt: '' })`.
- Add a `scheduleRefresh(expiresInSeconds)` function.
    - Clears any existing timeout.
    - Sets a timeout for `(expiresInSeconds - 300) * 1000` (5 minutes before expiry).
    - If `expiresInSeconds` is less than 300, refresh immediately (or very soon).
- Update `initClient` callback:
    - Call `scheduleRefresh` with the returned `expires_in`.
- Update `initializeAuth`:
    - When restoring token, calculate remaining time.
    - Call `scheduleRefresh` with the remaining time.
- Update `signOut`:
    - Clear the refresh timeout.
- Add `visibilitychange` event listener to check expiry and refresh if needed when the user returns to the tab (recovering from sleep).

## Verification Plan

### Manual Verification
1.  **Short Expiry Test**:
    - Temporarily modify `auth.ts` to set `expiresInSeconds` to `60` (1 minute) in `initClient`, and maybe `10` seconds for the refresh buffer.
    - Log in to the application.
    - Open the specific devtools (Network tab).
    - Filter for `oauth2` or requests to Google.
    - Wait for 1 minute (or the shortened time).
    - **Expectation**: A new token request is triggered automatically. The local storage `food_log_token_expiry` updates to a new future time.
    - Reload the page.
    - **Expectation**: You are still logged in.

2.  **Persistence Test**:
    - Log in.
    - Refresh the page.
    - **Expectation**: You stay logged in (this already works, but verifying regressions).

3.  **Sleep Test** (Optional but recommended):
    - Close the laptop lid or background the tab for > 1 hour (or the modified short duration).
    - Wake up / focus tab.
    - **Expectation**: The `visibilitychange` handler triggers a check, sees it's expired or about to, and triggers a refresh.
