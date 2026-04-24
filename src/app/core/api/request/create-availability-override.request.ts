import { AvailabilityOverrideType } from "../model/availability-override-view-model";

export interface CreateAvailabilityOverrideRequest {
    startDateTime: string;
    endDateTime: string;
    type: AvailabilityOverrideType;
}
