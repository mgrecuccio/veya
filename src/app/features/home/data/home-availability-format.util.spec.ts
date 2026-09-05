import { formatAvailabilityDayLabel, formatAvailabilityTimeRange, mapEffectiveAvailabilityToUpcomingItems } from "./home-availability-format.util";


describe('home-availability-format.util', () => {
    const now = new Date('2026-04-10T09:00:00.000Z');

    it('formats Today label', () => {
        expect(formatAvailabilityDayLabel('2026-04-10T09:00:00.000Z', 'UTC', now)).toBe('Today');
    });

    it('formats Tomorrow label', () => {
        expect(formatAvailabilityDayLabel('2026-04-11T09:00:00.000Z', 'UTC', now)).toBe('Tomorrow');
    });

    it('formats weekday label', () => {
        expect(formatAvailabilityDayLabel('2026-04-12T09:00:00.000Z', 'UTC', now)).toBe('Sunday');
    });

    it('formats HH:mm-HH:mm time ranges', () => {
        expect(
            formatAvailabilityTimeRange(
                '2026-04-10T18:00:00.000Z',
                '2026-04-10T20:00:00.000Z',
                'UTC',
            )).toBe('18:00–20:00');
    });

    it('maps effective availability into upcoming items', () => {
        const items = mapEffectiveAvailabilityToUpcomingItems([
            {
                startDateTime: '2026-04-10T18:00:00.000Z',
                endDateTime: '2026-04-10T20:00:00.000Z',
                channelType: 'CHAT',
            },
          ],
          'UTC',
           now
         );

         expect(items).toEqual([
            {
                id: jasmine.any(String) as unknown as string,
                label: 'Today',
                timeRange: '18:00–20:00',
                startDateTime: '2026-04-10T18:00:00.000Z',
                endDateTime: '2026-04-10T20:00:00.000Z',
            }
         ]);
    });

    it('only keeps upcoming windows through the end of the current day', () => {
        const items = mapEffectiveAvailabilityToUpcomingItems([
            {
                startDateTime: '2026-04-10T18:00:00.000Z',
                endDateTime: '2026-04-10T20:00:00.000Z',
                channelType: 'CHAT',
            },
            {
                startDateTime: '2026-04-11T09:00:00.000Z',
                endDateTime: '2026-04-11T10:00:00.000Z',
                channelType: 'CHAT',
            },
          ],
          'UTC',
           now
         );

         expect(items.length).toBe(1);
         expect(items[0].startDateTime).toBe('2026-04-10T18:00:00.000Z');
    });

});
