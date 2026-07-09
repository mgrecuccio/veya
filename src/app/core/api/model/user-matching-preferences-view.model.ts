export interface UserMatchingPreferencesView {
    userId: number;
    allowChat: boolean;
    allowCall: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    pushNotificationsEnabled: boolean;
    suggestionNotificationsEnabled: boolean;
}
