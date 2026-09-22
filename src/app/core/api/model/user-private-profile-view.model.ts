export interface UserPrivateProfileView {
    id: number;
    displayName?: string | null;
    timezone?: string | null;
    phoneNumber: string;
    status: string;
}
