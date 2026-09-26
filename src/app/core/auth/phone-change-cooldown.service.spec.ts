import { TestBed } from '@angular/core/testing';

import { PhoneChangeCooldownService } from './phone-change-cooldown.service';

describe('PhoneChangeCooldownService', () => {
  let service: PhoneChangeCooldownService;
  const userId = 42;
  const storageKey = `veya.phone-change-locked-until.${userId}`;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhoneChangeCooldownService);
    localStorage.removeItem(storageKey);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('stores a phone-change lock for 24 hours', () => {
    const now = Date.now();

    const lockedUntil = service.lock(userId);

    expect(lockedUntil).toBeGreaterThanOrEqual(now + 86_400_000);
    expect(service.getLockedUntil(userId)).toBe(lockedUntil);
  });

  it('removes and ignores an expired lock', () => {
    localStorage.setItem(storageKey, (Date.now() - 1).toString());

    expect(service.getLockedUntil(userId)).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
