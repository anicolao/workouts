import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { initialState, type WorkoutState, type Workout, type WorkoutSet } from './types';

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
                // ... (lines 18-40)

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

                case 'exercise/upsert':
                    if (!state.exercises) state.exercises = {};
                    state.exercises[payload.name] = payload;
                    break;

                case 'auth/login':
                    state.isAuthenticated = true;
                    state.user = payload.user;
                    state.accessToken = payload.accessToken;
                    break;

                case 'sync/start':
                    state.syncStatus = 'syncing';
                    break;

                case 'sync/success':
                    state.syncStatus = 'idle';
                    state.lastSync = new Date().toISOString();
                    break;

                case 'sync/error':
                    state.syncStatus = 'error';
                    break;
            }
        },
    },
});

export const { processEvent } = workoutSlice.actions;
export default workoutSlice.reducer;
