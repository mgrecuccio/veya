import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { AuthTokens } from '../models/auth-tokens.model';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let authService: AuthService;
    let tokenStorage: TokenStorageService;

    const mockTokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
    };

    const refreshedTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
    };

    beforeEach(() => {
        localStorage.clear();

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                AuthService,
                TokenStorageService,
            ],
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        authService = TestBed.inject(AuthService);
        tokenStorage = TestBed.inject(TokenStorageService);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should attach Authorization header to protected requests', () => {
        tokenStorage.setTokens(mockTokens);

        http.get('http://localhost:8080/api/v1/users/me').subscribe();

        const req = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
        expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');

        req.flush({ id: 1 });
    });

    it('should not attach Authorization header to auth endpoints', () => {
        tokenStorage.setTokens(mockTokens);

        http.post('http://localhost:8080/api/v1/auth/login', {
            email: 'john@example.com',
            password: 'password123',
        }).subscribe();

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
        expect(req.request.headers.has('Authorization')).toBeFalse();

        req.flush(mockTokens);
    });

    it('should refresh token on 401 and retry the original request', () => {
        tokenStorage.setTokens(mockTokens);

        let responseBody: unknown;

        http.get('http://localhost:8080/api/v1/protected').subscribe((response) => {
            responseBody = response;
        });

        const initialReq = httpMock.expectOne('http://localhost:8080/api/v1/protected');
        expect(initialReq.request.headers.get('Authorization')).toBe('Bearer access-token');
        initialReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
        expect(refreshReq.request.method).toBe('POST');
        expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh-token' });
        refreshReq.flush(refreshedTokens);

        const retryReq = httpMock.expectOne('http://localhost:8080/api/v1/protected');
        expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
        retryReq.flush({ ok: true });

        expect(responseBody).toEqual({ ok: true });
    });

    it('should logout if refresh fails', () => {
        spyOn(authService, 'logout').and.callThrough();
        tokenStorage.setTokens(mockTokens);

        http.get('http://localhost:8080/api/v1/protected').subscribe({
        next: () => fail('Expected error'),
        error: () => {
            expect(authService.logout).toHaveBeenCalled();
            expect(tokenStorage.getAccessToken()).toBeNull();
        },
        });

        const initialReq = httpMock.expectOne('http://localhost:8080/api/v1/protected');
        initialReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
        refreshReq.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not try refresh if no refresh token exists', () => {
        http.get('http://localhost:8080/api/v1/protected').subscribe({
            next: () => fail('Expected error'),
            error: (error) => {
                expect(error.status).toBe(401);
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/protected');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });

        httpMock.expectNone('http://localhost:8080/api/v1/auth/refresh');
    });
});