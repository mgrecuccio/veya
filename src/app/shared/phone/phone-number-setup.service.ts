import { Injectable } from '@angular/core';
import { ChannelType } from 'src/app/core/api/model/channel-type.model';
import { extractApiError } from 'src/app/core/api/api-error.util';

export const PHONE_REQUIRED_FOR_PROPOSAL_CREATION =
  'PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION';
export const PHONE_REQUIRED_FOR_ACCEPTANCE =
  'PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE';

export type PhoneNumberSetupAction =
  | {
      kind: 'proposal';
      candidateUserId: number;
      channelType: ChannelType;
      returnUrl: string;
    }
  | {
      kind: 'acceptance';
      proposalId: number;
      returnUrl: string;
    };

@Injectable({ providedIn: 'root' })
export class PhoneNumberSetupService {
  private pendingAction: PhoneNumberSetupAction | null = null;

  setPendingAction(action: PhoneNumberSetupAction): void {
    this.pendingAction = action;
  }

  consumePendingAction(): PhoneNumberSetupAction | null {
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
  }

  isPhoneRequiredError(error: unknown): boolean {
    const code = extractApiError(error)?.code;

    return (
      code === PHONE_REQUIRED_FOR_PROPOSAL_CREATION ||
      code === PHONE_REQUIRED_FOR_ACCEPTANCE
    );
  }

  hasPhoneNumber(phoneNumber: string | null | undefined): boolean {
    return Boolean(phoneNumber?.trim());
  }
}
