# State of the Union: Codebase Review
**Date:** 2026-01-14
**Scope:** `src/` directory

## Executive Summary
A comprehensive review of the source code reveals a codebase that is functionally active but carries significant "invisible" technical debt. While there are **zero explicit `TODO`, `FIXME`, or `BUG` comments**, the code contains numerous implicit issues, including unchecked types, debug logging in production paths, and specific framework workarounds.

## 1. Explicit Findings
*   **TODO/FIXME Markers:** 0 found.
*   **Console Logs:** High distinct count. Debug logging is present in critical paths (`auth.ts`, `google-photos.ts`, `+page.svelte`), some tagged with `[CI-DEBUG]`.

## 2. Technical Debt & Code Quality

### Type Safety Holes
The codebase relies on `@ts-ignore` and `any` in key integration points, bypassing TypeScript's safety guarantees.
*   **`src/routes/log/+page.svelte`**: Uses `@ts-ignore` for `exifr` library and store state access.
*   **`src/lib/google-photos.ts`**: Uses `any` type for API response mapping (`listSessionMediaItems`, `listLibraryItems`).
*   **`src/routes/entry/+page.svelte`**: Uses `@ts-ignore` for `galleryContainer` binding and config access.

### Logic "Hacks" & Workarounds
Specific patterns exist that suggest unresolved framework or architectural challenges:
*   **Svelte 5 Reactivity**: A "force render tick" hack (`await new Promise(r => setTimeout(r, 1))`) exists in `log/+page.svelte` to handle state updates during analysis.
*   **Flat State**: A comment in `log/+page.svelte` explicitly mentions using flat state variables "to avoid reactivity issues with Svelte 5 nested objects."
*   **Monologue Comments**: `src/lib/google-photos.ts` contains conversational comments (`// Actually Library API format...`) debugging API structures inline.

### Error Handling
*   **Silent Failures**: In `src/routes/entry/+page.svelte` (and potentially others), failures during Google Sheet synchronization are caught and logged to console (`console.error`), but provide no visual feedback to the user, potentially leaving the UI in a "saved" state while the backend fails.

## 3. UX/UI Gaps
*   **Native Alerts**: `src/routes/entry/+page.svelte` uses the browser-native blocking `confirm()` dialog for deletions. This breaks the custom UI immersion (Glassmorphism).
*   **Hardcoded Logic**: Meal type determination in `log/+page.svelte` relies on hardcoded hour thresholds.

## Recommendations
1.  **Strip Debug Logs**: Remove `console.log` statements, especially those tagged `[CI-DEBUG]`, or move them to a conditional logger.
2.  **Harden Types**: Create interface definitions for `exifr` and the Google Photos API responses to remove `@ts-ignore` and `any`.
3.  **Standardize Errors**: Implement a toast or notification system for backend failures (e.g., Sheets sync) to replace console errors.
4.  **Refactor "Hacks"**: Investigate Svelte 5 best practices to replace the `setTimeout` render tick and flat state workaround.
