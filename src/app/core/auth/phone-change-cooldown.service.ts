import { Injectable } from '@angular/core';

const PHONE_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'veya.phone-change-locked-until';

@Injectable({ providedIn: 'root' })
export class PhoneChangeCooldownService {
  getLockedUntil(userId: number): number | null {
    try {
      const value = Number(globalThis.localStorage?.getItem(this.storageKey(userId)));

      if (!Number.isFinite(value) || value <= Date.now()) {
        globalThis.localStorage?.removeItem(this.storageKey(userId));
        return null;
      }

      return value;
    } catch {
      return null;
    }
  }

  lock(userId: number): number {
    const lockedUntil = Date.now() + PHONE_CHANGE_COOLDOWN_MS;

    try {
      globalThis.localStorage?.setItem(
        this.storageKey(userId),
        lockedUntil.toString(),
      );
    } catch {
      // The in-memory component state still enforces the lock for this session.
    }

    return lockedUntil;
  }

  private storageKey(userId: number): string {
    return `${STORAGE_KEY_PREFIX}.${userId}`;
  }
}
