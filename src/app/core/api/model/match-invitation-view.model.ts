import { ChannelType } from './channel-type.model';

export interface MatchInvitationView {
    id: number;
    initiatorUserId: number;
    initiatorDisplayName: string;
    candidateUserId?: number | null;
    candidateDisplayName?: string | null;
    otherParticipantUserId?: number | null;
    otherParticipantDisplayName?: string | null;
    channelType: ChannelType;
    status: string;
    score: number;
    createdAt: string;
    respondedAt?: string | null;
}
