export interface WorkoutState {
    events: any[]; // Log of all actions
    currentWorkoutId: string | null;
    workouts: Record<string, Workout>; // Derived state
}

export interface Workout {
    id: string;
    startTime: string;
    endTime?: string;
    sets: WorkoutSet[];
}

export interface WorkoutSet {
    id: string;
    exerciseName: string;
    weight: number;
    reps: number;
    rpe?: number;
    timestamp: string;
}

export const initialState: WorkoutState = {
    events: [],
    currentWorkoutId: null,
    workouts: {},
};
