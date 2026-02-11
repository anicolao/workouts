import { configureStore, type Middleware } from '@reduxjs/toolkit';
import workoutReducer from './reducer'; // Removed .js extension for consistency
import { appendAction } from './action-log';
import { v4 as uuidv4 } from 'uuid';

const actionLogMiddleware: Middleware = storeAPI => next => action => {
    const result = next(action);
    const state = storeAPI.getState();
    const accessToken = state.workout.accessToken;

    if (accessToken && (action as any).payload && (action as any).payload.type) {
        const actionType = (action as any).payload.type;
        // Filter for actions we want to log
        // We log 'exercise/upsert' only if it originated from the app (not sync), but for now log all to be safe?
        // Actually, log internal events.
        if (['workout/start', 'set/log', 'workout/end', 'exercise/create', 'exercise/upsert'].includes(actionType)) {
            // For now, generate a UUID for the event if not present (though our actions might not have IDs yet)
            // Ideally actions should be standard.

            appendAction(accessToken, {
                eventId: uuidv4(),
                timestamp: new Date().toISOString(),
                actionType: actionType,
                payload: (action as any).payload
            });
        }
    }

    return result;
};

export const store = configureStore({
    reducer: {
        workout: workoutReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(actionLogMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
