import { ChannelType } from './channel-type.model';

export interface MatchView {
    id: number;
    candidateUserId: number;
    channelType: ChannelType;
    status: string;
    score: number;
    createdAt: string;
    respondedAt?: string | null;
}
