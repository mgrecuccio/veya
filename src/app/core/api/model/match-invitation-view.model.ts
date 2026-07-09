import { ChannelType } from './channel-type.model';

export interface MatchInvitationView {
    id: number;
    matchId: number;
    initiatorUserId: number;
    initiatorDisplayName?: string | null;
    initiatorNickName?: string | null;
    channelType: ChannelType;
    status: string;
    overlapStartDateTime: string;
    overlapEndDateTime: string;
    createdAt: string;
    expiresAt?: string | null;
}
