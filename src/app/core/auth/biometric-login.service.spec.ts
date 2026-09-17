import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { BiometricLoginService } from './biometric-login.service';

describe('BiometricLoginService', () => {
  let service: BiometricLoginService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    localStorage.clear();
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['lock', 'refreshWithToken']
    );

    TestBed.configureTestingModule({
      providers: [
        BiometricLoginService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(BiometricLoginService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should report biometric login as unavailable in the browser', async () => {
    const availability = await service.getAvailability();

    expect(availability).toEqual({
      available: false,
      enabled: false,
      label: 'Biometrics',
    });
  });

  it('should do nothing at startup when biometric login is disabled', async () => {
    await service.initialize();

    expect(authServiceSpy.lock).not.toHaveBeenCalled();
  });

  it('should lock persisted browser tokens when biometric login was enabled', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');

    await service.initialize();

    expect(authServiceSpy.lock).toHaveBeenCalledTimes(1);
  });

  it('should clear the enabled preference when disabled', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');

    await service.disable();

    expect(localStorage.getItem('auth.biometricLoginEnabled')).toBeNull();
  });
});
