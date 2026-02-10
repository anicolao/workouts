# OAuth Configuration Setup

This document explains how to configure OAuth credentials for the deployed application.

## Overview

The application requires a Google OAuth Client ID to authenticate users and access Google services (Drive, Sheets, Photos, Gemini AI). This credential is provided at build time through a GitHub Secret environment variable.

## Required GitHub Secret

You need to configure the following secret in your GitHub repository:

### GOOGLE_OAUTH_ID (Required)
The OAuth 2.0 Client ID for Google authentication and all Google services.

**How to obtain:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
   - Google Photos Library API
   - Generative Language API (Gemini)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins (replace with your actual GitHub Pages URL):
   - For this repository: `https://anicolao.github.io`
   - For your fork: `https://YOUR_USERNAME.github.io`
7. Add authorized redirect URIs (replace with your actual GitHub Pages URL):
   - For this repository: `https://anicolao.github.io/food/`
   - For your fork: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
8. Copy the Client ID (looks like: `123456789-abcdef.apps.googleusercontent.com`)

## Setting Up Secret in GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:

```
Name: GOOGLE_OAUTH_ID
Value: 123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## How It Works

1. **Build Time**: GitHub Actions provides the secret as environment variable `VITE_GOOGLE_OAUTH_ID`
2. **Vite Build**: Vite embeds the value into the built JavaScript bundle
3. **Runtime**: The application uses the embedded value for OAuth authentication

The `VITE_` prefix tells Vite to embed the environment variable at build time.

## Security Considerations

- The secret is stored securely in GitHub Secrets (encrypted at rest)
- The secret is only accessible during GitHub Actions workflow execution
- The OAuth Client ID is embedded in the built application (it's a public identifier, not a secret)
- The OAuth Client ID should be restricted to specific origins and redirect URIs in Google Cloud Console to prevent misuse

## Local Development

For local development, create a `.env` file in the project root:

```env
VITE_GOOGLE_OAUTH_ID=your-client-id.apps.googleusercontent.com
```

The application will use this environment variable during local development.

## Verifying the Configuration

After deployment:

1. Visit the deployed application at https://anicolao.github.io/food/
2. Click the sign-in button
3. You should see the Google OAuth consent screen
4. After signing in, the app should work normally

If authentication fails:
- Check that the GitHub Secret `GOOGLE_OAUTH_ID` is set correctly
- Review the GitHub Actions workflow logs for build errors
- Verify the OAuth Client ID is configured correctly in Google Cloud Console
- Check browser console for any OAuth-related errors

## Updating Credentials

To update the OAuth Client ID:

1. Update the secret value in GitHub repository settings
2. Trigger a new deployment (push to main or manually trigger workflow)
3. The new credential will be embedded in the rebuilt application

The application must be rebuilt for credential changes to take effect.
