export type AvailabilityChannelType = 'CHAT' | 'CALL' | string;

export interface AvailabilityRuleView {
    id: string;
    dayOfWeek: number | string;
    startTime: string;
    endTime: string;
    channelType: AvailabilityChannelType;
    enabled: boolean;
}