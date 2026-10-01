import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthError, AuthService } from 'src/app/core/auth/auth.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { PasswordRecoveryPage } from './password-recovery.page';

describe('PasswordRecoveryPage', () => {
  let fixture: ComponentFixture<PasswordRecoveryPage>;
  let component: PasswordRecoveryPage;
  let authService: jasmine.SpyObj<AuthService>;
  let appToastService: jasmine.SpyObj<AppToastService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'requestPasswordRecovery',
      'verifyPasswordRecovery',
    ]);
    appToastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['show']);
    appToastService.show.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PasswordRecoveryPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: AppToastService, useValue: appToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordRecoveryPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('should request recovery with an E.164 phone number', () => {
    authService.requestPasswordRecovery.and.returnValue(
      of({ verificationId: 'verification-id' }),
    );
    component.phoneForm.patchValue({
      phoneCountry: 'BE',
      phoneNational: '0468 00 99 11',
    });

    component.requestRecovery();

    expect(authService.requestPasswordRecovery).toHaveBeenCalledOnceWith({
      phoneNumber: '+32468009911',
    });
    expect(component.step).toBe('verify');
    expect(component.verificationId).toBe('verification-id');
  });

  it('should show the same generic state when no verification ID is returned', () => {
    authService.requestPasswordRecovery.and.returnValue(of({ verificationId: null }));
    component.phoneForm.patchValue({
      phoneCountry: 'BE',
      phoneNational: '0468 00 99 11',
    });

    component.requestRecovery();
    fixture.detectChanges();

    expect(component.step).toBe('unavailable');
    expect(fixture.nativeElement.textContent).toContain(
      'If an account exists for this phone number, we sent a verification code.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('not found');
  });

  it('should submit all verification fields', () => {
    authService.requestPasswordRecovery.and.returnValue(
      of({ verificationId: 'verification-id' }),
    );
    authService.verifyPasswordRecovery.and.returnValue(of(void 0));
    component.phoneForm.patchValue({
      phoneCountry: 'BE',
      phoneNational: '0468 00 99 11',
    });
    component.requestRecovery();
    component.verificationForm.setValue({
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });

    component.resetPassword();

    expect(authService.verifyPasswordRecovery).toHaveBeenCalledOnceWith({
      phoneNumber: '+32468009911',
      verificationId: 'verification-id',
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });
  });

  it('should show success and return to login after reset', () => {
    authService.verifyPasswordRecovery.and.returnValue(of(void 0));
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = 'verification-id';
    component.verificationForm.setValue({
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });

    component.resetPassword();

    expect(appToastService.show).toHaveBeenCalledOnceWith(
      'Your password has been reset. Log in with your new password.',
      'success',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login', { replaceUrl: true });
  });

  it('should show the specified verification error message', () => {
    const error: AuthError = {
      code: 'EXPIRED_VERIFICATION',
      message: 'The verification code has expired. Request a new one.',
    };
    authService.verifyPasswordRecovery.and.returnValue(throwError(() => error));
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = 'verification-id';
    component.verificationForm.setValue({
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });

    component.resetPassword();

    expect(component.serverError).toBe(
      'The verification code has expired. Request a new one.',
    );
  });

  it('should display field-level backend validation messages', () => {
    const error: AuthError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      apiError: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: {
          otpCode: 'Enter a six-digit code.',
          newPassword: 'Password needs an uppercase letter.',
        },
      },
    };
    authService.verifyPasswordRecovery.and.returnValue(throwError(() => error));
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = 'verification-id';
    component.verificationForm.setValue({
      otpCode: '123',
      newPassword: 'password',
    });

    component.resetPassword();

    expect(component.otpServerError).toBe('Enter a six-digit code.');
    expect(component.passwordServerError).toBe('Password needs an uppercase letter.');
    expect(component.serverError).toBeNull();
  });

  it('should let the user request another code without revealing account status', () => {
    component.step = 'unavailable';
    component.verificationId = null;

    component.requestAgain();

    expect(component.step).toBe('request');
    expect(component.verificationId).toBeNull();
  });
});
