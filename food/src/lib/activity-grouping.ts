import type { LogEntry } from './store';

export interface ActivityGroup {
    id: string; // Unique ID for the group (e.g., first item ID or composite)
    type: 'Meal' | 'Snack';
    title: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    items: LogEntry[];
}

/**
 * Returns the "Business Date" for a given date object.
 * The business day starts at 04:00 AM.
 * Any time before 04:00 AM belongs to the previous calendar day.
 */
export function getBusinessDate(date: Date): string {
    const cutoff = 4; // 4 AM
    const hours = date.getHours();

    // If before 4 AM, shift back one day to get the "business" date
    const adjustedDate = new Date(date);
    if (hours < cutoff) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
    }

    // Return YYYY-MM-DD
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Groups a list of log entries into Activity Groups.
 * Assumes the logs are already filtered for a single business day.
 */
export function groupLogs(logs: LogEntry[]): ActivityGroup[] {
    // Sort by time first
    const sortedLogs = [...logs].sort((a, b) => {
        // We assume the date part is effectively the same business day, 
        // but we need to handle the 4AM rollover if the logs technically have different calendar dates
        // attached to them (stored as date + time strings). 
        // Ideally, we convert to full timestamp for comparison.
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });

    const groups: ActivityGroup[] = [];
    let currentSnackGroup: ActivityGroup | null = null;

    for (const log of sortedLogs) {
        if (log.mealType === 'Snack') {
            // Logic for Snacks: Cluster if within 30 mins
            const logDate = new Date(`${log.date}T${log.time}`);

            if (currentSnackGroup) {
                const lastItem = currentSnackGroup.items[currentSnackGroup.items.length - 1];
                const lastDate = new Date(`${lastItem.date}T${lastItem.time}`);
                const diffMinutes = (logDate.getTime() - lastDate.getTime()) / (1000 * 60);

                if (diffMinutes <= 30) {
                    // Add to existing group
                    addToGroup(currentSnackGroup, log);
                    // Update title/end time
                    currentSnackGroup.endTime = log.time;
                    // If we wanted to update title dynamically based on time range? 
                    // Design says "Snack • 10:00 AM" (start time)
                    continue;
                } else {
                    // Close old group, start new one
                    groups.push(currentSnackGroup);
                    currentSnackGroup = createSnackGroup(log);
                }
            } else {
                // Start first snack group
                currentSnackGroup = createSnackGroup(log);
            }

        } else {
            // Logic for Meals (Breakfast, Lunch, Dinner):
            // Each Type gets one group per day? Or cluster by time?
            // Design: "All logs of the same meal type for a given day are grouped into a single card".

            // If we have a pending snack group, push it first (maintain temporal order? 
            // Actually, if a snack happened before breakfast, it should be before.
            // But the design implies we group strictly by type. 
            // AND "The view is a vertical feed...". 
            // If I eat Snack (4am), Breakfast (8am), Snack (10am). 
            // I should verify if "All logs of same meal type" implies ONE card for "Breakfast" total?
            // "Behavior: All logs of the same meal type for a given day are grouped into a single card"
            // -> Yes, merge all "Breakfasts" even if split?
            // "regardless of the exact timestamp (though they are usually close)."
            // OK. So we find an existing group for this Meal Type? 

            // Wait, if we are strictly time-ordering the groups in the feed, 
            // we might need to be careful. 
            // If I assume sortedLogs is time ascending. 
            // If I encounter Breakfast (8am), I check if I already started a Breakfast group?
            // If yes, append. If no, create.
            // NOTE: Effectively this means later Breakfast items will "hoist" into the earlier card?
            // Or the Card stays at the position of the first item?
            // "Time: Range... or Start Time of the first item." -> Implies position is determined by first item.

            if (currentSnackGroup) {
                // Check if this meal is effectively "after" the snack group we are building.
                // Since we are iterating time-sorted, it is after.
                // We push the snack group.
                groups.push(currentSnackGroup);
                currentSnackGroup = null;
            }

            // Check for existing Meal Group of this type
            const existingGroup = groups.find(g => g.type === 'Meal' && g.title === log.mealType);
            if (existingGroup) {
                addToGroup(existingGroup, log);
                existingGroup.endTime = log.time; // Update end range
            } else {
                const newGroup = createMealGroup(log);
                groups.push(newGroup);
            }
        }
    }

    // Push final snack group
    if (currentSnackGroup) {
        groups.push(currentSnackGroup);
    }

    // Final sort of groups by startTime? 
    // If we merged a late Breakfast into an early Breakfast card, it stays early. 
    // Snacks are interleaved. 
    // This seems correct for "narrative view".
    return groups.sort((a, b) => {
        // Naive time compare (HH:MM). 
        // Issue: 01:00 (next day technical) vs 23:00 (today). 
        // We need to respect the "Business Date" shift for sorting too if we just compare strings.
        // However, `log.date` + `log.time` is robust.
        const getStartDate = (g: ActivityGroup) => {
            const first = g.items[0];
            return new Date(`${first.date}T${first.time}`).getTime();
        };
        return getStartDate(a) - getStartDate(b);
    });
}

function createSnackGroup(log: LogEntry): ActivityGroup {
    return {
        id: `group-${log.id}`,
        type: 'Snack',
        title: 'Snack',
        startTime: log.time,
        endTime: log.time,
        calories: Number(log.calories || 0),
        protein: Number(log.protein || 0),
        fat: Number(log.fat || 0),
        carbs: Number(log.carbs || 0),
        items: [log]
    };
}

function createMealGroup(log: LogEntry): ActivityGroup {
    return {
        id: `group-${log.id}`,
        type: 'Meal',
        title: log.mealType,
        startTime: log.time,
        endTime: log.time,
        calories: Number(log.calories || 0),
        protein: Number(log.protein || 0),
        fat: Number(log.fat || 0),
        carbs: Number(log.carbs || 0),
        items: [log]
    };
}

function addToGroup(group: ActivityGroup, log: LogEntry) {
    group.items.push(log);
    group.calories += Number(log.calories || 0);
    group.protein += Number(log.protein || 0);
    group.fat += Number(log.fat || 0);
    group.carbs += Number(log.carbs || 0);
}
