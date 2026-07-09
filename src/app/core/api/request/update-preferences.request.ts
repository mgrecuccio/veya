export interface UpdatePreferencesRequest {
    allowChat: boolean;
    allowCall: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    pushNotificationsEnabled: boolean;
    suggestionNotificationsEnabled: boolean;
}
