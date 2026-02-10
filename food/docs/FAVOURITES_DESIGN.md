# Favourites and "Log Again" Design

## Overview
This feature adds two key capabilities to the logging flow:
1.  **Log Again**: A context-sensitive shortcut to duplicate a previous log entry when navigating from a log detail view.
2.  **Favourites**: A persistent list of frequently logged items (triggered by use of "Log Again") that allows for quick logging without AI analysis.

## User Flow

### 1. Log Again
- **Trigger**: User views a specific log entry (e.g., `entry/?id=xyz`) and clicks the global `+` (FAB) button.
- **UI Change**: The Log Menu (Input Grid) displays a new button: **"Log Again"**.
    - **Visuals**: Shows the image of the entry being viewed (or title if no image).
    - **Position**: alongside existing options (Camera, Library, Voice, Text).
- **Action**: Clicking "Log Again":
    1.  Dispatches a `log/logAgain` event.
    2.  Navigates directly to the Log Detail sheet (bypassing AI analysis).
    3.  Pre-fills the form with data from the source entry.
    4.  Sets the date/time to *now*.

### 2. Favourites
- **Trigger**: The **"Favourites"** button is *always* visible in the Log Menu (Input Grid).
- **Empty State**: If no favourites exist, clicking it shows a toast/message: *"Favourites are created whenever you log a food item more than once using 'Log Again'."*
- **Populated State**: Shows a grid/list of favourite items.
    - **Selection**: Tapping a favourite opens the Log Detail sheet pre-filled with that item's data (name, calories, macros, rationale).
- **Creation Logic**: Favourites are purely derived from `log/logAgain` events.
    - When `log/logAgain` is dispatched, the reducer adds the item (by description/content) to the `favourites` list if not already present.

## Technical Architecture

### Events
New event type:
```typescript
interface LogAgainEvent {
  type: 'log/logAgain';
  payload: {
    sourceEntryId: string;
    description: string;
    timestamp: string;
  };
}
```

### State & Reducers
New slice `favourites` (or part of `projections`):
- **State**: `items: FavouriteItem[]`
- **Reducer**: Listens for `log/logAgain`.
    - Upsert logic: If item with same `description` exists, update timestamp/count. If not, add new favourite.

`FavouriteItem` structure:
```typescript
interface FavouriteItem {
  id: string; // specialized ID
  description: string;
  defaultNutrition: { calories, protein, carbs, fat };
  lastUsed: string;
  usageCount: number;
}
```

### UI Components

#### `src/lib/components/ui/InputGrid.svelte`
- **Props**:
    - `contextEntry`: Optional `LogEntry`. If provided, renders the "Log Again" button.
- **Modifications**:
    - Add "Favourites" button (Always visible).
    - Add "Log Again" button (Conditional).
    - Update Grid Layout to accommodate 5-6 buttons (Auto-flow or explicit grid).

#### `src/routes/log/+page.svelte`
- **Logic**:
    - Check URL params for `from_entry_id`.
    - Fetch entry from store.
    - Pass entry to `InputGrid`.
    - Handle `Log Again` selection -> Fill form -> Open Sheet.
    - Handle `Favourites` selection -> Show Favourites Picker Modal -> On Select -> Fill form -> Open Sheet.

#### `src/lib/components/ui/MobileNav.svelte`
- **Logic**:
    - Detect if on `entry` page.
    - Append `?from_entry={id}` to FAB link.

## Assets
- "Log Again" Icon: Reuse/Generate specific icon.
- "Favourites" Icon: Star/Heart icon.
