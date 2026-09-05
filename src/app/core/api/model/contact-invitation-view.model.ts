export interface ContactInvitationView {
  id: number;
  senderUserId: number;
  recipientUserId: number;
  nickName?: string | null;
  status: string;
  createdAt: string;
}
