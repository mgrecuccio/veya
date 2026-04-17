export interface ContactView {
    id: number,
    contactUserId: string;
    nickName?: string | null;
    favorite: boolean;
    createdAt: string;
}