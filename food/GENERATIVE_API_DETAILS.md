# Generative AI & API Details

**Food Sheets** operates on a "Bring Your Own Credentials" model (via OAuth), meaning it runs entirely within your personal Google Cloud/Gemini context. This document explains the technical details of the API integration.

## Architecture

The application is "Serverless" in the strictest sense. There is no middle-man server owned by the developers.
- **Client:** The web app running in your browser.
- **Backend:** Your personal Google Drive and the Google Gemini API.

### Authentication
We use **Google OAuth 2.0** to obtain a strict, limited-scope access token directly from Google Identity Services.
- **Token Storage:** The access token is stored in your device's local storage (sandboxed to the app domain).
- **Transmission:** The token is sent *only* to `*.googleapis.com` endpoints. It never touches a developer server.

## API Usage

### 1. Nutrition Analysis (Gemini Flash)
- **Endpoint:** `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Method:** POST
- **Data Sent:**
    - Your food image (Base64 encoded)
    - A system prompt instructing the AI to act as a dietician
    - Optional text context you provide
- **Privacy Implication:** This request acts as a standard API call from your Google Account.
    - **Free Tier:** If you are using a standard free Google account, Google [may use this data to improve their models](https://ai.google.dev/gemini-api/terms).
    - **Paid/Enterprise:** If your account is covered by a Workspace Enterprise agreement or you have paid API billing enabled, data protections are stricter.



## Data Retention & Training

Because the app uses your personal OAuth credentials:
1.  **Food Sheets (The App):** Has zero access to your data outside of your active browser session. We cannot see, store, or train on your data.
2.  **Google (The Provider):** Handles data according to the [Google Terms of Service](https://policies.google.com/terms) and [Generative AI Additional Terms of Service](https://policies.google.com/terms/generative-ai).

> **Note on Service Tiers & Control:** Because Food Sheets operates through your personal credentials, you retain full control over your privacy level. While standard personal Google Accounts default to the "Consumer" tier (where data may be used for model improvement), you have the option to upgrade your own Google Account to a Paid or Enterprise tier if you require strict data isolation. The application automatically respects and inherits the privacy protections of your specific account status.
