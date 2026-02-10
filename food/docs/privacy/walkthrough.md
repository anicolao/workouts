# Privacy Policy Implementation Walkthrough

The privacy policy has been successfully implemented and integrated into the application.

## Changes
- **Created `PRIVACY.md`:** Added the full text of the privacy policy to the root of the repository.
- **New Route `/privacy`:** Implemented a styled Privacy Policy page in the SvelteKit app (`src/routes/privacy`).
- **Updated `README.md`:** Added a "Privacy Policy" link to the existing "Privacy First" feature bullet.

## Verification
- **Build Check:** Ran `npm run build` which completed successfully, ensuring no syntax errors or routing issues.

## OAuth Configuration Instructions

To complete the setup, you must update your Google Cloud Console configuration:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project ("Food Sheets" or similar).
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
4.  Click **Edit App**.
5.  In the **App domain** section, find the **Privacy policy link** field.
6.  Enter your deployed privacy policy URL:
    *   `https://anicolao.github.io/food/privacy` (or your custom domain if different)
7.  Click **Save and Continue** until you look through the summary and finish.

> [!NOTE]
> This link will be visible to users when they sign in with Google.
