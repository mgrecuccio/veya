export interface UserProfileView {
    id: number;
    phoneNumber: string;
    displayName?: string | null;
    status: string;
    timezone?: string | null;
}
