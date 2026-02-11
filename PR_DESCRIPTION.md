# Reviewed E2E Tests & Config

## Description
This PR addresses several issues found during a review of the E2E testing setup. It enforces stricter timeouts, fixes a race condition in the authentication flow, and optimizes test determinism.

## Changes
-   **Strict Timeouts**: Added `actionTimeout: 2000` to `playwright.config.ts` to fail tests quickly if an action hangs.
-   **Race Condition Fix**: The "Sign In" button is now disabled until the Google Identity Services client is fully initialized. This prevents users (and tests) from clicking too early.
-   **Test Optimization**: `auth.ts` now checks for `window.google` immediately, removing unnecessary waits in tests where the script is already loaded.

## Original Request
> Read all the markdown in this repository to understand teh development process and where we are at so far. Review the e2e test(s) and make sure they adhere to all guidelines, and time them to make sure their timeouts are reasonably tight. Report back wehn you think the repository is ready for us to begin working on the next user story.
