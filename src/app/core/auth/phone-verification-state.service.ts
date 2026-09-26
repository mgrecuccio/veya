import { Injectable } from '@angular/core';

export interface PendingPhoneVerification {
  verificationId: string | null;
  lastSentAt: number;
  purpose: 'registration' | 'phone-change';
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

      return {
        verificationId: pending.verificationId ?? null,
        lastSentAt: pending.lastSentAt,
        purpose: pending.purpose === 'phone-change' ? 'phone-change' : 'registration',
      };
    } catch {
      return null;
    }
  }

  start(purpose: PendingPhoneVerification['purpose'] = 'registration'): void {
    this.store({
      verificationId: null,
      lastSentAt: Date.now(),
      purpose,
    });
  }

  updateAfterResend(verificationId: string): void {
    this.store({
      verificationId,
      lastSentAt: Date.now(),
      purpose: this.getPending()?.purpose ?? 'registration',
    });
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private store(pending: PendingPhoneVerification): void {
    localStorage.setItem(this.storageKey, JSON.stringify(pending));
  }
}
