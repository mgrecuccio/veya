export interface ContactView {
    id: number,
    contactUserId: number;
    nickName?: string | null;
    displayName?: string | null;
    favorite: boolean;
    createdAt: string;
}
