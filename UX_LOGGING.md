# UX Design: Logging

This document outlines the detailed user experience for the core Logging interface, including handling pre-populated workouts and ad-hoc adjustments.

## Goals
1.  **Efficiency**: Minimize taps during the workout.
2.  **Flexibility**: Allow users to adapt the plan on the fly (Swap/Remove).
3.  **Clarity**: Show previous performance data to guide weight selection.

## UI Design

### 1. The Logger Interface

The Logger is the active state of a workout session.

#### User Story: Pre-Populated Session
When entering the logger from a selected Program Day:
*   The list is populated with the exercises defined in the Program Sheet.
*   Exercises are ordered by the `Order` column.
*   Each exercise card starts **Collapsed** (showing name + summary) except the **First Exercise** which is **Expanded**.

#### Components

1.  **Header**:
    *   **Context**: Program Name & Day Name (e.g., "PPL - Push A").
    *   **Timer**: Session duration (starts automatically).
    *   **Finish**: Button to end the workout.

2.  **Exercise List (Vertical Scroll)**:
    *   **Expanded Card**:
        *   **Exercise Name**.
        *   **History**: "Last: 100kg x 5 (RPE 9)" (Small text).
        *   **Set Rows**:
            *   Input fields for `Weight`, `Reps`, `RPE`.
            *   **Smart Defaults**: Pre-fill weight with last session's weight (or 0 if new).
            *   **Check Button**: Tapping marks set as complete and starts **Rest Timer**.
        *   **Add Set Button**: Adds a new row.
    *   **Collapsed Card**:
        *   Exercise Name.
        *   Status Indicator (Pending/Done).
        *   Tap to Expand.

3.  **Actions Menu (Per Exercise)**:
    *   Accessible via **Swipe Left** or a **"More" (...)** icon on the card header.
    *   **Options**:
        *   **Swap**: Replace this exercise.
        *   **Remove**: Delete from session.
        *   **Reorder**: Drag to move (optional for MVP).

4.  **Ad-Hoc Add**:
    *   At the bottom of the list, a "+ Add Exercise" button allows searching the `Exercise Catalog` to append a new movement.

#### Mockup

![Logger Mockup](logger_mockup_1770910801469.png)

## Interaction Flows

### Flow: Logging a Set
1.  User enters data: `100kg`, `5 rep`, `8 RPE`.
2.  User taps **Check Button**.
3.  **Rest Timer** overlay appears (e.g., "Resting 01:30").
    *   User can tap to minimize or add time.

### Flow: Substituting an Exercise (US-015)
*Scenario: Both Bench Press stations are taken, user defaults to Dumbbell Press.*

1.  User sees "Bench Press" in the list.
2.  User taps "..." (Menu) or Swipes Left on the card.
3.  User selects **"Swap"**.
4.  App opens **Exercise Selector** modal (Searchable list from `Exercise Catalog`).
5.  User searches for "Dumbbell Press" and selects it.
6.  Logger replaces "Bench Press" with "Dumbbell Press" in the current slot.
    *   *Note*: This only affects the *current session*, not the permanent Program Sheet.

### Flow: Removing an Exercise (US-016)
*Scenario: User is running out of time and skips the accessory work.*

1.  User identifies "Pec Fly".
2.  User opens Menu -> Selects **"Remove"**.
3.  Item disappears from the list.

### Flow: Finishing
1.  User taps **"Finish Workout"**.
2.  App saves the session to `InternalEventLog` spreadsheet.
3.  App updates the "Last Completed Day" pointer for the program.
4.  User returns to Dashboard.

## Rest Timer Logic
*   **Trigger**: Explicitly triggered by marking a set as "Done".
*   **Duration**: Defaults to global setting (e.g., 90s) or exercise-specific setting (future scope).
*   **Behavior**: Non-blocking overlay. User can continue logging other sets if needed (supersets).
