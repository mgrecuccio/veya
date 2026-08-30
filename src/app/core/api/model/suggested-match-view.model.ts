import { ChannelType } from './channel-type.model';

export interface SuggestedMatchView {
    candidateUserId: number;
    nickName?: string | null;
    channelType: ChannelType;
}
