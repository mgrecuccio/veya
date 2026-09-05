export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
    phoneNumber?: string;
    timezone: string;
}
