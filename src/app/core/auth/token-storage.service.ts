import { Injectable } from '@angular/core';
import { AuthTokens } from '../models/auth-tokens.model';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly accessTokenKey = 'auth.accessToken';
  private readonly refreshTokenKey = 'auth.refreshToken';
  private readonly tokenTypeKey = 'auth.tokenType';
  private readonly expiresInSecondsKey = 'auth.expiresInSeconds';

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.accessTokenKey, tokens.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
    localStorage.setItem(this.tokenTypeKey, tokens.tokenType);
    localStorage.setItem(this.expiresInSecondsKey, String(tokens.expiresInSeconds));
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tokenTypeKey);
    localStorage.removeItem(this.expiresInSecondsKey);
  }

  getStoredTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(this.accessTokenKey);
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    const tokenType = localStorage.getItem(this.tokenTypeKey);
    const expiresInSeconds = localStorage.getItem(this.expiresInSecondsKey);

    if (!accessToken || !refreshToken || !tokenType || !expiresInSeconds) {
      return null;
    }

    return {
        accessToken,
        refreshToken,
        tokenType,
        expiresInSeconds: Number(expiresInSeconds),
    };
  }
}