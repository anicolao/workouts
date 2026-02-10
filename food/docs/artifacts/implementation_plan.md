# implementation Code - MVP

This plan details the implementation of the Minimum Viable Product (MVP) for the Food application.

## User Review Required

> [!IMPORTANT]
> The MVP involves complex integrations (Google Drive, Sheets, Gemini). We will prioritize a local-first development approach where possible, mock APIs for E2E, and use the `EVENTS` sheet as the single source of truth.

## Proposed Changes

### 1. Initialization
#### [NEW] [SvelteKit Config](file:///Users/anicolao/projects/antigravity/food/svelte.config.js)
-   Initialize SvelteKit with `bun`.
-   Configure plain CSS (no Tailwind).

### 2. Core Architecture (Redux)
#### [NEW] [src/lib/store.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/store.ts)
-   Configure Redux store.
-   Implement `eventLog` slice (append-only).
-   Implement value slices (Log, DailyStats) as pure reducers of the event log.

### 3. Authentication
#### [NEW] [src/lib/auth.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/auth.ts)
-   Implement Google OAuth flow.
-   Scopes: `drive.file`, `spreadsheets`.

### 4. Features
#### [NEW] [src/routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
-   **Dashboard**: Display Daily Stats (US-012).
- [x] **Core UI/Logic**
  - [x] `routes/+page.svelte` (Dashboard)
  - [x] `routes/log/+page.svelte` (Log Flow)
  - [x] `lib/store.ts` (Redux)
  - [x] `lib/auth.ts`, `lib/sheets.ts`, `lib/gemini.ts`
  - [x] `tests/e2e/helpers/test-step-helper.ts`o input (US-003, US-004, US-005).
-   **Analysis**: Call Gemini API (US-006).
-   **Edit**: Form to review/edit values (US-007, US-008).
-   **Save**: Dispatch `log/confirmed` event.

### 5. Services (Backend/API)
#### [NEW] [src/lib/gemini.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/gemini.ts)
-   Client-side or proxy call to Gemini Flash.
-   System prompt for Canadian Nutrition Facts.

#### [NEW] [src/lib/sheets.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/sheets.ts)
-   `appendEvent(event)`: Write JSON blob to `Events` sheet.
-   `sync()`: Basic replay logic (if needed for initial load).

### 6. Testing
#### [NEW] [tests/e2e/](file:///Users/anicolao/projects/antigravity/food/tests/e2e/)
-   **001-auth**: Sign in flow.
-   **002-log-food**: Full flow (Photo -> AI Mock -> Edit -> Save).
-   **003-stats**: Verify stats update after logging.

#### [NEW] [MANUAL_TESTING.md](file:///Users/anicolao/projects/antigravity/food/MANUAL_TESTING.md)
-   Guide for setting up Google Credentials and running through user stories.

### 7. Enhanced MVP Visuals
#### [MODIFY] [src/routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
-   **Visual History (US-010)**: Display image thumbnails in the history list.
-   **Meal Type (US-008)**: Display meal type badges (Breakfast/Lunch/Dinner/Snack).

### 8. UX Refinements (User Feedback)
#### [MODIFY] [src/routes/log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
-   **Split Capture/Upload**: Add distinct buttons for "Take Photo" (capture=environment) and "Upload" (file picker).
-   **Smart Defaults**: Set `mealType` based on current time (e.g. 12:00 -> Lunch).

#### [MODIFY] [src/routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
-   **Drive Link**: Wrap thumbnail in link to Drive file for easy access (US-010).

#### [MODIFY] [tests/e2e/002-log-food/002-log-food.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/002-log-food/002-log-food.spec.ts)
-   Verify both upload buttons exist.
-   Verify meal type dropdown is visible and defaults correctly (mock time).
-   Verify Drive link in history.

### 9. Auth & Gemini Refactor
#### [MODIFY] [src/lib/auth.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/auth.ts)
-   **Fix**: Update `GOOGLE_CLIENT_ID` to match `.env` variable `VITE_GOOGLE_OAUTH_ID`.
-   **Scopes**: Add `https://www.googleapis.com/auth/generative-language.retriever` (or appropriate scope) for Gemini.

#### [MODIFY] [src/lib/gemini.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/gemini.ts)
-   **Refactor**: Remove `GoogleGenerativeAI` SDK dependency.
-   **Implementation**: Use `fetch` calling `https://generativelanguage.googleapis.com/...` directly with `Authorization: Bearer <token>`.
-   **State**: Accept `accessToken` from `auth.ts` (passed in or retrieved).

### 10. Per-User Data Persistence (Refactor)
#### [MODIFY] [src/lib/sheets.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/sheets.ts)
-   **Remove**: `SPREADSHEET_ID` constant.
-   **Add**: `ensureDataStructures()`:
    1.  Search Drive for folder `FoodLog` (mimeType = folder). Create if missing.
    2.  Search inside folder for file `Events` (mimeType = spreadsheet). Create if missing.
    3.  Return `{ folderId, spreadsheetId }`.

#### [MODIFY] [src/routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
-   **Logic**: Call `ensureDataStructures()` upon successful auth.
-   **State**: Store `spreadsheetId` and `folderId` in Redux `config` slice (or local store).

#### [MODIFY] [src/routes/log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
-   **Logic**: Retrieve `spreadsheetId` associated with current user session for appending rows.

### 11. Photo UX Refactor
#### [MODIFY] [src/routes/log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
-   **Camera UI**: Implement `<video>` and `navigator.mediaDevices.getUserMedia` overlay for "Take Photo".
    -   Add "Capture", "Switch Camera" (if multiple), and "Cancel" buttons.
-   **Camera UI**: Implement `<video>` and `navigator.mediaDevices.getUserMedia` overlay for "Take Photo".
    -   Add "Capture", "Switch Camera" (if multiple), and "Cancel" buttons.
-   **Google Photos**: Replace "Upload File" with "Pick from Photos".
    -   Implement REST-based Picker Flow (`https://photospicker.googleapis.com/v1/sessions`) which requires NO API KEY, only OAuth.
    -   Authenticate with `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`.
    -   Create session, open `pickerUri`, poll for completion (`mediaItemsSet`).
    -   Retrieve `mediaItems` and fetch bytes from `baseUrl` (public/authenticated URL).

## Verification Plan

### Automated Tests
-   `bun run test:e2e` must pass all scenarios.
-   Mock Gemini and Google APIs in E2E to ensure determinism.

### Manual Verification
-   Follow `MANUAL_TESTING.md` to perform a real log entry with a real photo.
