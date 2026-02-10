export interface WorkoutState {
    events: any[];
    currentWorkoutId: string | null;
    workouts: Record<string, Workout>;
    isAuthenticated: boolean;
    user: User | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
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
    isAuthenticated: false,
    user: null,
};
