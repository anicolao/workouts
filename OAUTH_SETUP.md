# OAuth Configuration Setup

This document explains how to configure OAuth credentials for the deployed application.

## Overview

The application requires a Google OAuth Client ID to authenticate users. This credential is provided at build time through a GitHub Secret environment variable.

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
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins (replace with your actual GitHub Pages URL):
   - For this repository: `https://anicolao.github.io`
   - For your fork: `https://YOUR_USERNAME.github.io`
   - For this repository: `https://anicolao.github.io`
   - For your fork: `https://YOUR_USERNAME.github.io`
7. **Note on Redirect URIs**: With the Popup UX, the "Authorized redirect URIs" setting is less critical for the sign-in flow itself, but you should still add your base production URL.
   - For this repository: `https://anicolao.github.io/workouts/`
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

## Local Development

For local development, create a `.env` file in the project root:

```env
VITE_GOOGLE_OAUTH_ID=your-client-id.apps.googleusercontent.com
```

The application will use this environment variable during local development.
