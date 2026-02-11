export interface WorkoutState {
    events: any[];
    currentWorkoutId: string | null;
    workouts: Record<string, Workout>;
    exercises: Record<string, Exercise>;
    isAuthenticated: boolean;
    user: User | null;
    accessToken: string | null;
    syncStatus: 'idle' | 'syncing' | 'error';
    lastSync: string | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Exercise {
    name: string;
    muscleGroup: string;
    defaultRpe: number;
    tags: string[];
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
    exercises: {},
    isAuthenticated: false,
    user: null,
    accessToken: null,
    syncStatus: 'idle',
    lastSync: null,
};
