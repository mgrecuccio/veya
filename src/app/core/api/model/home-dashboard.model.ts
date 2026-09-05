export type ReadinessLevel = 'empty' | 'almost-ready' | 'ready';

export interface UpcomingAvailabilityItem {
    id: string;
    label: string;
    timeRange: string;
    startDateTime?: string;
    endDateTime?: string;
}

export interface HomeDashboardVm {
  displayName: string;
  contactsCount: number;
  pendingInvitationsCount: number;
  hasAvailabilityRules: boolean;
  upcomingAvailability: UpcomingAvailabilityItem[];
}

export interface ReadinessContent {
    title: string;
    subtitle: string;
}

export interface FreeNowState {
  active: boolean;
}

export interface HomeDashboardState {
    dashboard: HomeDashboardVm;
    readinessLevel: ReadinessLevel;
    readinessContent: ReadinessContent;
    availabilityErrorMessage?:  string | null;
}
