# Setting up Google API Key for Public Sharing

To allow the Food Log to discover shared files without requiring the user to sign in *and* have strict permissions, we use a Google API Key for "Anonymous" discovery of public folders.

## 1. Create API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your project (the same one used for OAuth).
3. Click **+ CREATE CREDENTIALS** > **API key**.
4. The key will be created. Copy it.

## 2. Restrict the Key (Highly Recommended)
Unrestricted keys can be used by anyone who finds them. You should restrict this key to your specific domain and APIs.

1. Click **Edit API key** (pencil icon).
2. Under **Application restrictions**, select **Websites**.
3. Add the following items to **Website restrictions**:
   - `http://localhost:5173/*` (for local development)
   - `https://anicolao.github.io/*` (or your specific GitHub Pages URL)
4. Under **API restrictions**, select **Restrict key**.
5. Select the following APIs from the dropdown:
   - **Google Drive API**
   - **Google Sheets API**
6. Click **Save**.

## 3. Add to GitHub Secrets
To make this key available during deployment:

1. Go to your GitHub Repository.
2. Click **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. **Name**: `GOOGLE_API_KEY`
5. **Secret**: Paste your API Key starting with `AIza...`
6. Click **Add secret**.

## 4. Local Development
To use this key locally:
1. Open `.env` (or `.env.local`).
2. Add: `VITE_GOOGLE_API_KEY=your_api_key_here`
3. Restart the dev server (`npm run dev`).

Once configured and deployed, the "Shared Log not found" issue should resolve for public folders.
