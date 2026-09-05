import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';

import { anonymousGuard, authGuard } from './auth.guard';
import { AuthService } from './auth.service';

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

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      [],
      {
        isAuthenticated$: of(false),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authServiceSpy },
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
});
