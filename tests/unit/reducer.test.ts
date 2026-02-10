import { describe, it, expect } from 'vitest';
import reducer, { processEvent } from '../../src/lib/reducer';
import { initialState } from '../../src/lib/types';

describe('workout reducer', () => {
    it('should handle initial state', () => {
        expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle workout/start', () => {
        const startAction = {
            type: 'workout/start',
            payload: {
                workoutId: 'test-id',
                timestamp: '2023-01-01T00:00:00Z'
            }
        };

        // We need to wrap the payload in the processEvent action structure
        // Since we're testing the reducer directly, we pass the full action object
        const action = processEvent(startAction.payload);
        // Manually constructing the action payload as processEvent expects
        // processEvent creates an action { type: 'workout/processEvent', payload: { ... } }
        // Wait, the reducer key is 'processEvent'.

        const nextState = reducer(initialState, processEvent(startAction));

        expect(nextState.events).toHaveLength(1);
        expect(nextState.currentWorkoutId).toBe('test-id');
        expect(nextState.workouts['test-id']).toBeDefined();
    });
});
