import { ChannelType } from '../model/channel-type.model';

export interface CreateMatchRequest {
    candidateUserId: number;
    channelType: ChannelType;
}
