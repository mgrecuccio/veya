import { EffectiveAvailabilityView } from "src/app/core/api/model/effective-availability-view.model";
import { UpcomingAvailabilityItem } from "src/app/core/api/model/home-dashboard.model";

// if preferred zone isn't provided, use the the browser fallback timezone
function getFormatterTimeZone(preferredTimeZone?: string | null): string {
    return preferredTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// en-CA formats dates in a stable year-month-day style, which is convenient for equality checks.
function isSameLocalDay(
    left: Date,
    right: Date,
    timeZone?: string | null,
): boolean {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: getFormatterTimeZone(timeZone),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return formatter.format(left) == formatter.format(right);
}

export function addDays(base: Date, days: number): Date {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
}

/*
    if it falls on the same local day as now, returns "Today"
    if it falls on the same local day as now + 1 day, returns "Tomorrow"
    otherwise returns the weekday name, such as "Monday" or "Thursday"
*/
export function formatAvailabilityDayLabel(
    dateIso: string,
    preferredTimeZone?: string | null,
    now: Date = new Date(),
): string {
    const date = new Date(dateIso);

    if(isSameLocalDay(date, now, preferredTimeZone)) {
        return 'Today';
    }

    if(isSameLocalDay(date, addDays(now, 1), preferredTimeZone)) {
        return 'Tomorrow';
    }

    return new Intl.DateTimeFormat('en-US', {
        timeZone: getFormatterTimeZone(preferredTimeZone),
        weekday: 'long'
    }).format(date);
}

// en-GB Because it naturally works well with 24-hour formatting and colon-separated times.
export function formatAvailabilityTimeRange(
    startIso: string,
    endIso: string,
    preferredTimeZone?: string | null,
): string {
    const timeZone = getFormatterTimeZone(preferredTimeZone);

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${formatter.format(new Date(startIso))}–${formatter.format(new Date(endIso))}`;
}

// two windows might have identical start/end timestamps, so index prevents duplicate IDs.
export function mapEffectiveAvailabilityToUpcomingItems(
    windows: EffectiveAvailabilityView[],
    preferredTimeZone?: string | null,
    now: Date = new Date(),
): UpcomingAvailabilityItem[] {
    const currentDayMidnight = addDays(now, 1);
    currentDayMidnight.setHours(0, 0, 0, 0);

    return windows
        .filter((window) => new Date(window.startDateTime) < currentDayMidnight)
        .map((window, index) => ({
            id: `${window.startDateTime}-${window.endDateTime}-${index}`,
            label: formatAvailabilityDayLabel(window.startDateTime, preferredTimeZone, now),
            timeRange: formatAvailabilityTimeRange(
                window.startDateTime,
                window.endDateTime,
                preferredTimeZone
            ),
            channel: 'Available',
            startDateTime: window.startDateTime,
            endDateTime: window.endDateTime,
    }));
}