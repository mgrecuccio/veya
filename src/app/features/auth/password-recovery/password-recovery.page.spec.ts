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

  function enterPhone(): void {
    component.phoneForm.patchValue({
      phoneCountry: 'BE',
      phoneNational: '0468 00 99 11',
    });
  }

  it('requests recovery with an E.164 phone number', () => {
    authService.requestPasswordRecovery.and.returnValue(
      of({ verificationId: 'verification-id' }),
    );
    enterPhone();

    component.requestRecovery();

    expect(authService.requestPasswordRecovery).toHaveBeenCalledOnceWith({
      phoneNumber: '+32468009911',
    });
    expect(component.step).toBe('verify');
    expect(component.verificationId).toBe('verification-id');
  });

  it('shows the verification form even when the phone number does not exist', () => {
    authService.requestPasswordRecovery.and.returnValue(of({ verificationId: null }));
    enterPhone();

    component.requestRecovery();
    fixture.detectChanges();

    expect(component.step).toBe('verify');
    expect(fixture.nativeElement.querySelector('#recovery-code')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#recovery-new-password')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'If an account exists for this phone number, we sent a verification code.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('not found');
  });

  it('clears a stale attempt error when the user edits the verification form', () => {
    component.serverError = 'Too many attempts. Try again later.';

    component.verificationForm.controls.otpCode.setValue('1');

    expect(component.serverError).toBeNull();
  });

  it('clears a stale attempt error before requesting another code', () => {
    component.phoneNumber = '+32468009911';
    component.serverError = 'Too many attempts. Try again later.';
    authService.requestPasswordRecovery.and.returnValue(
      of({ verificationId: 'new-verification-id' }),
    );

    component.requestAgain();

    expect(component.serverError).toBeNull();
    expect(authService.requestPasswordRecovery).toHaveBeenCalledOnceWith({
      phoneNumber: '+32468009911',
    });
    expect(component.verificationId).toBe('new-verification-id');
  });

  it('does not send an invalid verification request when no ID was returned', () => {
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = null;
    component.verificationForm.setValue({
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });

    component.resetPassword();

    expect(authService.verifyPasswordRecovery).not.toHaveBeenCalled();
    expect(component.serverError).toBe(
      'We could not verify this code. Request a new one.',
    );
  });

  it('submits all fields and returns to login after a successful reset', () => {
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = 'verification-id';
    component.verificationForm.setValue({
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });
    authService.verifyPasswordRecovery.and.returnValue(of(void 0));

    component.resetPassword();

    expect(authService.verifyPasswordRecovery).toHaveBeenCalledOnceWith({
      phoneNumber: '+32468009911',
      verificationId: 'verification-id',
      otpCode: '123456',
      newPassword: 'newStrongPassword',
    });
    expect(appToastService.show).toHaveBeenCalledOnceWith(
      'Your password has been reset. Log in with your new password.',
      'success',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login', { replaceUrl: true });
  });

  it('shows the specified verification error message', () => {
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

  it('displays field-level backend validation messages', () => {
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

  it('returns to phone entry when choosing a different number', () => {
    component.step = 'verify';
    component.phoneNumber = '+32468009911';
    component.verificationId = 'verification-id';

    component.useDifferentPhoneNumber();

    expect(component.step).toBe('request');
    expect(component.phoneNumber).toBeNull();
    expect(component.verificationId).toBeNull();
  });
});
