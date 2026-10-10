import {
    dayOffsetInTimeZone,
    fromDateTimeLocalValue,
    startOfDayInTimeZone,
    toDateTimeLocalValue,
} from "./zoned-date.util";

describe('zoned-date.util', () => {
    it('computes calendar day offsets in the given time zone', () => {
        const reference = new Date('2026-10-09T12:00:00.000Z');
        const lateEvening = new Date('2026-10-09T23:30:00.000Z');

        expect(dayOffsetInTimeZone(lateEvening, reference, 'UTC')).toBe(0);
        expect(dayOffsetInTimeZone(lateEvening, reference, 'Europe/Rome')).toBe(1);
        expect(dayOffsetInTimeZone(lateEvening, reference, 'America/Los_Angeles')).toBe(0);
    });

    it('finds midnight in the given time zone', () => {
        const now = new Date('2026-10-09T23:30:00.000Z');

        expect(startOfDayInTimeZone(now, 'UTC').toISOString()).toBe('2026-10-09T00:00:00.000Z');
        expect(startOfDayInTimeZone(now, 'Europe/Rome').toISOString()).toBe('2026-10-09T22:00:00.000Z');
        expect(startOfDayInTimeZone(now, 'Europe/Rome', 8).toISOString()).toBe('2026-10-17T22:00:00.000Z');
    });

    it('round-trips datetime-local values through a time zone', () => {
        const instant = new Date('2026-10-10T07:15:00.000Z');

        expect(toDateTimeLocalValue(instant, 'Europe/Rome')).toBe('2026-10-10T09:15');
        expect(fromDateTimeLocalValue('2026-10-10T09:15', 'Europe/Rome')?.toISOString())
            .toBe(instant.toISOString());
    });

    it('resolves wall-clock times on both sides of a DST change', () => {
        expect(fromDateTimeLocalValue('2026-03-28T12:00', 'Europe/Rome')?.toISOString())
            .toBe('2026-03-28T11:00:00.000Z');
        expect(fromDateTimeLocalValue('2026-03-30T12:00', 'Europe/Rome')?.toISOString())
            .toBe('2026-03-30T10:00:00.000Z');
    });

    it('rejects malformed datetime-local values', () => {
        expect(fromDateTimeLocalValue('', 'UTC')).toBeNull();
        expect(fromDateTimeLocalValue('2026-10-10 09:15', 'UTC')).toBeNull();
    });
});
