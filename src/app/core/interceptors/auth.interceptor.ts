import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/register') ||
    req.url.includes('/api/v1/auth/refresh');

  const accessToken = authService.getAccessToken();

  const authReq =
    !isAuthEndpoint && accessToken
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        isAuthEndpoint ||
        isRejectedChangePassword(error, req.url)
      ) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        authService.logout();
        redirectToLogin(router);
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((tokens) => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          if (
            refreshError instanceof HttpErrorResponse &&
            isRejectedChangePassword(refreshError, req.url)
          ) {
            return throwError(() => refreshError);
          }

          if (!isUnauthorizedRefreshError(refreshError)) {
            return throwError(() => refreshError);
          }

          authService.logout();
          redirectToLogin(router);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function isRejectedChangePassword(error: HttpErrorResponse, url: string): boolean {
  return url.includes('/api/v1/auth/change-password') &&
    error.error?.code === 'BAD_CREDENTIALS';
}

function redirectToLogin(router: Router): void {
  void router.navigateByUrl('/auth/login', { replaceUrl: true });
}

function isUnauthorizedRefreshError(error: unknown): boolean {
  return !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'UNAUTHORIZED';
}
