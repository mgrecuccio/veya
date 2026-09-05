import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { AuthTokens } from '../models/auth-tokens.model';

export function authenticatedSessionReload(
  authState$: Observable<AuthTokens | null>,
): Observable<void> {
  return authState$.pipe(
    map((tokens) => tokens?.accessToken ?? null),
    distinctUntilChanged(),
    filter((accessToken): accessToken is string => !!accessToken),
    map(() => void 0),
  );
}
