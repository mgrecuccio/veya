export interface PendingContactInvitationView {
    invitationId: number;
    senderUserId?: number | null;
    senderDisplayName?: string | null;
    senderPhoneNumber: string;
    status?: string | null;
    createdAt?: string | null;
}
