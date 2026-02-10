# Redux Actions (Internal Event Log)

This document lists all action types and their payloads that will be stored in the `InternalEventLog` spreadsheet.

## Workout Session

### `workout/start`
**Description**: User initiates a new workout session.
**Payload**:
```typescript
{
  workoutId: string; // UUID
  timestamp: string; // ISO8601
}
```

### `workout/end`
**Description**: User finishes the current workout session.
**Payload**:
```typescript
{
  workoutId: string; // UUID
  timestamp: string; // ISO8601
  durationSeconds: number;
}
```

## Sets

### `set/log`
**Description**: User logs a completed set.
**Payload**:
```typescript
{
  setId: string; // UUID
  workoutId: string; // UUID
  timestamp: string; // ISO8601
  exerciseName: string; // e.g., "Squat"
  weight: number; // kg
  reps: number;
  rpe: number; // optional, 1-10
}
```

### `set/delete`
**Description**: User deletes a previously logged set.
**Payload**:
```typescript
{
  setId: string; // UUID
  timestamp: string; // ISO8601
}
```
