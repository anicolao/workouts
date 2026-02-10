# Privacy Policy for Food Sheets

**Last Updated:** January 18, 2026

## The Short Version
**Food Sheets** is an Open Source application designed with a "Privacy First" architecture.
* **No Developer Servers:** We do not own a database. We do not store your data.
* **Your Drive, Your Data:** All food logs, photos, and nutrition stats are saved directly to *your* personal Google Drive.
* **Sandboxed Access:** The app is restricted so it can *only* access the specific files it creates. It cannot read your other personal spreadsheets or documents.

---

## 1. Data Collection and Storage Architecture

### Sandboxed Google Drive Access
We utilize the `drive.file` permission scope, which provides a "Strictly Sandboxed" level of access.
* **What we DO:** The application creates a specific Google Sheet (for your logs) and a folder (for your food photos) in your Google Drive. We can read and edit *only* these specific files.
* **What we DO NOT:** We have absolutely no access to existing spreadsheets, tax documents, or any other files in your Google Drive that were not created by Food Sheets.

### Photos and Camera
We use the system's native Photo Picker (`photospicker.mediaitems.readonly`).
* **User-Initiated Only:** The application does not have general access to your camera roll. It can only process the specific images you explicitly tap to select for analysis.
* **No Background Scanning:** We **cannot** scan or access your library in the background.

## 2. Artificial Intelligence & Semantic Memory

To estimate calories, Food Sheets uses the **Google Gemini API**.

### Image Analysis
When you select a food photo, it is sent to the Gemini API for analysis.
* **Direct Connection:** The app connects directly to Google's API using your personal credentials. No developer server sits in the middle.
* **Data Usage:** Your data is subject to [Google's Gemini API Terms](https://ai.google.dev/gemini-api/terms). If you are using a standard free Google Account, Google may use anonymized data to improve their models.
* **Retention:** Google may temporarily retain API logs for abuse monitoring.


## 3. Account & Authorization

### Google Sign-In (OAuth)
We use Google OAuth 2.0 to authenticate you. This allows the application to act as an agent on your behalf using your own Google Account.
* **Your Control:** You authorize the application to perform specific actions (like "Save to Drive") using your own account's quota.
* **No Password Access:** We never see or store your Google password. The authorization is handled securely via a token stored in your device's secure keychain.

## 4. Third-Party Services & Compliance

The application relies on the following platform services to function:
* **Google Drive API:** For file storage.
* **Google Gemini API:** For nutritional analysis and memory.

### Google Limited Use Policy
Food Sheets' use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## 5. Analytics and Tracking
To maintain strict privacy:
* **No Third-Party Analytics:** We do not use tools like Google Analytics, Mixpanel, or Facebook Pixel.
* **No Advertising ID:** We do not collect your device's Advertising ID.
* **Crash Reporting:** Minimal anonymous crash logs may be sent to Apple/Google (based on your system settings) to help us fix bugs, but these contain no personal health data.

## 6. AI Accuracy Disclaimer
This application uses Artificial Intelligence to estimate nutritional information.
* **Estimates Only:** AI-generated calorie and macro counts are estimates and may not be 100% accurate.
* **Not Medical Advice:** Do not rely on these estimates for critical medical decisions (e.g., insulin dosing). Always verify the data manually if you have strict dietary requirements.

## 7. Your Rights (Data Deletion)
Since your data resides in your own Google Drive and Gemini Corpus:
1.  **Full Control:** You can delete your "Food Sheets" folder in Google Drive at any time to remove your logs.
2.  **Revoking Access:** You can revoke the app's access to your account at any time via your Google Account security settings (`myaccount.google.com/permissions`).

## 8. Changes to This Policy
Because the code is Open Source, any changes to how data is handled will be visible in the public code repository. If we make material changes to this policy, we will notify users through an app update.

## 9. Contact Us
If you have questions about this privacy policy or the open-source nature of the project, please contact:

**Alex Nicolaou / alex@stockgamblers.com**
[https://github.com/anicolao/food](https://github.com/anicolao/food)
