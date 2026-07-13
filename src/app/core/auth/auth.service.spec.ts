import { AuthError, AuthService } from "./auth.service";
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TokenStorageService } from "./token-storage.service";
import { AuthTokens } from "../models/auth-tokens.model";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { LoginRequest } from "../models/login-request.model";
import { RegisterRequest } from "../models/register-request.model";


describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let tokenStorage: TokenStorageService;

    const mockTokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                AuthService,
                TokenStorageService,
            ],
        });

        service = TestBed.inject(AuthService);
        tokenStorage = TestBed.inject(TokenStorageService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should login and persist tokens', () => {
        const payload: LoginRequest = {
            email: 'test@email.com',
            password: 'password123',
        };

        service.login(payload).subscribe(response => {
            expect(response).toEqual(mockTokens);
            expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
            expect(tokenStorage.getRefreshToken()).toBe(mockTokens.refreshToken);
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');

        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        
        req.flush(mockTokens);
    });

    it('should register and persist tokens', () => {
        const payload: RegisterRequest = {
            email: 'john@example.com',
            password: 'password123',
            displayName: 'John',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe((response) => {
            expect(response).toEqual(mockTokens);
            expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);

        req.flush(mockTokens);
    });

    it('should register and persist tokens', () => {
        const payload: RegisterRequest = {
            email: 'john@example.com',
            password: 'password123',
            displayName: 'John',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe((response) => {
            expect(response).toEqual(mockTokens);
            expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);

        req.flush(mockTokens);
    });

    it('should refresh token and persist new tokens', () => {
        tokenStorage.setTokens(mockTokens);

        const refreshedTokens: AuthTokens = {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
        };

        service.refreshToken().subscribe((response) => {
            expect(response).toEqual(refreshedTokens);
            expect(tokenStorage.getAccessToken()).toBe('new-access-token');
            expect(tokenStorage.getRefreshToken()).toBe('new-refresh-token');
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            refreshToken: 'refresh-token',
        });

        req.flush(refreshedTokens);
    });

    it('should map login 401 to INVALID_CREDENTIALS', () => {
        const payload: LoginRequest = {
        email: 'john@example.com',
        password: 'wrong-password',
        };

        service.login(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('INVALID_CREDENTIALS');
                expect(error.message).toBe('Invalid email or password.');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should map backend BAD_CREDENTIALS to INVALID_CREDENTIALS', () => {
        const payload: LoginRequest = {
            email: 'john@example.com',
            password: 'wrong-password',
        };

        service.login(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('INVALID_CREDENTIALS');
                expect(error.message).toBe('Invalid email or password.');
                expect(error.apiError?.code).toBe('BAD_CREDENTIALS');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
        req.flush(
            {
                code: 'BAD_CREDENTIALS',
                message: 'Bad credentials',
            },
            { status: 401, statusText: 'Unauthorized' },
        );
    });

    it('should map register 409 to EMAIL_ALREADY_EXISTS', () => {
        const payload: RegisterRequest = {
            email: 'john@example.com',
            password: 'password123',
            displayName: 'John',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('EMAIL_ALREADY_EXISTS');
                expect(error.message).toBe('An account with this email already exists.');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        req.flush({}, { status: 409, statusText: 'Conflict' });
    });

    it('should map backend EMAIL_ALREADY_USED to EMAIL_ALREADY_EXISTS', () => {
        const payload: RegisterRequest = {
            email: 'john@example.com',
            password: 'password123',
            displayName: 'John',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('EMAIL_ALREADY_EXISTS');
                expect(error.message).toBe('An account with this email already exists.');
                expect(error.apiError?.code).toBe('EMAIL_ALREADY_USED');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        req.flush(
            {
                code: 'EMAIL_ALREADY_USED',
                message: 'Email already used',
            },
            { status: 409, statusText: 'Conflict' },
        );
    });

    it('should map backend PHONE_NUMBER_ALREADY_USED to PHONE_NUMBER_ALREADY_EXISTS', () => {
        const payload: RegisterRequest = {
            email: 'john@example.com',
            password: 'password123',
            displayName: 'John',
            phoneNumber: '+393331112222',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('PHONE_NUMBER_ALREADY_EXISTS');
                expect(error.message).toBe('An account with this phone number already exists.');
                expect(error.apiError?.code).toBe('PHONE_NUMBER_ALREADY_USED');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        req.flush(
            {
                code: 'PHONE_NUMBER_ALREADY_USED',
                message: 'Phone number already used',
            },
            { status: 409, statusText: 'Conflict' },
        );
    });

    it('should map network error to NETWORK', () => {
        const payload: LoginRequest = {
            email: 'john@example.com',
            password: 'password123',
        };

        service.login(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('NETWORK');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
        req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should emit authenticated state when tokens exist', async () => {
        const authStates: boolean[] = [];
        const sub = service.isAuthenticated$.subscribe((value) => authStates.push(value));

        service['persistAuth'](mockTokens);

        expect(authStates[authStates.length - 1]).toBeTrue();
        sub.unsubscribe();
    });

    it('should emit unauthenticated state after logout', () => {
        const authStates: boolean[] = [];
        const sub = service.isAuthenticated$.subscribe((value) => authStates.push(value));

        service['persistAuth'](mockTokens);
        service.logout();

        expect(authStates[authStates.length - 1]).toBeFalse();
        sub.unsubscribe();
    });

    it('should fail refresh when no refresh token exists', () => {
        service.refreshToken().subscribe({
        next: () => fail('Expected error'),
        error: (error: AuthError) => {
            expect(error.code).toBe('UNAUTHORIZED');
        },
        });

        httpMock.expectNone('http://localhost:8080/api/v1/auth/refresh');
    });

    it('should map backend INVALID_REFRESH_TOKEN to UNAUTHORIZED and clear tokens', () => {
        tokenStorage.setTokens(mockTokens);

        service.refreshToken().subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('UNAUTHORIZED');
                expect(error.apiError?.code).toBe('INVALID_REFRESH_TOKEN');
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(tokenStorage.getRefreshToken()).toBeNull();
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
        req.flush(
            {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid refresh token',
            },
            { status: 400, statusText: 'Bad Request' },
        );
    });

    it('should share a single refresh request for concurrent refresh calls', () => {
        tokenStorage.setTokens(mockTokens);

        let response1: AuthTokens | undefined;
        let response2: AuthTokens | undefined;

        service.refreshToken().subscribe((res) => (response1 = res));
        service.refreshToken().subscribe((res) => (response2 = res));

        const reqs = httpMock.match('http://localhost:8080/api/v1/auth/refresh');
        expect(reqs.length).toBe(1);

        reqs[0].flush(mockTokens);

        expect(response1).toEqual(mockTokens);
        expect(response2).toEqual(mockTokens);
    });
});
