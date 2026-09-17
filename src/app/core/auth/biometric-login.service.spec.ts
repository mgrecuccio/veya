import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { BiometricLoginService } from './biometric-login.service';
import { AuthTokens } from '../models/auth-tokens.model';

describe('BiometricLoginService', () => {
  let service: BiometricLoginService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let authTokensUpdated$: Subject<AuthTokens>;

  beforeEach(() => {
    localStorage.clear();
    authTokensUpdated$ = new Subject<AuthTokens>();
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['lock', 'refreshWithToken', 'getAccessToken'],
      { authTokensUpdated$: authTokensUpdated$.asObservable() },
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

  it('should not apply the native startup lock in the browser', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');

    await service.initialize();

    expect(authServiceSpy.lock).not.toHaveBeenCalled();
  });

  it('should clear the enabled preference when disabled', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');

    await service.disable();

    expect(localStorage.getItem('auth.biometricLoginEnabled')).toBeNull();
  });

  it('should synchronize every rotated refresh token to biometric storage', () => {
    const saveSpy = spyOn(service, 'saveRefreshToken').and.resolveTo();

    authTokensUpdated$.next({
      accessToken: 'new-access-token',
      refreshToken: 'rotated-refresh-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    });

    expect(saveSpy).toHaveBeenCalledOnceWith('rotated-refresh-token');
  });

  it('should cover account content immediately when sent to the background', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');
    authServiceSpy.getAccessToken.and.returnValue('access-token');

    await service['handleAppStateChange'](false);

    expect(service.isLocked()).toBeTrue();
  });

  it('should unlock without a prompt when returning before the timeout', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');
    authServiceSpy.getAccessToken.and.returnValue('access-token');
    await service['handleAppStateChange'](false);

    await service['handleAppStateChange'](true);

    expect(service.isLocked()).toBeFalse();
  });

  it('should request biometric unlock after the background timeout', async () => {
    localStorage.setItem('auth.biometricLoginEnabled', 'true');
    authServiceSpy.getAccessToken.and.returnValue('access-token');
    await service['handleAppStateChange'](false);
    service['backgroundedAt'] = Date.now() - 31_000;
    const unlockSpy = spyOn(service, 'unlockApp').and.resolveTo();

    await service['handleAppStateChange'](true);

    expect(unlockSpy).toHaveBeenCalledTimes(1);
  });
});
