import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { TokenStorageService } from './token-storage.service';
import { AuthTokens } from '../models/auth-tokens.model';
import { environment } from "src/environments/environment";
import { ApiError } from '../api/model/api-error.model';
import { extractApiError } from '../api/api-error.util';
import { PhoneVerificationStateService } from './phone-verification-state.service';
import { ChangePasswordRequest } from '../models/change-password-request.model';
import {
  PasswordRecoveryRequest,
  PasswordRecoveryResponse,
  VerifyPasswordRecoveryRequest,
} from '../models/password-recovery.model';

export interface AuthError {
  code:
    | 'INVALID_CREDENTIALS'
    | 'PHONE_NUMBER_ALREADY_EXISTS'
    | 'INVALID_VERIFICATION_CODE'
    | 'EXPIRED_VERIFICATION'
    | 'INVALID_VERIFICATION_EXCEPTION'
    | 'TOO_MANY_ATTEMPTS'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'NETWORK'
    | 'UNKNOWN';
  message: string;
  apiError?: ApiError;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly phoneVerificationState = inject(PhoneVerificationStateService);


  private readonly authApiUrl = `${this.apiBaseUrl}/api/v1/auth`;

  private readonly authStateSubject = new BehaviorSubject<AuthTokens | null>(
    this.tokenStorage.getStoredTokens()
  );

  readonly authState$ = this.authStateSubject.asObservable();
  readonly isAuthenticated$ = this.authState$.pipe(
    map((tokens) => !!tokens?.accessToken)
  );

  private refreshRequest$: Observable<AuthTokens> | null = null;

  login(payload: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authApiUrl}/login`, payload).pipe(
      tap((tokens) => this.persistAuth(tokens)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => this.mapAuthError(error, 'login'))
      )
    );
  }

  register(payload: RegisterRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authApiUrl}/register`, payload).pipe(
      tap((tokens) => this.persistAuth(tokens)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => this.mapAuthError(error, 'register'))
      )
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.authApiUrl}/change-password`, payload).pipe(
      tap(() => this.logout()),
      catchError((error: HttpErrorResponse) =>
        throwError(() => this.mapAuthError(error, 'changePassword'))
      )
    );
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.authApiUrl}/me`).pipe(
      tap(() => this.logout()),
      catchError((error: HttpErrorResponse) =>
        throwError(() => this.mapAuthError(error, 'deleteAccount'))
      )
    );
  }

  requestPasswordRecovery(
    payload: PasswordRecoveryRequest,
  ): Observable<PasswordRecoveryResponse> {
    return this.http
      .post<PasswordRecoveryResponse>(`${this.authApiUrl}/password-recovery`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => this.mapAuthError(error, 'passwordRecovery'))
        ),
      );
  }

  verifyPasswordRecovery(
    payload: VerifyPasswordRecoveryRequest,
  ): Observable<void> {
    return this.http
      .post<void>(`${this.authApiUrl}/verify-password-recovery`, payload)
      .pipe(
        tap(() => this.logout()),
        catchError((error: HttpErrorResponse) =>
          throwError(() => this.mapAuthError(error, 'verifyPasswordRecovery'))
        ),
      );
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => ({
        code: 'UNAUTHORIZED',
        message: 'No refresh token available.',
      } as AuthError));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const payload: RefreshTokenRequest = { refreshToken };

    this.refreshRequest$ = this.http
      .post<AuthTokens>(`${this.authApiUrl}/refresh`, payload)
      .pipe(
        tap((tokens) => this.persistAuth(tokens)),
        shareReplay(1),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        catchError((error: HttpErrorResponse) => {
          const authError = this.mapAuthError(error, 'refresh');

          if (authError.code === 'UNAUTHORIZED') {
            this.logout();
          }

          return throwError(() => authError);
        })
      );

    return this.refreshRequest$;
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this.phoneVerificationState.clear();
    this.authStateSubject.next(null);
  }

  logoutAndRevoke(): Observable<void> {
    if (!this.getAccessToken()) {
      this.logout();
      return of(void 0);
    }

    return this.http.post<void>(`${this.authApiUrl}/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.logout())
    );
  }

  getAccessToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  private persistAuth(tokens: AuthTokens): void {
    this.tokenStorage.setTokens(tokens);
    this.authStateSubject.next(tokens);
  }

  private mapAuthError(
    error: HttpErrorResponse,
    operation:
      | 'login'
      | 'register'
      | 'refresh'
      | 'changePassword'
      | 'deleteAccount'
      | 'passwordRecovery'
      | 'verifyPasswordRecovery'
  ): AuthError {
    const apiError = extractApiError(error);
    const authApiError = apiError ?? undefined;

    if (error.status === 0) {
      return {
        code: 'NETWORK',
        message: 'Unable to reach the server. Please try again.',
      };
    }

    if (
      operation === 'login' &&
      (apiError?.code === 'BAD_CREDENTIALS' || error.status === 401)
    ) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid phone number or password.',
        apiError: authApiError,
      };
    }

    if (
      operation === 'changePassword' &&
      apiError?.code === 'BAD_CREDENTIALS'
    ) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Your current password is incorrect.',
        apiError: authApiError,
      };
    }

    if (operation === 'changePassword' && error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
        apiError: authApiError,
      };
    }

    if (operation === 'deleteAccount' && error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
        apiError: authApiError,
      };
    }

    if (
      operation === 'register' &&
      (apiError?.code === 'PHONE_NUMBER_ALREADY_USED' ||
        apiError?.code === 'PHONE_NUMBER_ALREADY_EXISTS' ||
        (!apiError && error.status === 409))
    ) {
      return {
        code: 'PHONE_NUMBER_ALREADY_EXISTS',
        message: 'An account with this phone number already exists.',
        apiError: authApiError,
      };
    }

    if (
      operation === 'refresh' &&
      (apiError?.code === 'INVALID_REFRESH_TOKEN' || apiError?.code === 'AUTHENTICATION_REQUIRED' || error.status === 401)
    ) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
        apiError: authApiError,
      };
    }

    if (
      (operation === 'passwordRecovery' || operation === 'verifyPasswordRecovery') &&
      apiError?.code === 'VALIDATION_ERROR'
    ) {
      return {
        code: 'VALIDATION_ERROR',
        message: apiError.message || 'Check the information you entered and try again.',
        apiError: authApiError,
      };
    }

    if (operation === 'verifyPasswordRecovery') {
      const messages: Partial<Record<AuthError['code'], string>> = {
        INVALID_VERIFICATION_CODE: 'The verification code is invalid.',
        EXPIRED_VERIFICATION: 'The verification code has expired. Request a new one.',
        INVALID_VERIFICATION_EXCEPTION: 'We could not verify this code. Request a new one.',
        TOO_MANY_ATTEMPTS: 'Too many attempts. Try again later.',
      };
      const code = apiError?.code as AuthError['code'] | undefined;
      const message = code ? messages[code] : undefined;

      if (code && message) {
        return { code, message, apiError: authApiError };
      }
    }

    return {
      code: 'UNKNOWN',
      message: this.extractBackendMessage(error, apiError) ?? 'Something went wrong. Please try again.',
      apiError: authApiError,
    };
  }

  private extractBackendMessage(error: HttpErrorResponse, apiError: ApiError | null): string | null {
    if (apiError?.message) {
      return apiError.message;
    }

    const payload = error.error;

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }

    if (typeof payload.error === 'string') {
      return payload.error;
    }

    return null;
  }
}
