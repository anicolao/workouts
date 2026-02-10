# v0 Implementation: Start Workout & Event Sourcing

## User Prompt
OK we rebased and merged this pr. switch back to main, pull, and write a v0 of the appliation that includes at least one e2e test to validate the functionalty that you choose to include for this initial cut.            Also write a REDUX_ACTIONS.md that details every action that the user can take in this MVP that will be stored in the internal spreadsheet. Make sure the test runner on github users macos so that the screenshots will obey the 0-tolerance rules, and write appropriate unit tests for the reducer.

## User Comments
(None)

## Changes
-   **Scaffolding**: Initialized SvelteKit project with Redux and Playwright.
-   **Architecture**: Implemented Event Sourcing pattern with `InternalEventLog` logic in Redux.
-   **Feature**: "Start Workout" flow (Dashboard -> Active Workout).
-   **Testing**:
    -   Unit tests for Redux reducer.
    -   E2E tests for "Start Workout" flow using `TestStepHelper`.
    -   CI workflow for macOS.
-   **Documentation**:
    -   `REDUX_ACTIONS.md`: Documented MVP actions.
    -   `walkthrough.md`: Overview of changes.

## Verification
-   `npm run test:unit`: Passed locally.
-   `npx playwright test`: Passed locally.
