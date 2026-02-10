# Grouped Logging Implementation Plan

## Goal
Implement the "Grouped Logging" UX updates, organizing food logs into "Eating Activities" (Meals and Snack Clusters) with a 4 AM day boundary.

## User Review Required
> [!IMPORTANT]
> **Day Boundary Change**: The application will now define "Today" as starting at 04:00 AM. Logs before 4 AM will fall into the "previous" day. This logic changes how data is aggregated and displayed.
> **Navigation**: The "Detail View" for a group needs clarification. I will implement an **Expand/Collapse** pattern on the `ActivityCard` initially. Clicking an item within the expanded card will navigate to the existing `/entry` edit page.

## Proposed Changes

### Logic & State (`src/lib/`)
#### [NEW] `src/lib/activity-grouping.ts`
-   Implement `getBusinessDate(date: Date): string` (Returns YYYY-MM-DD based on 4 AM cutoff).
-   Implement `groupLogs(logs: LogEntry[]): ActivityGroup[]`.
    -   Group tags `Breakfast`, `Lunch`, `Dinner` regardless of specific time (within the business day).
    -   Cluster `Snack` logs by 30-minute proximity.
    -   Calculate aggregates (calories, macros) for each group.

#### [MODIFY] `src/lib/store.ts` (or `src/routes/+page.svelte`)
-   Update the "Day" logic to use the new `getBusinessDate` instead of UTC date.
-   Integrate `groupLogs` selector in the dashboard view.

### UI Components (`src/lib/components/ui/`)
#### [NEW] `ActivityCard.svelte`
-   Visual representation of a group.
-   **Header**: Title (Meal Name or "Snack"), Time Range, Total Calories (Neon).
-   **Body** (Collapsible): List of items.
    -   Item row: Title, Calories.
    -   Clicking item navigates to `/entry` (Edit).

#### [MODIFY] `src/routes/+page.svelte` (Dashboard)
-   Replace `FoodCard` iteration with `ActivityCard` iteration.
-   Update `stats` logic to respect the 4 AM business day (aggregating from the filtered logs if possible, or updating store logic).
-   **Note**: The store `stats` object is currently keyed by simple `YYYY-MM-DD`. Depending on complexity, I might just filter the logs for the day and sum them client-side in the component to ensure consistency with the view, rather than rewriting the backend-style store logic immediately. *Decision*: Calc stats from the filtered list in `+page.svelte` for now to guarantee they match the list.

### Documentation
-   Update `WORKFLOW.md` or similar if needed (unlikely).

## Verification Plan

### Automated Tests
-   **Unit Tests**: Create `tests/unit/grouping.test.ts` to verify:
    -   4 AM boundary logic.
    -   Meal grouping (same type = same group).
    -   Snack clustering (close times = same group, distant times = split).
-   **E2E Tests**: Update `tests/e2e/002-log-food/002-log-food.spec.ts` or create `tests/e2e/grouped-log.spec.ts`.
    -   Log multiple items (Breakfast, Snack 1, Snack 2 quickly, Snack 3 later).
    -   Verify they appear grouped correctly.
    -   Verify the Summary Ring totals match.

### Manual Verification
1.  **Launch App**: `npm run dev -- --open`
2.  **Log Breakfast**: Add "Oatmeal" and "Coffee" tagged as Breakfast. Verify they appear in one "Breakfast" card.
3.  **Log Snacks**: Add "Apple" (10:00), "Nuts" (10:15). Verify they merge into one "Snack" card. Add "Cookie" (2:00 PM). Verify it creates a new Snack card.
4.  **Check Midnight**: Log something at 1:00 AM. Verify it appears in "Today's" list (assuming "Today" started at 4AM yesterday).
