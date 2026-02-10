# Verification: Gemini API Scope Restoration

I have restored the `generative-language.retriever` scope to the application's authentication configuration. This should resolve the 403 Forbidden errors when using Gemini features.

## Changes Made
- **[auth.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/auth.ts)**: Added `https://www.googleapis.com/auth/generative-language.retriever` to the OAuth scopes list.
- **[privacy/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/privacy/+page.svelte)**: Updated the privacy policy to explicitly list this scope and its purpose.

## Verification Steps

### 1. Re-Authenticate (CRITICAL)
For the new scope to take effect, you **must** sign out and sign back in. The existing token in your local storage does not have the new permission.

1.  Open the application.
2.  Go to the settings or user menu and click **Sign Out**.
3.  Click **Sign In** with Google.
4.  **Verify Consent Screen**: When the Google popup appears, ensure it asks for permission to "Manage your own generative language data" (or similar wording).

### 2. Test Food Analysis
1.  Navigate to the `/log` page.
2.  Type a text description (e.g., "a banana") into the input box and press Enter.
    *   *Alternatively, upload an image if you prefer.*
3.  **Confirm Success**: The "Analyzing..." state should resolve into a nutrition card without throwing a `403 Forbidden` error.

### 3. Check Privacy Policy
1.  Navigate to the `/privacy` page.
2.  Verify that the "Artificial Intelligence" section now mentions the `generative-language.retriever` scope.
