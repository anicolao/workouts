# Implementation Plan - Restore Gemini API OAuth Scope

The user is experiencing 403 Forbidden errors when using the Gemini API. This is caused by insufficient OAuth scopes after a recent cleanup. This plan restores the minimum required scope for the Gemini API.

## User Review Required

> [!IMPORTANT]
> This change will likely require you (and all users) to sign out and sign back in to grant the new permission.

## Proposed Changes

### Auth Configuration

#### [MODIFY] [auth.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/auth.ts)
- Add `https://www.googleapis.com/auth/generative-language.retriever` to the `SCOPES` list.
- Rationale: This is the standard scope needed for Gemini API interaction when using OAuth.

### Documentation & Privacy

#### [MODIFY] [privacy/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/privacy/+page.svelte)
- Update the "Artificial Intelligence" section to explicitly mention the `generative-language.retriever` scope.
- Explain that this permissions allows the "Food Sheets" app to send prompts to the AI service on your behalf.
- Enforce the "Cannot vs Does Not" pattern: Clarify that while this scope is needed, it effectively limits us to the Generative Language service and doesn't grant broad access to your Google Cloud projects.

## Verification Plan

### Manual Verification
1.  **Sign Out**: Manually sign out of the application to clear the old token.
2.  **Sign In**: Sign in again.
3.  **Check Permissions**: Verify the Google consent screen asks for "Manage your own generative language data" (or similar phrasing).
4.  **Test Analysis**: Use the "Analyze Food" feature (e.g. by typing "an apple" in the log page) and confirm it succeeds without a 403 error.
