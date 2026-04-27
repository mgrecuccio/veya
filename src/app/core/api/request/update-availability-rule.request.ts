import { CreateAvailabilityRuleRequest } from "./create-availability-rule.request";

export interface UpdateAvailabilityRuleRequest extends CreateAvailabilityRuleRequest {
    enabled: boolean;
}