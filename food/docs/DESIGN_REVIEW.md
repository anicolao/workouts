# Design Review: Event Lifecycle & "Facts on the Ground"

## Objective
Audit the codebase to ensure that distinct user actions and external system interactions are recorded as "facts on the ground" (events). This ensures observability, debugging capability, and data integrity, particularly when asynchronous operations (API calls, uploads) fail.

## Findings

### 1. Image Upload Flow (Critical)
**Current State (`src/routes/log/+page.svelte`)**:
- The user selects images.
- On "Save", `uploadImage` is called inside a `Promise.race` with a 3-second timeout.
- **Data Loss Risk**: If the upload times out or fails (e.g., offline), the error is caught, `driveUrls` remains empty, and the entry is saved *without* the images.
- **Observability Void**: There is no record that the user *attempted* to upload images. The `log/entryConfirmed` event simply appears as a text-only entry.
- **Status**: Fixed by updating projections to attach `media/uploadCompleted` URLs to entries that reference the pending `tempId`.

**Missing Events**:
- `media/uploadStarted`: Capturing the intent to upload, including a temporary client-side ID.
- `media/uploadCompleted`: Linking the client-side ID to the provider ID (Drive URL).
- `media/uploadFailed`: Recording the failure reason.

### 2. AI Analysis Flow
**Current State (`src/lib/gemini.ts` & `log/+page.svelte`)**:
- `analyzeFood` makes a direct `fetch` to Gemini.
- Only if successful, `log/aiEstimateReceived` is dispatched.
- **Observability Void**: Failed analysis requests (network error, API limits, safety blocks) are not recorded. We cannot analyze "success rate" or "common failure modes".

**Missing Events**:
- `ai/analysisRequested`: Recording input text/image count and timestamp.
- `ai/analysisFailed`: Recording the error message/code.

### 3. Voice Input
**Current State (`VoiceRecorder.svelte`)**:
- Transcription happens entirely in local component state.
- On completion, it passes text to the parent.
- **Observability Void**: If the subsequent AI analysis fails, the transcribed text is lost. We don't have a record of the raw transcript.

**Missing Events**:
- `voice/transcriptionCompleted`: Recording the raw text *before* attempting AI analysis.

## Proposed Strategy: Full Lifecycle Events

We should adopt a pattern where every significant async operation is bracketed by events.

### A. Media Lifecycle
Instead of treating images as just a URL string property, we treat them as entities with a lifecycle.

**1. `media/uploadStarted`**
```typescript
{
  tempId: string;       // client-generated UUID
  mimeType: string;
  name: string;
  size: number;
  context: 'log_entry' | 'correction';
  timestamp: string;
}
```

**2. `media/uploadCompleted`**
```typescript
{
  tempId: string;
  providerId: string;   // Google Drive File ID
  url: string;          // Access URL
  timestamp: string;
}
```

**3. `media/uploadFailed`**
```typescript
{
  tempId: string;
  reason: string;
  timestamp: string;
}
```

### B. AI Lifecycle
**1. `ai/analysisRequested`**
```typescript
{
  requestId: string;
  inputType: 'text' | 'image' | 'voice';
  contentLength?: number; // e.g., text length or image count
}
```

**2. `ai/analysisFailed`**
```typescript
{
  requestId: string;
  error: string;
}
```

### C. Voice Lifecycle
**1. `voice/captureCompleted`**
```typescript
{
  traceId: string;
  durationSeconds: number;
  transcript: string; // The raw "Fact on the Ground"
}
```

## Implementation Plan (Phased)

1.  **Phase 1: Media Events (High Priority)**
    - Refactor `handleSubmit` in `log/+page.svelte` to dispatch `media/uploadStarted` immediately for all files.
    - Remove the "silently drop error" logic.
    - Ensure `log/entryConfirmed` references the `tempId` instead of relying on the upload finishing.
    - Create a projection (or simple UI logic) that can handle "pending" images (resolve `tempId` to local blob URL if needed, or wait for `uploadCompleted`).

2.  **Phase 2: AI Observability**
    - Wrap `analyzeFood` calls with Request/Result/Failure events.

3.  **Phase 3: Refinement**
    - Update the Event Log (Sheet) to gracefully handle these new event types (they are just rows, so it should be safe).
    - ensure `sync-manager` handles distinct event types correctly (it should, as it's generic).

## Conclusion
The current "snapshot" approach (recording only the final success state) is insufficient for a robust "Offline First" or complex async application. Shifting to "Flow Recording" (events for actions) preserves the user's intent even when the system fails to execute it perfectly.
