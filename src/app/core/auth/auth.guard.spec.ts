import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';

import { anonymousGuard, authGuard, verifiedAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PhoneVerificationStateService } from './phone-verification-state.service';

async function resolveGuardResult<T>(
  value: T | Promise<T> | Observable<T>
): Promise<T> {
  if (isObservable(value)) {
    return firstValueFrom(value);
  }

  return Promise.resolve(value);
}

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      [],
      {
        isAuthenticated$: of(true),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
  });

  it('should allow navigation when authenticated', async () => {
    Object.defineProperty(authServiceSpy, 'isAuthenticated$', {
      get: () => of(true),
    });

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never)
    );

    const result = await resolveGuardResult(guardResult);

    expect(result).toBeTrue();
  });

  it('should redirect to login when unauthenticated', async () => {
    const urlTree = {} as UrlTree;

    Object.defineProperty(authServiceSpy, 'isAuthenticated$', {
      get: () => of(false),
    });
    router.createUrlTree.and.returnValue(urlTree);

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never)
    );

    const result = await resolveGuardResult(guardResult);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe(urlTree);
  });
});

describe('anonymousGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let verificationStateSpy: jasmine.SpyObj<PhoneVerificationStateService>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      [],
      {
        isAuthenticated$: of(false),
      }
    );
    verificationStateSpy = jasmine.createSpyObj<PhoneVerificationStateService>(
      'PhoneVerificationStateService',
      ['getPending'],
    );
    verificationStateSpy.getPending.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PhoneVerificationStateService, useValue: verificationStateSpy },
      ],
    });
  });

  it('should allow auth pages when unauthenticated', async () => {
    Object.defineProperty(authServiceSpy, 'isAuthenticated$', {
      get: () => of(false),
    });

    const guardResult = TestBed.runInInjectionContext(() =>
      anonymousGuard({} as never, {} as never)
    );

    const result = await resolveGuardResult(guardResult);

    expect(result).toBeTrue();
  });

  it('should redirect authenticated users to home', async () => {
    const urlTree = {} as UrlTree;

    Object.defineProperty(authServiceSpy, 'isAuthenticated$', {
      get: () => of(true),
    });
    router.createUrlTree.and.returnValue(urlTree);

    const guardResult = TestBed.runInInjectionContext(() =>
      anonymousGuard({} as never, {} as never)
    );

    const result = await resolveGuardResult(guardResult);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/app/home']);
    expect(result).toBe(urlTree);
  });

  it('should resume phone verification for authenticated pending users', async () => {
    const urlTree = {} as UrlTree;
    Object.defineProperty(authServiceSpy, 'isAuthenticated$', {
      get: () => of(true),
    });
    verificationStateSpy.getPending.and.returnValue({
      verificationId: null,
      lastSentAt: Date.now(),
      purpose: 'registration',
    });
    router.createUrlTree.and.returnValue(urlTree);

    const guardResult = TestBed.runInInjectionContext(() =>
      anonymousGuard({} as never, {} as never)
    );

    expect(await resolveGuardResult(guardResult)).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/verify-phone']);
  });
});

describe('verifiedAuthGuard', () => {
  it('should prevent pending users from entering the app', async () => {
    const urlTree = {} as UrlTree;
    const router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(urlTree);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', [], {
      isAuthenticated$: of(true),
    });
    const verificationState = jasmine.createSpyObj<PhoneVerificationStateService>(
      'PhoneVerificationStateService',
      ['getPending'],
    );
    verificationState.getPending.and.returnValue({
      verificationId: 'verification-id',
      lastSentAt: Date.now(),
      purpose: 'registration',
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        { provide: PhoneVerificationStateService, useValue: verificationState },
      ],
    });

    const guardResult = TestBed.runInInjectionContext(() =>
      verifiedAuthGuard({} as never, {} as never)
    );

    expect(await resolveGuardResult(guardResult)).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/verify-phone']);
  });
});
