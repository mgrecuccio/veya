/*
    Date helpers that work in an explicit IANA time zone (usually the user's profile time zone),
    falling back to the device time zone when none is provided.
*/

const MS_PER_DAY = 86_400_000;
const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

export function resolveTimeZone(preferredTimeZone?: string | null): string {
    return preferredTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Number of calendar days between two instants, as seen in the given time zone.
export function dayOffsetInTimeZone(date: Date, reference: Date, timeZone?: string | null): number {
    const zone = resolveTimeZone(timeZone);
    return calendarDayIndex(date, zone) - calendarDayIndex(reference, zone);
}

// Midnight of the calendar day `days` after the one containing `date`, in the given time zone.
export function startOfDayInTimeZone(date: Date, timeZone?: string | null, days = 0): Date {
    const zone = resolveTimeZone(timeZone);
    const parts = getZonedParts(date, zone);
    const target = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

    return zonedWallClockToDate(
        {
            year: target.getUTCFullYear(),
            month: target.getUTCMonth() + 1,
            day: target.getUTCDate(),
            hour: 0,
            minute: 0,
        },
        zone,
    );
}

// Formats an instant as a `datetime-local` input value ("YYYY-MM-DDTHH:mm") in the given time zone.
export function toDateTimeLocalValue(date: Date, timeZone?: string | null): string {
    const parts = getZonedParts(date, resolveTimeZone(timeZone));
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

// Interprets a `datetime-local` input value as wall-clock time in the given time zone.
export function fromDateTimeLocalValue(value: string, timeZone?: string | null): Date | null {
    const match = DATETIME_LOCAL_PATTERN.exec(value);

    if (!match) {
        return null;
    }

    const [, year, month, day, hour, minute] = match.map(Number);
    return zonedWallClockToDate({ year, month, day, hour, minute }, resolveTimeZone(timeZone));
}

function zonedWallClockToDate(parts: ZonedParts, timeZone: string): Date {
    const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

    // the second pass corrects the guess when a DST transition sits between it and the result.
    let instant = wallClockAsUtc - getTimeZoneOffsetMs(new Date(wallClockAsUtc), timeZone);
    instant = wallClockAsUtc - getTimeZoneOffsetMs(new Date(instant), timeZone);

    return new Date(instant);
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    const read = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((part) => part.type === type)?.value ?? 0);

    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
        hour: read('hour'),
        minute: read('minute'),
    };
}

function calendarDayIndex(date: Date, timeZone: string): number {
    const parts = getZonedParts(date, timeZone);
    return Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = getZonedParts(date, timeZone);
    const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const instantToMinute = Math.floor(date.getTime() / 60_000) * 60_000;

    return wallClockAsUtc - instantToMinute;
}

function pad(value: number): string {
    return String(value).padStart(2, '0');
}
