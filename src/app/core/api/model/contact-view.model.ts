export interface ContactView {
    id: number,
    contactUserId: number;
    nickName?: string | null;
    favorite: boolean;
    createdAt: string;
}