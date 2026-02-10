# Fix Transition Logic for Static/Base-Path Deployments

The current screen transition logic relies on exact path matching (e.g., `path === '/settings'`). This fails when the application is deployed to a subdirectory (like GitHub Pages `user.github.io/repo/`), where paths include a base prefix (e.g., `/repo/settings`).

## User Review Required

> [!NOTE]
> This change strictly affects the `getTransitionDirection` logic to make it robust against base paths. It should likely fix the reported issue where "some" transitions work (the ones using `.includes`) but others don't (strict equality).

## Proposed Changes

### `src/lib`

#### [MODIFY] [transitions.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/transitions.ts)
- Import `base` from `$app/paths`.
- Create a helper `normalizePath(path: string)`:
    - If `base` is set and `path` starts with `base`, remove it.
    - Ensure the result always starts with `/`.
    - Handle trailing slashes consistently.
- Update `getTransitionDirection` to use `normalizePath` for both `from` and `to` URLs.

## Verification Plan

### Automated Tests
- Create a new unit test file `src/lib/transitions.test.ts` to verify `getTransitionDirection`.
- Test cases:
    - **No Base Path**: `from: /`, `to: /settings` -> `right`.
    - **With Base Path**: `from: /food/`, `to: /food/settings` -> `right` (mocking `$app/paths` might be tricky in Vitest depending on setup, but we can structure the function to accept `base` as an optional argument or mock the module).
    - **Cross-check**: Ensure existing "includes" logic still works.

### Manual Verification
- Since we can't easily run the production build locally with the exact GitHub Pages setup without building and serving, the unit test is the primary verification.
- We can ostensibly run `PUBLIC_BASE_PATH=/food npm run dev` to see if it breaks dev (it shouldn't, but `base` might not apply in dev mode the same way unless configured).
