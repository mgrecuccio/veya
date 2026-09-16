export interface PendingContactInvitationView {
    invitationId: number;
    senderUserId?: number | null;
    senderDisplayName?: string | null;
    status?: string | null;
    createdAt?: string | null;
}
