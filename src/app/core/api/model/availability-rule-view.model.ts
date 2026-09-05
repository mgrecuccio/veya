export type AvailabilityChannelType = 'CHAT' | 'CALL' | string;

export type AvailabilityDayOfWeek = 
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY'

export interface AvailabilityRuleView {
    id: number;
    userId: number;
    dayOfWeek: AvailabilityDayOfWeek;
    startTime: string;
    endTime: string;
    channelType: AvailabilityChannelType;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}