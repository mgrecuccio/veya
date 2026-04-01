import { TestBed } from '@angular/core/testing';

import { TokenStorageService } from './token-storage.service';
import { AuthTokens } from '../models/auth-tokens.model';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  const mockTokens: AuthTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresInSeconds: 3600,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store tokens', () => {
    service.setTokens(mockTokens);

    expect(localStorage.getItem('auth.accessToken')).toBe('access-token');
    expect(localStorage.getItem('auth.refreshToken')).toBe('refresh-token');
    expect(localStorage.getItem('auth.tokenType')).toBe('Bearer');
    expect(localStorage.getItem('auth.expiresInSeconds')).toBe('3600');
  });

  it('should return access token', () => {
    service.setTokens(mockTokens);
    expect(service.getAccessToken()).toBe('access-token');
  });

    it('should return refresh token', () => {
    service.setTokens(mockTokens);

    expect(service.getRefreshToken()).toBe('refresh-token');
  });

  it('should clear tokens', () => {
    service.setTokens(mockTokens);

    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(localStorage.getItem('auth.tokenType')).toBeNull();
    expect(localStorage.getItem('auth.expiresInSeconds')).toBeNull();
  });

  it('should return stored tokens', () => {
    service.setTokens(mockTokens);

    expect(service.getStoredTokens()).toEqual(mockTokens);
  });

  it('should return null if stored tokens are incomplete', () => {
    localStorage.setItem('auth.accessToken', 'access-token');

    expect(service.getStoredTokens()).toBeNull();

  });

});