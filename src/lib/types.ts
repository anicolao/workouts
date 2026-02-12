export interface Program {
    id: string;
    name: string;
    weeks: ProgramWeek[];
}

export interface ProgramWeek {
    name: string;
    days: ProgramDay[];
}

export interface ProgramDay {
    dayName: string;
    exercises: ProgramExercise[];
}

export interface ProgramExercise {
    name: string;
    load: string;
    reps: string;
    rpe: string;
    notes: string;
}

export interface WorkoutState {
    events: any[];
    currentWorkoutId: string | null;
    workouts: Record<string, Workout>;
    exercises: Record<string, Exercise>;
    programs: Record<string, Program>; // Added
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
    programs: {}, // Added
    isAuthenticated: false,
    user: null,
    accessToken: null,
    syncStatus: 'idle',
    lastSync: null,
};
