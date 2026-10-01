import { Injectable } from '@angular/core';

export interface PendingPhoneVerification {
  verificationId: string | null;
  lastSentAt: number;
  purpose: 'registration' | 'phone-change';
  phoneNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class PhoneVerificationStateService {
  private readonly storageKey = 'auth.pendingPhoneVerification';

  getPending(): PendingPhoneVerification | null {
    const value = localStorage.getItem(this.storageKey);

    if (!value) {
      return null;
    }

    try {
      const pending = JSON.parse(value) as Partial<PendingPhoneVerification>;

      if (
        typeof pending.lastSentAt !== 'number' ||
        (pending.verificationId !== null &&
          typeof pending.verificationId !== 'string')
      ) {
        return null;
      }

      const result: PendingPhoneVerification = {
        verificationId: pending.verificationId ?? null,
        lastSentAt: pending.lastSentAt,
        purpose: pending.purpose === 'phone-change' ? 'phone-change' : 'registration',
      };

      if (typeof pending.phoneNumber === 'string') {
        result.phoneNumber = pending.phoneNumber;
      }

      return result;
    } catch {
      return null;
    }
  }

  start(
    purpose: PendingPhoneVerification['purpose'] = 'registration',
    phoneNumber?: string,
  ): void {
    this.store({
      verificationId: null,
      lastSentAt: Date.now(),
      purpose,
      ...(phoneNumber ? { phoneNumber } : {}),
    });
  }

  updateAfterResend(verificationId: string): void {
    const pending = this.getPending();
    this.store({
      verificationId,
      lastSentAt: Date.now(),
      purpose: pending?.purpose ?? 'registration',
      ...(pending?.phoneNumber ? { phoneNumber: pending.phoneNumber } : {}),
    });
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private store(pending: PendingPhoneVerification): void {
    localStorage.setItem(this.storageKey, JSON.stringify(pending));
  }
}
