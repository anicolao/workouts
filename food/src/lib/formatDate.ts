/**
 * Formats a date string for the log list.
 * 
 * Rules:
 * - Today: "HH:mm"
 * - Yesterday: "Yesterday @ HH:mm"
 * - Within 7 days: "DayOfWeek @ HH:mm" (e.g., "Monday @ 12:00")
 * - This Year: "Mon, MMM D" (e.g., "Jan 12") -> Prompt said "Mon, Jan X"
 * - Older: "MMM D, YYYY" (e.g., "Jan 12, 2024") -> Prompt said "Jan 12, 2024" (implied "Dates that are from prior years should say the year as well.")
 */
export function formatLogDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    // Reset hours to compare calendar days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const logDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - logDay.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // 1. Today
    if (diffDays === 0) {
        return timeStr;
    }

    // 2. Yesterday
    if (diffDays === 1) {
        return `Yesterday @ ${timeStr}`;
    }

    // 3. Within 7 days
    if (diffDays < 7 && diffDays > 0) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `${dayName} @ ${timeStr}`;
    }

    // 4. This Year
    if (date.getFullYear() === now.getFullYear()) {
        // "Mon, Jan X"
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // 5. Prior Years
    // "Jan 12, 2024" or typically "MMM D, YYYY"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
