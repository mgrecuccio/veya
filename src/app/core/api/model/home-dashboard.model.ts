export type ReadinessLevel = 'empty' | 'almost-ready' | 'ready';

export interface UpcomingAvailabilityItem {
    id: string;
    label: string;
    timeRange: string;
    channel: 'Available';
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

export interface NextBestActionVm {
  kind: 'contacts' | 'availability' | 'invitations' | 'ready';
  kicker: string;
  title: string;
  subtitle: string;
  route?: string;
}

export interface SetupChecklistItem {
  key: 'contacts' | 'availability' | 'invitations';
  label: string;
  complete: boolean;
}

export interface FreeNowState {
  active: boolean;
}

export interface HomeDashboardState {
    dashboard: HomeDashboardVm;
    readinessLevel: ReadinessLevel;
    readinessContent: ReadinessContent;
    nextBestAction: NextBestActionVm;
    setupItems: SetupChecklistItem[];
    completedSetupItems: number;
    availabilityErrorMessage?:  string | null;
}