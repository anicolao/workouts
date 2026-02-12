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

### 1. Program Selection (Pre-Workout)

This is the first screen a user sees after clicking "Start Workout".

*   **Purpose**: Confirm *what* the user is doing today.
*   **Default Behavior**: The app remembers the last completed day for each program and **automatically selects the next day**.

#### Components
1.  **Header**: "Choose Workout"
2.  **Program Cards (Horizontal Scroll)**:
    *   One card per Program File found in the `Programs` folder.
    *   **Title**: Program Name (Filename).
    *   **Subtitle**: Next Scheduled Day (e.g., "Day: Push A").
    *   **Progress Indicator**: Visual cue of progress through the cycle (optional).
3.  **Day Selector (Dropdown/Carousel)**:
    *   Defaults to the "Next Day".
    *   User can tap to override (e.g., if they want to repeat a day or skip ahead).
4.  **Confirm Button**: "Start Workout" (Neon Lime).

#### Mockup

![Program Selection Mockup](assets/images/program_selection_mockup.png)

## Interaction Flow

1.  User taps "Start Workout" on Home Dashboard.
2.  App scans `Programs` folder in Drive.
3.  App displays **Program Selection** screen.
    *   *System Logic*: Finds the last logged session for the active program. Identifying that "Push A" was done last, it defaults selection to "Pull A".
4.  User confirms "Pull A" or selects a different day.
5.  User taps "Start Workout".
6.  App navigates to **Workout Logger**, pre-populated with exercises from the 'Pull A' rows in the `PPL` sheet.
