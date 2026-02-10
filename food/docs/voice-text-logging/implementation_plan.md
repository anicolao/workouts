# Implementation Plan - Voice & Text Logging

Implement Voice and Text logging as first-class citizens in the Food Tracker, replacing the current Camera/Photo-only start screen with a 2x2 Input Grid.

## User Review Required
> [!IMPORTANT]
> **Image Search fallback**: Since no Google Custom Search API key is available, I will implement a **mock image search service** that returns a placeholder image for text/voice entries. This allows the flow to be tested end-to-end without blocking on credentials.

## Proposed Changes

### Logic & Services

#### [MODIFY] [gemini.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/gemini.ts)
- Update `analyzeImage` to potentially rename to `analyzeFood` or overload it.
- Add support for `text` input (instead of or alongside images).
- Update system prompt to handle text input: "User ate: {text}".
- Request Gemini to provide a `searchQuery` in the JSON response for image fetching.

#### [NEW] [image-search.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/image-search.ts)
- Create a service to fetch images based on a query.
- **Mock Implementation**: specialized placeholder images.

### UI Components

#### [MODIFY] [src/routes/log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
- Replace `showCamera` (bool) with `currentMode` (IDLE | CAMERA | VOICE | TEXT | PREVIEW).
- Remove the current "Start UI" and replace with `InputGrid`.
- Integrate `VoiceRecorder` and `TextInputModal` for their respective modes.
- Update `handleSubmit` to look for a `driveUrl` (or `externalUrl`) if no file was uploaded.

#### [NEW] [InputGrid.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/InputGrid.svelte)
- 2x2 Grid Layout for: Camera, Photos, Voice, Text.
- Glassmorphic styling consistent with `UI_OVERHAUL`.

#### [NEW] [TextInputModal.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/TextInputModal.svelte)
- Simple modal with textarea and "Analyze" button.

#### [NEW] [VoiceRecorder.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/VoiceRecorder.svelte)
- Uses Web Speech API for transcription.
- Visualizer (simulated or real canvas) for "Listening" state.
- "Stop & Analyze" button.

## Verification Plan

### Automated Tests
- **New E2E Test**: `tests/e2e/009-text-voice-log.spec.ts`
    - **Test 1: Text Logging**: Open log page -> Click Text -> Type "Apple" -> Analyze -> Verify Proposal -> Save.
    - **Test 2: Voice Logging (Mocked)**: Open log page -> Click Voice -> Mock Speech Event -> Verify Text appears -> Analyze -> Save.
    - **Stubbing**: Use `page.addInitScript` to mock `window.webkitSpeechRecognition` for consistent testing in CI.

### Manual Verification
- Open `/log` on mobile simulation.
- Verify 2x2 Grid layout.
- Test Text Input flow: "Banana" -> Auto-image -> Log.
- Test Voice Input flow: Speak -> Transcription -> Log.
