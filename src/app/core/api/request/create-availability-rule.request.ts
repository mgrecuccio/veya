import { AvailabilityChannelType, AvailabilityDayOfWeek } from "../model/availability-rule-view.model";

export interface CreateAvailabilityRuleRequest {
    dayOfWeek: AvailabilityDayOfWeek;
    startTime: string;
    endTime: string;
    channelType: AvailabilityChannelType;
}