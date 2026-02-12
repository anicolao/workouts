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
            const { type, payload: eventPayload } = action.payload;

            console.log(`Reducer processing: ${type}`, eventPayload);

            switch (type) {
                case 'workout/start':
                    state.currentWorkoutId = eventPayload.workoutId;
                    state.workouts[eventPayload.workoutId] = {
                        id: eventPayload.workoutId,
                        startTime: eventPayload.timestamp,
                        sets: []
                    };
                    break;

                case 'workout/end':
                    state.currentWorkoutId = null;
                    if (state.workouts[eventPayload.workoutId]) {
                        state.workouts[eventPayload.workoutId].endTime = eventPayload.timestamp;
                    }
                    break;

                case 'set/log':
                    if (state.workouts[eventPayload.workoutId]) {
                        const newSet: WorkoutSet = {
                            id: eventPayload.setId,
                            exerciseName: eventPayload.exerciseName,
                            weight: eventPayload.weight,
                            reps: eventPayload.reps,
                            rpe: eventPayload.rpe,
                            timestamp: eventPayload.timestamp,
                        };
                        state.workouts[eventPayload.workoutId].sets.push(newSet);
                    }
                    break;

                case 'exercise/upsert':
                    if (!state.exercises) state.exercises = {};
                    if (eventPayload && eventPayload.name) {
                        state.exercises[eventPayload.name] = eventPayload;
                    } else {
                        console.error('Reducer: exercise/upsert missing name in payload', eventPayload);
                    }
                    break;

                case 'auth/login':
                    state.isAuthenticated = true;
                    state.user = eventPayload.user;
                    state.accessToken = eventPayload.accessToken;
                    break;

                case 'sync/start':
                    state.syncStatus = 'syncing';
                    break;

                case 'sync/success':
                    state.syncStatus = 'idle';
                    state.lastSync = new Date().toISOString();
                    break;

                case 'program/upsert':
                    if (eventPayload && eventPayload.id) {
                        state.programs[eventPayload.id] = eventPayload;
                    }
                    break;

                case 'program/updateDay':
                    if (eventPayload && eventPayload.programId && state.programs[eventPayload.programId]) {
                        const { programId, weekIndex, dayIndex, day } = eventPayload;
                        if (state.programs[programId].weeks[weekIndex]) {
                            state.programs[programId].weeks[weekIndex].days[dayIndex] = day;
                        }
                    }
                    break;

                case 'program/updateExercise':
                    if (eventPayload && eventPayload.programId && state.programs[eventPayload.programId]) {
                        const { programId, weekIndex, dayIndex, exerciseIndex, exercise } = eventPayload;
                        if (state.programs[programId].weeks[weekIndex]?.days[dayIndex]?.exercises) {
                            state.programs[programId].weeks[weekIndex].days[dayIndex].exercises[exerciseIndex] = exercise;
                        }
                    }
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
