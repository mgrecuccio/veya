import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';
import { AuthService, AuthError } from 'src/app/core/auth/auth.service';
import { Router } from '@angular/router';

describe('LoginPage', () => {
    let fixture: ComponentFixture<LoginPage>;
    let component: LoginPage;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

        await TestBed.configureTestingModule({
        imports: [LoginPage],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginPage);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);

        spyOn(router, 'navigateByUrl').and.resolveTo(true);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not submit if form is invalid', () => {
        component.form.patchValue({
            phoneNumber: '',
            password: '',
        });

        component.submit();

        expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should require an E.164 phone number', () => {
        component.form.patchValue({
            phoneNumber: '0468 00 99 11',
            password: 'password123',
        });

        component.submit();

        expect(component.phoneNumber.errors?.['pattern']).toBeTruthy();
        expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with form values', () => {
        authServiceSpy.login.and.returnValue(
        of({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
        })
        );

        component.form.patchValue({
            phoneNumber: '+32468009911',
            password: 'password123',
        });

        component.submit();

        expect(authServiceSpy.login).toHaveBeenCalledWith({
            phoneNumber: '+32468009911',
            password: 'password123',
        });
    });

    it('should navigate to /home on successful login', async () => {
        authServiceSpy.login.and.returnValue(
        of({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
        })
        );

        component.form.patchValue({
            phoneNumber: '+32468009911',
            password: 'password123',
        });

        component.submit();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', { replaceUrl: true });
    });

    it('should keep back navigation when navigating to register', () => {
        component.goToRegister();

        const [url, extras] = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args;
        expect(url.toString()).toBe('/auth/register');
        expect(extras).not.toEqual(jasmine.objectContaining({ replaceUrl: true }));
    });

    it('should navigate back to onboarding', () => {
        component.goBack();

        const [url] = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args;
        expect(url.toString()).toBe('/auth/onboarding');
    });

    it('should set invalidCredentials form error on login failure', () => {
    const error: AuthError = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid phone number or password.',
    };

    authServiceSpy.login.and.returnValue(
        throwError(() => error)
    );

    component.form.patchValue({
        phoneNumber: '+32468009911',
        password: 'wrong-password',
    });

    component.submit();

    expect(component.form.errors?.['invalidCredentials']).toBeTrue();
    expect(component.serverError).toBeNull();
    expect(component.isSubmitting).toBeFalse();
    });

    it('should set serverError for generic login error', () => {
        const error: AuthError = {
            code: 'UNKNOWN',
            message: 'Something went wrong.',
        };

        authServiceSpy.login.and.returnValue(
            throwError(() => error)
        );

        component.form.patchValue({
            phoneNumber: '+32468009911',
            password: 'password123',
        });

        component.submit();

        expect(component.serverError).toBe('Something went wrong.');
        expect(component.isSubmitting).toBeFalse();
    });

    it('should set isSubmitting back to false after success', () => {
        authServiceSpy.login.and.returnValue(
        of({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
        })
        );

        component.form.patchValue({
            phoneNumber: '+32468009911',
            password: 'password123',
        });

        component.submit();

        expect(component.isSubmitting).toBeFalse();
    });

    it('should expose phone number getter', () => {
        expect(component.phoneNumber).toBe(component.form.controls.phoneNumber);
    });

    it('should expose password getter', () => {
        expect(component.password).toBe(component.form.controls.password);
    });

    it('should return true from isInvalid when control is invalid and touched', () => {
        component.form.controls.phoneNumber.markAsTouched();
        component.form.controls.phoneNumber.setValue('');

        expect(component.isInvalid('phoneNumber')).toBeTrue();
    });

    it('should return false from isInvalid when control is valid', () => {
        component.form.controls.phoneNumber.setValue('+32468009911');
        component.form.controls.phoneNumber.markAsTouched();

        expect(component.isInvalid('phoneNumber')).toBeFalse();
    });
});
