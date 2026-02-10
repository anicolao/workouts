# Implementation Plan - Event Logging Gaps

Audit and implement full lifecycle events to ensure "facts on the ground" for async operations.

## User Review Required

> [!IMPORTANT]
> This change introduces new event types: `media/uploadStarted`, `media/uploadCompleted`, `media/uploadFailed`, `ai/analysisRequested`, `ai/analysisFailed`, `voice/captureCompleted`.
> Ensure the event store schema and any downstream consumers (sync manager) can handle these new types gracefully (Design Review implies they should, as they are generic).

## Proposed Changes

### Media Lifecycle Events
#### [MODIFY] [log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
- Refactor `handleSubmit` to separate upload initiation from the final save.
- Dispatch `media/uploadStarted` for each image immediately.
- Update `previousRationale` and entry creation to use `tempId`s where appropriate or link the upload events.
- Dispatch `media/uploadCompleted` on success or `media/uploadFailed` on error.
- Remove the "silently drop error" logic (or at least log the failure event).

### AI Lifecycle Events
#### [MODIFY] [gemini.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/gemini.ts)
- Update `analyzeFood` to accept a `requestId` (optional) or generate one.
- Dispatch `ai/analysisRequested` before the API call.
- Dispatch `ai/analysisFailed` if the API call throws.

**Note**: `gemini.ts` is currently a pure library file. It might be cleaner to dispatch these events from `log/+page.svelte` wrapping the call, OR inject the store dispatch into `gemini.ts`. Given `gemini.ts` imports `ensureValidToken` from `auth`, it's not strictly "pure". However, `store` is usually used in components. I will stick to wrapping the calls in `log/+page.svelte` and `VoiceRecorder.svelte` for `gemini.ts` usage to keep `gemini.ts` focused on API, unless `gemini.ts` is the central point. The Design Review said "Wrap `analyzeFood` calls", implying where they are called. But `gemini.ts` is used in `log/+page.svelte`. I see `store.dispatch` is imported in `log/+page.svelte`.

### Voice Lifecycle Events
#### [MODIFY] [VoiceRecorder.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/VoiceRecorder.svelte)
- Dispatch `voice/captureCompleted` with the raw transcript when recording stops and transcription is done.

## Verification Plan

### Automated Tests
- **E2E Tests**:
  - Run `002-log-food.spec.ts` to ensure normal logging still works.
  - Create a new E2E test `014-event-lifecycle.spec.ts`? Or verify manually since these are backend events?
  - Ideally, we should verify that these events are actually dispatched.
  - We can check the Redux state or the resulting `events` in the store if exposed.

### Manual Verification
1.  **Media Upload**:
    -   Log a food with an image.
    -   Check the event log (if visible in UI or console) to see `media/uploadStarted` and `media/uploadCompleted`.
    -   Simulate offline (Network throttling) and verify `media/uploadFailed` or at least that the flow handles it.
2.  **AI Analysis**:
    -   Trigger AI analysis (Text or Image).
    -   Verify `ai/analysisRequested` and `log/aiEstimateReceived` (success) or `ai/analysisFailed` (force error).
3.  **Voice**:
    -   Use voice input.
    -   Verify `voice/captureCompleted` appears before AI analysis.
