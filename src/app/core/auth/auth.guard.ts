import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { PhoneVerificationStateService } from './phone-verification-state.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      return router.createUrlTree(['/auth/login']);
    })
  );
};

export const anonymousGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const verificationState = inject(PhoneVerificationStateService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }

      if (verificationState.getPending()) {
        return router.createUrlTree(['/auth/verify-phone']);
      }

      return router.createUrlTree(['/app/home']);
    })
  );
};

export const verifiedAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const verificationState = inject(PhoneVerificationStateService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return router.createUrlTree(['/auth/login']);
      }

      if (verificationState.getPending()) {
        return router.createUrlTree(['/auth/verify-phone']);
      }

      return true;
    }),
  );
};
