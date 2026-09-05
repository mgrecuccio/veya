import { BehaviorSubject } from 'rxjs';

import { authenticatedSessionReload } from './authenticated-session-reload.util';
import { AuthTokens } from '../models/auth-tokens.model';

describe('authenticatedSessionReload', () => {
  it('should emit for the current authenticated session', () => {
    const authState$ = new BehaviorSubject<AuthTokens | null>(
      createTokens('access-token'),
    );
    const emissions: void[] = [];

    const sub = authenticatedSessionReload(authState$).subscribe((value) => {
      emissions.push(value);
    });

    expect(emissions.length).toBe(1);

    sub.unsubscribe();
  });

  it('should ignore logout and emit when a new account authenticates', () => {
    const authState$ = new BehaviorSubject<AuthTokens | null>(
      createTokens('first-token'),
    );
    const emissions: void[] = [];

    const sub = authenticatedSessionReload(authState$).subscribe((value) => {
      emissions.push(value);
    });

    authState$.next(null);
    authState$.next(createTokens('second-token'));

    expect(emissions.length).toBe(2);

    sub.unsubscribe();
  });

  it('should not emit again for the same access token', () => {
    const authState$ = new BehaviorSubject<AuthTokens | null>(
      createTokens('access-token'),
    );
    const emissions: void[] = [];

    const sub = authenticatedSessionReload(authState$).subscribe((value) => {
      emissions.push(value);
    });

    authState$.next(createTokens('access-token'));

    expect(emissions.length).toBe(1);

    sub.unsubscribe();
  });
});

function createTokens(accessToken: string): AuthTokens {
  return {
    accessToken,
    refreshToken: `${accessToken}-refresh`,
    tokenType: 'Bearer',
    expiresInSeconds: 3600,
  };
}
