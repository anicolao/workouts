# Reduce OAuth Scopes

The application currently requests the `https://www.googleapis.com/auth/spreadsheets` scope, which grants read/write access to *all* of a user's Google Sheets. This triggers a scary warning during sign-in.

Since the application uses a strict folder structure (`FoodLog`) and manages its own database file (`TheFoodTrackerEventLog`), we can rely on the `https://www.googleapis.com/auth/drive.file` scope. This scope grants the application access *only* to files it has created or opened, which is exactly what we need and follows the principle of least privilege.

## User Review Required
> [!IMPORTANT]
> This change will alter the permissions requested during the next sign-in.
> **Existing users** might not see a change immediately unless they re-authorize or if the scopes change triggers a re-consent.
> **New users** will see a much friendlier permission request: "View and manage Google Drive files and folders that you have opened or created with this app" instead of "See, edit, create, and delete all your Google Sheets spreadsheets".
>
> **Potential Edge Case**: If a user *manually* created the `FoodLog` folder and `TheFoodTrackerEventLog` file (not via the app), the app might lose access to it because it didn't create it. However, the app's logic handles "File not found" by creating a new one. In the worst case of a manual setup, the app might create a duplicate "FoodLog" folder. Given the app's specialized nature, this is an acceptable trade-off for security.

## Proposed Changes

### Auth
#### [MODIFY] [auth.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/auth.ts)
- Remove `https://www.googleapis.com/auth/spreadsheets` from the `SCOPES` list.

## Verification Plan

### Automated Tests
- No automated E2E tests can verify the *OAuth Consent Screen* content as it's an external Google page.
- Existing E2E tests (like `002-log-food.spec.ts`) mock the network layer, so they won't fail, but they also won't verify the scope change works against real APIs.

### Manual Verification
1.  **Sign Out**: Clear local storage or use an incognito window.
2.  **Sign In**: Observe the Google Permissions dialog.
    - **Verify**: It should NO LONGER ask to "See, edit, create, and delete all your Google Sheets spreadsheets".
    - **Verify**: It SHOULD ask to "View and manage Google Drive files and folders that you have opened or created with this app".
3.  **Functionality Check**:
    - Ensure the app loads the dashboard (reads from Sheets).
    - Log a food item (writes to Sheets).
    - Ensure no 403 Forbidden errors occur.
