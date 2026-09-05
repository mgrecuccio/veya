export type AvailabilityOverrideType = 'AVAILABLE' | 'UNAVAILABLE';

export interface AvailabilityOverrideView {
    id: number;
    userId: number;
    startDateTime: string;
    endDateTime: string;
    type: AvailabilityOverrideType;
    createdAt: string;
}