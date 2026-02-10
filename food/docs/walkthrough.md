# Sharing Feature Walkthrough

Implemented a robust **Sharing Feature** allowing users to share their Food Log via a unique link (Folder ID). The implementation ensures a strict **Read-Only** experience for viewers, leveraging a **Shadow Route Architecture** to reuse existing components while enforcing security and context isolation.

## Architecture: Shadow Routes
Instead of complicating the main `+page.svelte` (Home) and `entry/+page.svelte` (Detail) with endless `if (isShared)` checks, I created a parallel route structure under `src/routes/sharing/`.

- **`src/routes/sharing/+layout.svelte`**: acts as the **Context Controller**.
  - It detects `folderId` from the URL.
  - It initializes the specific "Shared" Database Context.
  - It updates the Global Store (`store.config.isReadOnly = true`).
  - It prevents the Root Layout from overwriting this context.

- **`src/routes/sharing/+page.svelte`**: Shadow Copy of the Home Page.
  - Stripped of "Add" buttons.
  - Simplified logic (no local auth checks, relies on Layout).
  - Uses `store.config.isReadOnly` to drive UI states.

- **`src/routes/sharing/entry/[id]/+page.svelte`**: Shadow Entry Detail.
  - Reuses the logic refactored into `src/lib/components/pages/EntryPage.svelte`.
  - Is recognized by `EntryPage` via URL structure.

## Context Isolation
To ensure the "Shared View" doesn't leak into the "Personal View" or vice versa:
1. **Root Layout Protection**: Modified `src/routes/layout.svelte` to SKIP default data initialization if the path starts with `/sharing`.
2. **Component Reactivity**: Updated `ActivityCard` and `EntryPage` to be reactive to Store Context changes (Folder ID, ReadOnly status).
   - This fixes race conditions where child components mounted before the Shared Context was fully established.
3. **Link Generation**: `ActivityCard` dynamically generates links (`/sharing/entry/...` vs `/entry/...`) based on the active Context.

## UI Changes
- **Read-Only Mode**:
  - "Save Changes" and "Delete" buttons are hidden.
  - Form inputs (Description, Macros, Notes) are **Disabled**.
  - Navigation "Back" button intelligently routes to the Shared Feed.

## Verification
Created a comprehensive E2E test suite in `tests/e2e/020-sharing-flow/`.

### Automated Tests (`020-sharing-flow.spec.ts`)
- **Mocking**: Fully mocked Google Drive & Sheets API to simulate a "Shared Folder" and "Shared Database".
- **Flow**:
  1. User visits Sharing Link (`/sharing?folderId=...`).
  2. Verifies "Shared Food Log" title appears.
  3. Verifies Shared Entry ("Shared Pasta") appears in the feed.
  4. Clicks entry to view details.
  5. Verifies URL is correct (`/sharing/entry/...`).
  6. **Verifies Read-Only enforcement**: Inputs disabled, Save/Delete buttons hidden.
  7. Navigates Back to feed.

### Validation Results
All tests passed, confirming:
- Correct Loading of Shared Data.
- Strict Read-Only UI enforcement.
- Seamless Navigation within the Shared Context.
- No interference with the standard Personal Log flow.

## Code Changes
render_diffs(file:///Users/anicolao/projects/antigravity/food/src/routes/entry/+page.svelte)
render_diffs(file:///Users/anicolao/projects/antigravity/food/src/routes/sharing/+layout.svelte)
render_diffs(file:///Users/anicolao/projects/antigravity/food/src/routes/sharing/+page.svelte)
render_diffs(file:///Users/anicolao/projects/antigravity/food/src/lib/components/pages/EntryPage.svelte)
render_diffs(file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
