export interface PendingIncomingContactInvitation {
    invitationId: number;
    senderUserId?: number | null;
    senderDisplayName?: string | null;
    senderPhoneNumber: string;
    status?: string | null;
    createdAt?: string | null;
}

export interface PendingSentContactInvitation {
    invitationId: number;
    recipientUserId?: number | null;
    recipientDisplayName?: string | null;
    recipientPhoneNumber: string;
    nickName?: string | null;
    status?: string | null;
    createdAt?: string | null;
}

export interface PendingContactInvitationsResponse {
    incoming: PendingIncomingContactInvitation[];
    sent: PendingSentContactInvitation[];
}
