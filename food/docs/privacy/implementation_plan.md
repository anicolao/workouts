# Privacy Policy Implementation Plan

## Goal
Implement a Privacy Policy page at `/food/privacy` (mapped to `/privacy` in the SvelteKit app), add the policy text to the repository/README, and provide instructions for updating the Google OAuth configuration.

## Proposed Changes

### [Repository Root]
#### [NEW] [PRIVACY.md](file:///Users/anicolao/projects/antigravity/food/PRIVACY.md)
- Create this file containing the full text of the Privacy Policy provided by the user.

#### [MODIFY] [README.md](file:///Users/anicolao/projects/antigravity/food/README.md)
- Add a "Privacy Policy" section or link pointing to `PRIVACY.md` and the deployed URL.

### [SvelteKit App]
#### [NEW] [src/routes/privacy/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/privacy/+page.svelte)
- Create a new route for the privacy policy.
- Content will be the HTML representation of the provided markdown.
- Will use standard HTML tags (`h1`, `h2`, `ul`, `li`, `section`) styled with tailwind or existing CSS classes to match the app's look and feel.

#### [NEW] [src/routes/privacy/+page.ts](file:///Users/anicolao/projects/antigravity/food/src/routes/privacy/+page.ts)
- (Optional) Set prerender settings if needed, but default static adapter behavior should handle it.

## Verification Plan

### Automated Tests
- None required for this static content change.
- I will verify the build succeeds if I run `npm run build` (optional, as I don't want to waste time building the whole app if not needed).

### Manual Verification
- I will inspect the created `src/routes/privacy/+page.svelte` code to ensure it matches the provided text.
- I will verify `PRIVACY.md` is created.
- I will verify `README.md` contains the link.

## OAuth Setup Instructions
- I will provide a clear set of steps for the user to update the "Privacy Policy URL" in the Google Cloud Console to `https://<their-domain>/food/privacy`.
