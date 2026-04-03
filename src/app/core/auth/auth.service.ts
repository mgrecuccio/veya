import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { TokenStorageService } from './token-storage.service';
import { AuthTokens } from '../models/auth-tokens.model';

export interface AuthError {
  code:
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_ALREADY_EXISTS'
    | 'UNAUTHORIZED'
    | 'NETWORK'
    | 'UNKNOWN';
  message: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly baseUrl = 'http://localhost:8080';
  private readonly authApiUrl = `${this.baseUrl}/api/v1/auth`;

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
          this.logout();
          return throwError(() => this.mapAuthError(error, 'refresh'));
        })
      );

    return this.refreshRequest$;
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this.authStateSubject.next(null);
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
    operation: 'login' | 'register' | 'refresh'
  ): AuthError {
    if (error.status === 0) {
      return {
        code: 'NETWORK',
        message: 'Unable to reach the server. Please try again.',
      };
    }

    if (operation === 'login' && error.status === 401) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      };
    }

    if (operation === 'register' && error.status === 409) {
      return {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists.',
      };
    }

    if (operation === 'refresh' && error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
      };
    }

    return {
      code: 'UNKNOWN',
      message: this.extractBackendMessage(error) ?? 'Something went wrong. Please try again.',
    };
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
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