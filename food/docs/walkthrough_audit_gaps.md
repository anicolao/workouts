# Walkthrough - Audit Event Logging Gaps

I have implemented the "Facts on the Ground" event lifecycle to ensure robust observability for async operations.

## Changes

### 1. Store Schema
-   Added `mediaIds` to `LogEntry` in `src/lib/store.ts` to link entries with their media lifecycle events.

### 2. Media Lifecycle
-   Refactored `log/+page.svelte` to implement "Upload on Pick":
    -   `media/uploadStarted`: Dispatched immediately upon file selection (generated `tempId`).
    -   `media/uploadCompleted`: Dispatched when background upload finishes.
    -   `media/uploadFailed`: Dispatched if upload fails.
-   Decoupled upload failure from entry saving to prevent data loss.
-   `handleSubmit` now waits for the *existing* upload promises initiated at pick time.

### 3. AI Lifecycle
-   Updated `log/+page.svelte` to dispatch events:
    -   `ai/analysisRequested`: Before calling Gemini API (tracks request ID).
    -   `ai/analysisFailed`: If Gemini API throws an error.
-   Maintained existing `log/aiEstimateReceived` for success.

### 4. Voice Lifecycle
-   Updated `VoiceRecorder.svelte` to dispatch:
    -   `voice/captureCompleted`: Contains raw transcript and duration *before* analysis begins.

## Verification Results

### Automated Tests
-   `svelte-check`: **Passed** (verified type safety of new events and refactors).
-   `tests/e2e/002-log-food.spec.ts`: **Passed** (ensures no regression in the primary logging flow).

### Pull Request
-   **PR**: https://github.com/anicolao/food/pull/63
-   **Branch**: `feature/audit-event-gaps`
