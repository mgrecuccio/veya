export interface PendingContactInvitationView {
    invitationId: string;
    senderUserId: string;
    senderDisplayName?: string | null;
    status: string;
    createdAt: string;
}