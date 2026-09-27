import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import {
  PhoneVerificationError,
  PhoneVerificationService,
} from 'src/app/core/api/services/phone-verification.service';
import { VerifyPhonePage } from './verify-phone.page';
import { AuthService } from 'src/app/core/auth/auth.service';

describe('VerifyPhonePage', () => {
  let fixture: ComponentFixture<VerifyPhonePage>;
  let component: VerifyPhonePage;
  let verificationService: jasmine.SpyObj<PhoneVerificationService>;
  let verificationState: jasmine.SpyObj<PhoneVerificationStateService>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let appToastService: jasmine.SpyObj<AppToastService>;

  beforeEach(async () => {
    verificationService = jasmine.createSpyObj<PhoneVerificationService>(
      'PhoneVerificationService',
      ['verify', 'resend'],
    );
    verificationState = jasmine.createSpyObj<PhoneVerificationStateService>(
      'PhoneVerificationStateService',
      ['getPending', 'updateAfterResend', 'clear'],
    );
    verificationState.getPending.and.returnValue({
      verificationId: null,
      lastSentAt: 0,
      purpose: 'registration',
    });
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [VerifyPhonePage],
      providers: [
        { provide: PhoneVerificationService, useValue: verificationService },
        { provide: PhoneVerificationStateService, useValue: verificationState },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        {
          provide: AppToastService,
          useValue: jasmine.createSpyObj<AppToastService>('AppToastService', ['show']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyPhonePage);
    component = fixture.componentInstance;
    appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
    appToastService.show.and.returnValue(Promise.resolve());
    fixture.detectChanges();
  });

  it('submits only the code when no resend occurred', () => {
    verificationService.verify.and.returnValue(
      of({ userId: 42, verified: true }),
    );
    component.otpCode.setValue('123456');

    component.verify();

    expect(verificationService.verify).toHaveBeenCalledOnceWith({
      otpCode: '123456',
    });
    expect(verificationState.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', {
      replaceUrl: true,
    });
  });

  it('returns to settings and confirms a phone change after successful verification', () => {
    verificationState.getPending.and.returnValue({
      verificationId: null,
      lastSentAt: 0,
      purpose: 'phone-change',
    });
    verificationService.verify.and.returnValue(
      of({ userId: 42, verified: true }),
    );
    component.otpCode.setValue('123456');

    component.verify();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledOnceWith(
      'Phone number verified and updated.',
      'success',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings', {
      replaceUrl: true,
    });
  });

  it('includes the stored verification id after resend', () => {
    component.verificationId = 'verification-id';
    verificationService.verify.and.returnValue(
      of({ userId: 42, verified: true }),
    );
    component.otpCode.setValue('123456');

    component.verify();

    expect(verificationService.verify).toHaveBeenCalledOnceWith({
      otpCode: '123456',
      verificationId: 'verification-id',
    });
  });

  it('returns registration to home after a verification error', () => {
    const error: PhoneVerificationError = {
      code: 'INVALID_CODE',
      backendCode: 'INVALID_VERIFICATION_CODE',
      message: 'Invalid code. Please try again.',
    };
    verificationService.verify.and.returnValue(throwError(() => error));
    component.otpCode.setValue('000000');

    component.verify();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledWith(
      'Invalid code. Please try again.',
      'danger',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', {
      replaceUrl: true,
    });
  });

  it('returns a failed phone-change verification to settings', () => {
    verificationState.getPending.and.returnValue({
      verificationId: null,
      lastSentAt: 0,
      purpose: 'phone-change',
    });
    const error: PhoneVerificationError = {
      code: 'EXPIRED_OR_MISSING',
      backendCode: 'EXPIRED_VERIFICATION',
      message: 'Code expired. Request a new one.',
    };
    verificationService.verify.and.returnValue(throwError(() => error));
    component.otpCode.setValue('123456');

    component.verify();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledWith(
      'Code expired. Request a new one.',
      'danger',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings', {
      replaceUrl: true,
    });
  });

  it('returns home when verification completes without verifying the code', () => {
    verificationService.verify.and.returnValue(
      of({ userId: 42, verified: false }),
    );
    component.otpCode.setValue('000000');

    component.verify();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledWith(
      'Invalid code. Please try again.',
      'danger',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', {
      replaceUrl: true,
    });
  });

  it('completes registration when the backend reports already verified', () => {
    const error: PhoneVerificationError = {
      code: 'ALREADY_VERIFIED',
      backendCode: 'ALREADY_VERIFIED',
      message: 'Phone number is already verified.',
    };
    verificationService.verify.and.returnValue(throwError(() => error));
    component.otpCode.setValue('123456');

    component.verify();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', {
      replaceUrl: true,
    });
  });

  it('accepts any non-empty OTP allowed by the API schema', () => {
    verificationService.verify.and.returnValue(
      of({ userId: 42, verified: true }),
    );
    component.otpCode.setValue('A-1234');

    component.verify();

    expect(verificationService.verify).toHaveBeenCalledOnceWith({
      otpCode: 'A-1234',
    });
  });

  it('logs out and returns to login after an authentication error', () => {
    const error: PhoneVerificationError = {
      code: 'AUTH_REQUIRED',
      message: 'Your session has expired. Please log in again.',
    };
    verificationService.verify.and.returnValue(throwError(() => error));
    component.otpCode.setValue('123456');

    component.verify();

    expect(authService.logout).toHaveBeenCalled();
    expect(verificationState.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login', {
      replaceUrl: true,
    });
  });

  it('logs out when the authenticated user no longer exists', () => {
    const error: PhoneVerificationError = {
      code: 'USER_NOT_FOUND',
      backendCode: 'USER_NOT_FOUND',
      message: 'Your account could not be found. Please log in again.',
    };
    verificationService.verify.and.returnValue(throwError(() => error));
    component.otpCode.setValue('123456');

    component.verify();

    expect(authService.logout).toHaveBeenCalled();
    expect(verificationState.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login', {
      replaceUrl: true,
    });
  });

  it('stores the new verification id and restarts cooldown after resend', () => {
    verificationState.updateAfterResend.and.callFake((verificationId) => {
      verificationState.getPending.and.returnValue({
        verificationId,
        lastSentAt: Date.now(),
        purpose: 'registration',
      });
    });
    verificationService.resend.and.returnValue(
      of({ verificationId: 'new-verification-id' }),
    );

    component.resend();

    expect(verificationService.resend).toHaveBeenCalledOnceWith();
    expect(verificationState.updateAfterResend).toHaveBeenCalledWith(
      'new-verification-id',
    );
    expect(component.verificationId).toBe('new-verification-id');
    expect(component.infoMessage).toBe('A new verification code has been sent.');
    expect(component.cooldownSeconds).toBeGreaterThan(0);
  });

  it('returns registration to home after a resend error', () => {
    const error: PhoneVerificationError = {
      code: 'RATE_LIMITED',
      message: 'Please wait a few minutes before requesting another code.',
    };
    verificationService.resend.and.returnValue(throwError(() => error));

    component.resend();

    expect(verificationState.clear).toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledWith(error.message, 'danger');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', {
      replaceUrl: true,
    });
  });
});
