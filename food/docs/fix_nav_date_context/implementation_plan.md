# Fix Navigation Date Context

## Goal Description
When navigating from a detailed entry view back to the main log (day view), the application currently defaults to "Today". It should instead return to the date of the entry being viewed. This ensures a smooth user flow when reviewing or editing past entries.

## User Review Required
None.

## Proposed Changes

### Tests
#### [NEW] [tests/e2e/005-details-edit-delete/005-date-context-nav.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/005-details-edit-delete/005-date-context-nav.spec.ts)
- Create a new test file to isolate this behavior.
- **Scenario**:
    1.  Mock "Today" as `2024-03-15`.
    2.  Mock a seeded entry (or create one) on `2024-03-14`.
    3.  Navigate to `/log?date=2024-03-14` (or use UI to go back).
    4.  Click the entry to view details.
    5.  Click "Back".
    6.  **Assertion**: URL should be `/log?date=2024-03-14` (or verify UI state matches).

### Components
#### [MODIFY] [src/routes/entry/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/entry/+page.svelte)
- Update `<a href="{base}/" ...>` to use a dynamic `backUrl`.
- Update `handleSave` and `handleDelete` to use `goto(backUrl)`.
- Compute `backUrl`:
    - If `entry.date` is available: `/?date=${entry.date}`
    - Else: `${base}/`

## Verification Plan
### Automated Tests
- Run the new E2E test:
    ```bash
    npx playwright test tests/e2e/005-details-edit-delete/005-date-context-nav.spec.ts
    ```
- Run existing navigation tests to ensure regressions:
    ```bash
    npx playwright test tests/e2e/005-details-edit-delete/005-details-edit-delete.spec.ts
    ```

### Manual Verification
1.  Open the app.
2.  Navigate to yesterday.
3.  Click an entry.
4.  Click "Back".
5.  Verify you are still on "Yesterday".
