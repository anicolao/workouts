# Increment 001: Date Formatting & Details View

## Goal Description
Enhance the Food Log application by implementing "smart" date formatting to improve readability of history, and adding a detailed view for log entries that supports editing, re-analysis, and deletion (soft delete).

## User Review Required
> [!IMPORTANT]
> **Data Loading Strategy**: The current main page only loads `todaysEntries`. To support the "Yesterday" and "Last Week" date formatting requirements, we must change the main page to load/display *all* or *recent* history, not just today's. This design assumes we will display a scrolling list of history.

## User Stories

### Smart Date Formatting
- **US-013**: As a user, I want entries from **today** to show only the **Time** (e.g., "14:30") so that recent info is concise.
- **US-014**: As a user, I want entries from **yesterday** to show "**Yesterday @ TIME**" so I can quickly identify them.
- **US-015**: As a user, I want entries from the **last 7 days** to show the **Day of Week @ TIME** (e.g., "Monday @ 12:00") so I see the weekly context.
- **US-016**: As a user, I want entries from **this year** (older than 7 days) to show "**Mon, Jan X**".
- **US-017**: As a user, I want entries from **prior years** to show the **Year** (e.g., "Jan 12, 2024").

### Food Details & Management
- **US-018**: As a user, I want to **tap on a log entry** to navigate to a dedicated **Details Screen**.
- **US-019**: As a user, I want to **edit** the details of an existing log (description, macros, meal type) so that I can fix mistakes.
- **US-020**: As a user, I want to **re-analyze** the food with AI from the details screen (e.g., if I updated the correction prompt) so I can get better data.
- **US-021**: As a user, I want to **delete** a log entry so that it is removed from my active log.
- **US-022**: As a user, I want deleted items to go to a **Trash** state (recoverable) rather than being permanently destroyed immediately.

## Proposed Changes

### 1. Date Formatting Logic
- Create `src/lib/formatDate.ts` utility.
- Update `src/routes/+page.svelte` (Home/List):
    - **Crucial Change**: Remove the filter `e.date === today`. Instead, sort `state.projections.log` by date/time descending.
    - Use key-based grouping? Or just linear list? The prompt implies linear list with specific formatting string.
    - Apply `formatLogDate` to the timestamp display.

### 2. Details Route (`src/routes/log/[id]/+page.svelte`)
- Create a new dynamic route.
- **Load Logic**: Retrieve the specific entry from the Redux store using `$page.params.id`.
- **UI Layout**:
    - Large Image display (carousel if multiple).
    - Editable Form (reuse components or logic from `log/+page.svelte`).
    - Action Buttons: "Save Changes", "Re-analyze", "Delete".

### 3. State Management (Redux)
- **New Actions**:
    - `log/entryUpdated`: Payload `{ entryId, changes: Partial<LogEntry> }`.
    - `log/entryDeleted`: Payload `{ entryId }`.
    - `log/entryRestored`: Payload `{ entryId }` (for future Trash UI).
- **Projections Update**:
    - Update `log` array to handle updates/deletes.
    - `Deleted` entries should be filtered out of the main list selector in `+page.svelte`.
    - `DailyStats` must be recalculated or decremented when items are modified/deleted.

### 4. Trash View (Optional/MVP+)
- For this increment, "Recoverable" might just mean a "Trash" page exists or simply that the data isn't hard-deleted from the event log so a developer can restore it.
- **Decision**: We will implement a simple "Trash" toggle or view in the future. For now, we just flag it `isDeleted: true` and filter it out.

## Verification Plan

### Automated Tests
- **Unit Tests**: Test `formatDate.ts` with various mocked dates (Today, Yesterday, Last Week, etc.).
- **Browser Tests**:
    - Create a log entry.
    - Verify it appears in the list with correct date format.
    - Click it -> Verify navigation to `log/[id]`.
    - Edit it -> Save -> Verify updates in list.
    - Delete it -> Verify removal from list.

### Manual Verification
- Set system time (or mock) to check date boundaries.
- Create entries for "Yesterday" and "Last Week" (via manual DB seeding or comprehensive UI date picker usage) to verify formatting.
