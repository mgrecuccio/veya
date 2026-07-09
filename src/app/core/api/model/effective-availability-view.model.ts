import { ChannelType } from './channel-type.model';

export interface EffectiveAvailabilityView {
    startDateTime: string;
    endDateTime: string;
    channelType: ChannelType;
}
