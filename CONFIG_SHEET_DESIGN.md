# Config Sheet Design

This document outlines the structure and content of the user-editable `Exercise Catalog` spreadsheet. This sheet serves as the source of truth for available exercises, their classifications, and default settings.

## Sheet Structure

The sheet will be named `Exercise Catalog`.

| Column Header | Data Type | Description |
| :--- | :--- | :--- |
| `Exercise Name` | String | Unique name of the exercise (e.g., "Bench Press"). |
| `Muscle Group` | String | Primary muscle group targeted (Push, Pull, Squat, Hinge). |
| `Default RPE` | Number | Suggested RPE for the exercise (1-10). |
| `Tags` | String | Comma-separated list of tags for filtering (e.g., "Dumbbell, Hypertrophy"). |

## Default Exercises

The following exercises will be populated by default to provide a solid starting point for users.

### Push (Upper Body Pushing)

| Exercise Name | Muscle Group | Default RPE | Tags |
| :--- | :--- | :--- | :--- |
| **Incline Press** | Push | 8 | Chest, Shoulders, Barbell, Dumbbell |
| **Dips** | Push | 9 | Chest, Triceps, Bodyweight |
| **Tricep Overhead Extension** | Push | 9 | Triceps, Cable, Dumbbell |

### Pull (Upper Body Pulling)

| Exercise Name | Muscle Group | Default RPE | Tags |
| :--- | :--- | :--- | :--- |
| **Pull-Up** | Pull | 9 | Back, Lats, Bodyweight |
| **Barbell Row** | Pull | 8 | Back, Thickness, Barbell |
| **Face Pull** | Pull | 9 | Rear Delt, Rotator Cuff, Cable |

### Legs (Squat Pattern)

| Exercise Name | Muscle Group | Default RPE | Tags |
| :--- | :--- | :--- | :--- |
| **Back Squat** | Squat | 6 | Quads, Glutes, Barbell |
| **Front Squat** | Squat | 6 | Quads, Core, Barbell |
| **Leg Press** | Squat | 7 | Quads, Machine |

### Legs (Hinge Pattern)

| Exercise Name | Muscle Group | Default RPE | Tags |
| :--- | :--- | :--- | :--- |
| **Deadlift** | Hinge | 6 | Hamstrings, Posterior Chain, Barbell |
| **Romanian Deadlift** | Hinge | 7 | Hamstrings, Glutes, Barbell |
| **Good Morning** | Hinge | 7 | Hamstrings, Lower Back, Barbell |

## User Instructions

1.  **Add New rows**: To add an exercise, simply type in a new row.
2.  **Edit existing**: You can change the name or tags of any exercise.
3.  **Do not delete columns**: The app relies on these specific column headers.
