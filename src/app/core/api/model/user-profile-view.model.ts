export interface UserProfileView {
    id: number;
    email: string;
    displayName?: string | null;
    status: string;
    timezone?: string | null;
}