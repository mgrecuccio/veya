import { ChannelType } from './channel-type.model';

export interface SuggestedMatchView {
    candidateUserId: number;
    nickName?: string | null;
    favorite: boolean;
    channelType: ChannelType;
    score: number;
    overlapStart: string;
    overlapEnd: string;
}