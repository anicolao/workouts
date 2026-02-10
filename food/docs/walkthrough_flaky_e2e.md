# Fix Flaky E2E Tests Walkthrough

## Use Case
Improving the stability of E2E tests in CI by addressing reported flakes where screenshots captured transient states (syncing icon or missing UI elements).

## Changes

### [013-detailed-nutrition.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/013-detailed-nutrition/013-detailed-nutrition.spec.ts)
- Added `await expect(page.locator('[data-status="synced"]')).toBeVisible();` after saving an entry to ensure the sync process completes before any implicit or explicit assertions that rely on the final state.

### [002-log-food.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/002-log-food/002-log-food.spec.ts)
- Added `await expect(page.locator('.icon-toggle')).toBeVisible();` after analysis verification to ensure icons are loaded.

## Verification Results

### Automated Tests
Ran the affected tests locally to confirm they pass.

- `tests/e2e/013-detailed-nutrition/013-detailed-nutrition.spec.ts`: **Passed**
- `tests/e2e/002-log-food/002-log-food.spec.ts`: **Passed**
