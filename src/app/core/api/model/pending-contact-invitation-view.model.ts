export interface PendingContactInvitationView {
    invitationId: number;
    senderUserId?: number | null;
    senderEmail?: string | null;
    senderDisplayName?: string | null;
    status?: string | null;
    createdAt?: string | null;
}
