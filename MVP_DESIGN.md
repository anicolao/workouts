# MVP Design

This document outlines the Minimum Viable Product (MVP) for the Workouts application.

## Goals
1.  **Frictionless Logging**: Quick entry of sets, reps, and weight during a workout.
2.  **Privacy-First Customization**: User defines exercises and programs in their own Google Sheet.
3.  **Cloud Storage**: Use Google Sheets as the backend database.

## Architecture

```mermaid
graph TD
    User[User] -->|Log Set| App[Workouts App]
    App -->|Read Configuration| Sheets[Google Sheets]
    App -->|Write Log| Sheets
```

## User Stories

### Authentication
-   **US-001**: As a user, I want to sign in with my Google account so that the app can access my Sheets.
-   **US-002**: As a user, I want to grant permission to read/write specific spreadsheets so that I retain control over my data.

### Configuration (The "Config" Sheet)
-   **US-003**: As a user, I want to define my list of exercises in a spreadsheet so that I can add custom movements without app updates.
-   **US-004**: As a user, I want to define "Tags" (e.g., Push, Pull, Legs) for exercises so that I can filter them easily.

### Logging
-   **US-005**: As a user, I want to start a new workout session so that I can track my training for the day.
-   **US-006**: As a user, I want to select an exercise from my configured list.
-   **US-007**: As a user, I want to log a set (Weight, Reps, RPE) with a single tap.
-   **US-008**: As a user, I want a rest timer to start automatically after logging a set.

### History & Progress
-   **US-009**: As a user, I want to see my history for a specific exercise while logging so that I know what weight to use.
-   **US-010**: As a user, I want to visualize my estimated 1RM progress over time.

## Data Schema (Google Sheets)

The backend will use **two separate Google Spreadsheets** to clearly distinguish between user-editable configuration and internal data.

### Spreadsheet 1: `InternalEventLog` (Do Not Edit)
This sheet acts as the database's write-ahead log. It is strictly append-only.

| Column | Type | Description |
| :--- | :--- | :--- |
| `EventID` | UUID | Unique ID |
| `Timestamp` | ISO8601 | Server-side timestamp |
| `ActionType` | String | `workout/start`, `set/log`, `exercise/create` |
| `Payload` | JSON | Full details of the event |

### Spreadsheet 2: `Exercise Catalog` (User Editable)
This sheet is designed for the user to view and manage their available exercises and settings.

| Exercise Name | Muscle Group | Movement Pattern | Default RPE | Tags |
| :--- | :--- | :--- | :--- | :--- |
| Squat | Legs | Squat | 8 | Core, Powerlifting |
| Bench Press | Chest | Push | 9 | Core, Powerlifting |

## UI Mockups

### Dashboard
*   **Aesthetic**: Dark mode, "Data-First". High contrast, neon accents (cyan/lime).
*   **Top**: "Start Workout" button (Prominent).
*   **Key Metrics**: Row of sparkline cards for "Core Exercises" (e.g., Squat, Bench, Deadlift) showing current estimated 1RM.
*   **Bottom**: "See Full Analytics" button to drill down into detailed stats.
*   *(Note: Weekly heatmap removed in favor of direct metric tracking)*

![Dashboard Mockup](assets/images/dashboard.png)

### Workout Logger
*   **Focus**: Efficiency. Large touch targets.
*   **Header**: Session Timer and Current Exercise Name.
*   **List**: Previous sets for the current session.
*   **Input**: Row of inputs for `Weight (kg)`, `Reps`, `RPE`, with a checkbox to mark as done.
*   **Actions**: Large "Log Set" button. "Next Exercise" button.

![Logger Mockup](assets/images/logger.png)

### Analytics
*   **Chart**: Line graph of Estimated 1RM for selected exercise.
*   **Data**: Clean, glowing line chart against dark background.

![Analytics Mockup](assets/images/analytics.png)
