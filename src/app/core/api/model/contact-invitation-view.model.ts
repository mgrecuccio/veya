export interface ContactInvitationView {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  nickName?: string | null;
  status: string;
  createdAt: string;
}