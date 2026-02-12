# UX Design: Programs

This document outlines the design and user experience for managing and selecting workout programs.

## Goals
1.  **Structure**: Allow users to define programs (e.g., PPL, Starting Strength) consisting of multiple days (e.g., Push A, Pull A).
2.  **Context**: Provide a "Pre-Workout" screen where users confirm their plan for the day.
3.  **Portability**: Programs should be easy to share and swap.

## Data Structure (Google Drive & Sheets)

To facilitate sharing and organization, programs are stored as individual Google Sheets within a dedicated folder.

*   **Root Folder**: `Workouts App Data` (Existing)
*   **Sub-Folder**: `Programs` (New)
*   **Files**: One Spreadsheet per Program (e.g., `PPL.xlsx`, `Starting Strength.xlsx`).

### Program Sheet Schema

Each Program Spreadsheet contains a single sheet (tab) with the following columns:

| Day Name | Exercise Name | Order | Notes |
| :--- | :--- | :--- | :--- |
| Push A | Bench Press | 1 | Heavy, 3-5 mins rest |
| Push A | Overhead Press | 2 | |
| Push A | Incline Dumbbell Press | 3 | |
| Pull A | Deadlift | 1 | |

*   **Day Name**: Grouping key for exercises.
*   **Exercise Name**: Must match an entry in the main `Exercise Catalog`.
*   **Order**: Integers defining the sequence.
*   **Notes**: Optional instructions specific to this program context.

## UI Design

### 1. Program Selection (Choose Program)

This screen is accessed via the **Profile** tab or a "Change Program" link on the Dashboard. It is NOT the default landing screen.

*   **Header**: "Choose Program"
*   **List**: Vertical scrolling list of Program Cards.
*   **Card State**:
    *   **Active**: Highlighted (Neon Lime border/badge) indicating the current routine.
    *   **Inactive**: Standard appearance.
*   **Action**: Tapping a card sets it as "Active" and returns to Dashboard.

#### Mockup

![Program Selection Mockup](assets/images/unified_program_selection_mockup.png)

## Interaction Flow

1.  User enters **Profile** tab.
2.  User taps "Current Program: PPL".
3.  App shows **Choose Program** list.
4.  User selects "Starting Strength".
5.  App updates the "Active Program" pointer in `Config` sheet.
6.  User is returned to Dashboard, which now shows the next workout for "Starting Strength".

