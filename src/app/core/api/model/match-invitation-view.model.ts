import { ChannelType } from './channel-type.model';

export interface MatchInvitationView {
    id: number;
    initiatorUserId: number;
    initiatorDisplayName: string;
    channelType: ChannelType;
    status: string;
    score: number;
    overlapStart: string;
    overlapEnd: string;
    createdAt: string;
    respondedAt?: string | null;
}