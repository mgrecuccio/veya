export interface UserPrivateProfileView {
    id: number;
    displayName?: string | null;
    timezone?: string | null;
    email: string;
    phoneNumber?: string | null;
    status: string;
}