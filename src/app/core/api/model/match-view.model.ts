import { ChannelType } from './channel-type.model';

export interface MatchView {
    id: number;
    initiatorUserId: number;
    candidateUserId: number;
    initiatorDisplayName?: string | null;
    candidateDisplayName?: string | null;
    initiatorNickName?: string | null;
    candidateNickName?: string | null;
    channelType: ChannelType;
    status: string;
    overlapStartDateTime: string;
    overlapEndDateTime: string;
    createdAt: string;
    respondedAt?: string | null;
}
