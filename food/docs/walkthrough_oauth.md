# OAuth Scope Reduction Verification

I have removed the `https://www.googleapis.com/auth/spreadsheets` scope. The application now uses the `https://www.googleapis.com/auth/drive.file` scope, which grants access *only* to files created or opened by the app.

## Changes
- **Modified**: `src/lib/auth.ts` - Removed `spreadsheets` from the `SCOPES` array.

## Manual Verification Steps

Because the OAuth Consent Screen is controlled by Google, I cannot verify this change with automated tests. Please perform the following:

1.  **Sign Out**: Open the app and sign out, or clear your local storage/cookies.
2.  **Sign In**: Click "Sign In with Google".
3.  **Check Permissions**:
    - **Observe**: The consent screen should NO LONGER ask to "See, edit, create, and delete all your Google Sheets spreadsheets".
    - **Observe**: It SHOULD ask to "View and manage Google Drive files and folders that you have opened or created with this app".
4.  **Test Functionality**:
    - Ensure you can still see your logs (Read).
    - Add a new entry (Write).
    - *Note*: If you are an existing user and don't see the consent screen, you might need to revoke the app's access in your Google Account settings to force a re-consent.

> [!TIP]
> **Force Re-consent**: Go to [Google Account Permissions](https://myaccount.google.com/permissions), find the "Food Tracker" (or whatever name is used), and remove access. Then sign in again to see the new requested scopes.
