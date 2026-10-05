import { AuthError, AuthService } from "./auth.service";
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TokenStorageService } from "./token-storage.service";
import { AuthTokens } from "../models/auth-tokens.model";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { LoginRequest } from "../models/login-request.model";
import { RegisterRequest } from "../models/register-request.model";
import { ChangePasswordRequest } from '../models/change-password-request.model';


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
            phoneNumber: '+32468009911',
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
            password: 'password123',
            displayName: 'John',
            phoneNumber: '+32468009911',
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

    it('should change the password and clear revoked tokens', () => {
        tokenStorage.setTokens(mockTokens);
        const payload: ChangePasswordRequest = {
            currentPassword: 'password123',
            newPassword: 'new-password-456',
        };
        const authStates: Array<AuthTokens | null> = [];
        const sub = service.authState$.subscribe((state) => authStates.push(state));

        service.changePassword(payload).subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
            expect(authStates.at(-1)).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/change-password');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        req.flush(null, { status: 204, statusText: 'No Content' });

        sub.unsubscribe();
    });

    it('should delete the authenticated account and clear the session', () => {
        tokenStorage.setTokens(mockTokens);
        const authStates: Array<AuthTokens | null> = [];
        const sub = service.authState$.subscribe((state) => authStates.push(state));

        service.deleteAccount().subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
            expect(authStates.at(-1)).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/me');
        expect(req.request.method).toBe('DELETE');
        expect(req.request.body).toBeNull();
        req.flush(null, { status: 200, statusText: 'OK' });

        sub.unsubscribe();
    });

    it('should retain the session when account deletion fails', () => {
        tokenStorage.setTokens(mockTokens);

        service.deleteAccount().subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.apiError?.code).toBe('INTERNAL_SERVER_ERROR');
                expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
                expect(tokenStorage.getRefreshToken()).toBe(mockTokens.refreshToken);
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/me');
        req.flush(
            {
                code: 'INTERNAL_SERVER_ERROR',
                detail: 'Account deletion failed.',
            },
            { status: 500, statusText: 'Internal Server Error' },
        );
    });

    it('should retain tokens when changing the password fails', () => {
        tokenStorage.setTokens(mockTokens);

        service.changePassword({
            currentPassword: 'wrong-password',
            newPassword: 'new-password-456',
        }).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('INVALID_CREDENTIALS');
                expect(error.message).toBe('Your current password is incorrect.');
                expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
                expect(tokenStorage.getRefreshToken()).toBe(mockTokens.refreshToken);
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/change-password');
        req.flush(
            { code: 'BAD_CREDENTIALS', detail: 'Bad credentials' },
            { status: 401, statusText: 'Unauthorized' },
        );
    });

    it('should request password recovery without authenticating the user', () => {
        service.requestPasswordRecovery({ phoneNumber: '+32468009911' }).subscribe((response) => {
            expect(response).toEqual({ verificationId: null });
            expect(tokenStorage.getAccessToken()).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/password-recovery');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phoneNumber: '+32468009911' });
        req.flush({ verificationId: null });
    });

    it('should verify password recovery and clear any stored session', () => {
        tokenStorage.setTokens(mockTokens);
        const payload = {
            phoneNumber: '+32468009911',
            verificationId: 'verification-id',
            otpCode: '123456',
            newPassword: 'newStrongPassword',
        };

        service.verifyPasswordRecovery(payload).subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/verify-password-recovery');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        req.flush(null, { status: 204, statusText: 'No Content' });
    });

    const passwordRecoveryErrors: Array<[AuthError['code'], string, number]> = [
        ['INVALID_VERIFICATION_CODE', 'The verification code is invalid.', 400],
        ['EXPIRED_VERIFICATION', 'The verification code has expired. Request a new one.', 400],
        ['INVALID_VERIFICATION_EXCEPTION', 'We could not verify this code. Request a new one.', 404],
        ['TOO_MANY_ATTEMPTS', 'Too many attempts. Try again later.', 429],
    ];

    passwordRecoveryErrors.forEach(([code, message, status]) => {
        it(`should map ${code} password recovery errors`, () => {
            service.verifyPasswordRecovery({
                phoneNumber: '+32468009911',
                verificationId: 'verification-id',
                otpCode: '123456',
                newPassword: 'newStrongPassword',
            }).subscribe({
                next: () => fail('Expected error'),
                error: (error: AuthError) => {
                    expect(error.code).toBe(code);
                    expect(error.message).toBe(message);
                },
            });

            const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/verify-password-recovery');
            req.flush({ code }, { status: status as number, statusText: 'Error' });
        });
    });

    it('should preserve password recovery validation details', () => {
        const details = { newPassword: 'Password needs an uppercase letter.' };

        service.verifyPasswordRecovery({
            phoneNumber: '+32468009911',
            verificationId: 'verification-id',
            otpCode: '123456',
            newPassword: 'password',
        }).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('VALIDATION_ERROR');
                expect(error.apiError?.details).toEqual(details);
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/verify-password-recovery');
        req.flush(
            { code: 'VALIDATION_ERROR', message: 'Invalid request', details },
            { status: 400, statusText: 'Bad Request' },
        );
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
        phoneNumber: '+32468009911',
        password: 'wrong-password',
        };

        service.login(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('INVALID_CREDENTIALS');
                expect(error.message).toBe('Invalid phone number or password.');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should map backend BAD_CREDENTIALS to INVALID_CREDENTIALS', () => {
        const payload: LoginRequest = {
            phoneNumber: '+32468009911',
            password: 'wrong-password',
        };

        service.login(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('INVALID_CREDENTIALS');
                expect(error.message).toBe('Invalid phone number or password.');
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

    it('should map register 409 to PHONE_NUMBER_ALREADY_EXISTS', () => {
        const payload: RegisterRequest = {
            password: 'password123',
            displayName: 'John',
            phoneNumber: '+32468009911',
            timezone: 'Europe/Brussels',
        };

        service.register(payload).subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('PHONE_NUMBER_ALREADY_EXISTS');
                expect(error.message).toBe('An account with this phone number already exists.');
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
        req.flush({}, { status: 409, statusText: 'Conflict' });
    });

    it('should map backend PHONE_NUMBER_ALREADY_USED to PHONE_NUMBER_ALREADY_EXISTS', () => {
        const payload: RegisterRequest = {
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
            phoneNumber: '+32468009911',
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

    it('should revoke logout on the backend and clear tokens', () => {
        tokenStorage.setTokens(mockTokens);

        service.logoutAndRevoke().subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({});

        req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should clear tokens even when backend logout fails', () => {
        tokenStorage.setTokens(mockTokens);

        service.logoutAndRevoke().subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
        req.flush(
            {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Logout failed',
            },
            { status: 500, statusText: 'Internal Server Error' },
        );
    });

    it('should clear tokens without backend logout when no access token exists', () => {
        service.logoutAndRevoke().subscribe(() => {
            expect(tokenStorage.getAccessToken()).toBeNull();
            expect(tokenStorage.getRefreshToken()).toBeNull();
        });

        httpMock.expectNone('http://localhost:8080/api/v1/auth/logout');
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

    it('should preserve stored tokens when refresh fails because the backend is unavailable', () => {
        tokenStorage.setTokens(mockTokens);

        service.refreshToken().subscribe({
            next: () => fail('Expected error'),
            error: (error: AuthError) => {
                expect(error.code).toBe('NETWORK');
                expect(tokenStorage.getAccessToken()).toBe(mockTokens.accessToken);
                expect(tokenStorage.getRefreshToken()).toBe(mockTokens.refreshToken);
            },
        });

        const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
        req.error(new ProgressEvent('error'), {
            status: 0,
            statusText: 'Unknown Error',
        });
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
