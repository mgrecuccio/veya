import { ChannelType } from './channel-type.model';

export interface SuggestedMatchView {
    candidateUserId: number;
    candidateDisplayName?: string | null;
    candidateNickName?: string | null;
    favorite: boolean;
    channelType: ChannelType;
    score: number;
    overlapStartDateTime: string;
    overlapEndDateTime: string;
}
