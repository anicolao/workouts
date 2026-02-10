
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getBusinessDate, groupLogs, type ActivityGroup } from '../../src/lib/activity-grouping';
import type { LogEntry } from '../../src/lib/store';

describe('Activity Grouping Logic', () => {
    describe('getBusinessDate', () => {
        it('should return same date for 04:00 AM', () => {
            const date = new Date('2024-01-15T04:00:00');
            assert.strictEqual(getBusinessDate(date), '2024-01-15');
        });

        it('should return same date for 11:59 PM', () => {
            const date = new Date('2024-01-15T23:59:00');
            assert.strictEqual(getBusinessDate(date), '2024-01-15');
        });

        it('should return previous date for 03:59 AM', () => {
            const date = new Date('2024-01-15T03:59:00');
            assert.strictEqual(getBusinessDate(date), '2024-01-14');
        });

        it('should return previous date for 00:00 AM', () => {
            const date = new Date('2024-01-15T00:00:00');
            assert.strictEqual(getBusinessDate(date), '2024-01-14');
        });
    });

    describe('groupLogs', () => {
        const baseLog: LogEntry = {
            id: '1', date: '2024-01-15', time: '08:00', mealType: 'Breakfast', description: 'Item',
            calories: 100, fat: 0, carbs: 0, protein: 0
        };

        it('should group separate Breakfast items into one group', () => {
            const logs: LogEntry[] = [
                { ...baseLog, id: '1', time: '08:00', mealType: 'Breakfast', description: 'Oatmeal' },
                { ...baseLog, id: '2', time: '08:15', mealType: 'Breakfast', description: 'Coffee' }
            ];
            const groups = groupLogs(logs);
            assert.strictEqual(groups.length, 1);
            assert.strictEqual(groups[0].title, 'Breakfast');
            assert.strictEqual(groups[0].items.length, 2);
            assert.strictEqual(groups[0].calories, 200);
        });

        it('should cluster snacks within 30 minutes', () => {
            const logs: LogEntry[] = [
                { ...baseLog, id: '1', time: '10:00', mealType: 'Snack', description: 'Apple' },
                { ...baseLog, id: '2', time: '10:25', mealType: 'Snack', description: 'Almonds' }
            ];
            const groups = groupLogs(logs);
            assert.strictEqual(groups.length, 1);
            assert.strictEqual(groups[0].title, 'Snack');
            assert.strictEqual(groups[0].items.length, 2);
        });

        it('should split snacks more than 30 minutes apart', () => {
            const logs: LogEntry[] = [
                { ...baseLog, id: '1', time: '10:00', mealType: 'Snack', description: 'Apple' },
                { ...baseLog, id: '2', time: '10:31', mealType: 'Snack', description: 'Almonds' }
            ];
            const groups = groupLogs(logs);
            assert.strictEqual(groups.length, 2);
            assert.strictEqual(groups[0].title, 'Snack');
            assert.strictEqual(groups[1].title, 'Snack');
        });

        it('should interleave meals and snacks correctly', () => {
            const logs: LogEntry[] = [
                { ...baseLog, id: '1', time: '08:00', mealType: 'Breakfast', description: 'Eggs' },
                { ...baseLog, id: '2', time: '10:00', mealType: 'Snack', description: 'Apple' },
                { ...baseLog, id: '3', time: '08:30', mealType: 'Breakfast', description: 'Toast' }, // Late breakfast entry
                { ...baseLog, id: '4', time: '12:00', mealType: 'Lunch', description: 'Salad' }
            ];
            const groups = groupLogs(logs);

            assert.strictEqual(groups.length, 3);
            assert.strictEqual(groups[0].title, 'Breakfast');
            assert.strictEqual(groups[0].startTime, '08:00');
            assert.strictEqual(groups[0].items.length, 2);

            assert.strictEqual(groups[1].title, 'Snack');
            assert.strictEqual(groups[1].startTime, '10:00');

            assert.strictEqual(groups[2].title, 'Lunch');
            assert.strictEqual(groups[2].startTime, '12:00');
        });

        it('should handle snack bridging (A->B->C where gap < 30m each step)', () => {
            const logs: LogEntry[] = [
                { ...baseLog, id: '1', time: '14:00', mealType: 'Snack', description: 'A' },
                { ...baseLog, id: '2', time: '14:20', mealType: 'Snack', description: 'B' }, // 20m gap
                { ...baseLog, id: '3', time: '14:45', mealType: 'Snack', description: 'C' }  // 25m gap from B (total 45 from A)
            ];
            const groups = groupLogs(logs);
            assert.strictEqual(groups.length, 1);
            assert.strictEqual(groups[0].items.length, 3);
        });
    });
});
