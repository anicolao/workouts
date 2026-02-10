import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { initialState, type WorkoutState, type Workout, type WorkoutSet } from './types.js';

export const workoutSlice = createSlice({
    name: 'workout',
    initialState,
    reducers: {
        // Generic event handler - append to log and process
        processEvent: (state, action: PayloadAction<any>) => {
            // 1. Append to Event Log
            state.events.push(action.payload);

            // 2. Apply Logic based on event type
            const { type, payload } = action.payload;

            switch (type) {
                case 'workout/start':
                    state.currentWorkoutId = payload.workoutId;
                    state.workouts[payload.workoutId] = {
                        id: payload.workoutId,
                        startTime: payload.timestamp,
                        sets: [],
                    };
                    break;

                case 'workout/end':
                    if (state.currentWorkoutId === payload.workoutId) {
                        state.workouts[payload.workoutId].endTime = payload.timestamp;
                        state.currentWorkoutId = null;
                    }
                    break;

                case 'auth/login':
                    state.isAuthenticated = true;
                    state.user = payload.user;
                    break;

                case 'auth/logout':
                    state.isAuthenticated = false;
                    state.user = null;
                    break;

                case 'set/log':
                    if (state.workouts[payload.workoutId]) {
                        const newSet: WorkoutSet = {
                            id: payload.setId,
                            exerciseName: payload.exerciseName,
                            weight: payload.weight,
                            reps: payload.reps,
                            rpe: payload.rpe,
                            timestamp: payload.timestamp,
                        };
                        state.workouts[payload.workoutId].sets.push(newSet);
                    }
                    break;
            }
        },
    },
});

export const { processEvent } = workoutSlice.actions;
export default workoutSlice.reducer;
