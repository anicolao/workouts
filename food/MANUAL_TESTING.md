# Manual Testing Guide

This guide describes how to manually verify the MVP functionality of the Food application. Since the E2E tests mock external services, manual testing is crucial to verify real integrations (Google Auth, Sheets, Drive, Gemini).

## Prerequisites

1.  **Google Cloud Project**: You need a project with Sheets, Drive, and Photos APIs enabled.
## Prerequisites

1.  **Google Cloud Project**: You need a project with Sheets, Drive, and Photos APIs enabled.
2.  **Credentials**: Create an OAuth 2.0 Client ID and configure `VITE_GOOGLE_OAUTH_ID` in `.env`.
3.  **Test User**: A Google account added to the test users list (if app is in testing mode).

## Scenarios to Verify

### 1. Authentication & Discovery (US-001, US-002, US-013)
-   [ ] Clear local storage/cookies.
-   [ ] Click "Sign In with Google".
-   [ ] Verify the permission consent screen asks for Drive and Sheets access.
-   [ ] **Validation**: Check Google Drive.
    -   Verify a folder named `FoodLog` was created (or found).
    -   Verify a spreadsheet named `Events` exists inside it.

### 2. Logging Flow (US-003 to US-008)
-   [ ] Click "Log Food".
-   [ ] **Camera**: Take a picture of a nutrition label (if on mobile) OR
-   [ ] **Upload**: Select the `assets/images/nutrition-facts-canada.png` file.
-   [ ] Verify the image preview is shown.
-   [ ] Wait for analysis.
-   [ ] **Verify**: The Estimated Nutrition Facts match the image (Calories: 110, Fat: 0, Carbs: 26, etc.).
-   [ ] **Edit**: Change "Calories" to `120`.
-   [ ] Select Meal Type: "Snack".
-   [ ] Click "Save".

### 3. Data Persistence (US-009, US-010)
-   [ ] **Check Sheets**: Open the connected Google Sheet.
    -   Verify a new row in `Events` with `ActionType: log/confirmed`.
-   [ ] **Check Drive**: Go to Google Drive.
    -   Verify a new image exists in the `FoodApp` folder.

### 4. Insights (US-012)
-   [ ] Return to Dashboard.
-   [ ] Verify "Total Calories" has increased by 120.
