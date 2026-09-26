import { TestBed } from '@angular/core/testing';

import { PhoneVerificationStateService } from './phone-verification-state.service';

describe('PhoneVerificationStateService', () => {
  let service: PhoneVerificationStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhoneVerificationStateService);
  });

  afterEach(() => localStorage.clear());

  it('stores a registration send even when verificationId is absent', () => {
    spyOn(Date, 'now').and.returnValue(1234);

    service.start();

    expect(service.getPending()).toEqual({
      verificationId: null,
      lastSentAt: 1234,
      purpose: 'registration',
    });
  });

  it('stores phone-change verification purpose', () => {
    service.start('phone-change');

    expect(service.getPending()?.purpose).toBe('phone-change');
  });

  it('stores the id returned by resend', () => {
    spyOn(Date, 'now').and.returnValue(5678);

    service.updateAfterResend('verification-id');

    expect(service.getPending()).toEqual({
      verificationId: 'verification-id',
      lastSentAt: 5678,
      purpose: 'registration',
    });
  });

  it('preserves phone-change purpose when storing a resent code', () => {
    service.start('phone-change');
    service.updateAfterResend('verification-id');

    expect(service.getPending()?.purpose).toBe('phone-change');
  });
});
