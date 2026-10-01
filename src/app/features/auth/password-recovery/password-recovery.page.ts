import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { finalize } from 'rxjs';

import { AuthError, AuthService } from 'src/app/core/auth/auth.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { AppPrimaryButtonComponent } from 'src/app/shared/ui/app-primary-button/app-primary-button.component';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  requiredPhoneValidator,
} from 'src/app/shared/phone/phone-number.util';

type RecoveryStep = 'request' | 'verify';

const GENERIC_RECOVERY_MESSAGE =
  'If an account exists for this phone number, we sent a verification code.';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    AppPrimaryButtonComponent,
  ],
  templateUrl: './password-recovery.page.html',
  styleUrls: ['./password-recovery.page.scss'],
})
export class PasswordRecoveryPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly appToastService = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly countries = createPhoneCountries();
  readonly genericRecoveryMessage = GENERIC_RECOVERY_MESSAGE;

  readonly phoneForm = this.fb.nonNullable.group(
    {
      phoneCountry: [getDefaultPhoneCountry()],
      phoneNational: [''],
    },
    { validators: [requiredPhoneValidator()] },
  );

  readonly verificationForm = this.fb.nonNullable.group({
    otpCode: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  step: RecoveryStep = 'request';
  isSubmitting = false;
  phoneNumber: string | null = null;
  verificationId: string | null = null;
  serverError: string | null = null;
  phoneServerError: string | null = null;
  otpServerError: string | null = null;
  passwordServerError: string | null = null;

  constructor() {
    this.phoneForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearErrors());
    this.verificationForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearErrors());
  }

  get phoneNational() {
    return this.phoneForm.controls.phoneNational;
  }

  get otpCode() {
    return this.verificationForm.controls.otpCode;
  }

  get newPassword() {
    return this.verificationForm.controls.newPassword;
  }

  isPhoneInvalid(): boolean {
    return (
      (this.phoneNational.touched || this.phoneNational.dirty) &&
      (this.phoneForm.hasError('requiredPhoneNumber') ||
        this.phoneForm.hasError('invalidPhoneNumber'))
    );
  }

  requestRecovery(): void {
    if (this.phoneForm.invalid || this.isSubmitting) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    const phoneNumber = getNormalizedPhoneNumber(
      this.phoneForm.controls.phoneCountry.value,
      this.phoneNational.value,
    );

    if (!phoneNumber) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.sendRecoveryRequest(phoneNumber);
  }

  resetPassword(): void {
    if (this.verificationForm.invalid || this.isSubmitting || !this.phoneNumber) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.clearErrors();

    // A null ID is deliberately indistinguishable in the UI. There is no valid
    // verification request to send, so fail with the same public recovery error.
    if (!this.verificationId) {
      this.serverError = 'We could not verify this code. Request a new one.';
      return;
    }

    this.isSubmitting = true;
    this.authService.verifyPasswordRecovery({
      phoneNumber: this.phoneNumber,
      verificationId: this.verificationId,
      otpCode: this.otpCode.value.trim(),
      newPassword: this.newPassword.value,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
      }),
    ).subscribe({
      next: () => {
        void this.appToastService.show(
          'Your password has been reset. Log in with your new password.',
          'success',
        );
        void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      },
      error: (error: AuthError) => this.handleVerificationError(error),
    });
  }

  requestAgain(): void {
    if (!this.phoneNumber || this.isSubmitting) {
      return;
    }

    this.clearErrors();
    this.verificationForm.reset();
    this.sendRecoveryRequest(this.phoneNumber);
  }

  useDifferentPhoneNumber(): void {
    if (this.isSubmitting) {
      return;
    }

    this.step = 'request';
    this.phoneNumber = null;
    this.verificationId = null;
    this.verificationForm.reset();
    this.clearErrors();
  }

  goToLogin(): void {
    void this.navController.navigateBack('/auth/login');
  }

  private sendRecoveryRequest(phoneNumber: string): void {
    this.clearErrors();
    this.isSubmitting = true;

    this.authService.requestPasswordRecovery({ phoneNumber }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
      }),
    ).subscribe({
      next: (response) => {
        this.phoneNumber = phoneNumber;
        this.verificationId = response.verificationId;
        this.step = 'verify';
      },
      error: (error: AuthError) => this.handleRequestError(error),
    });
  }

  private handleRequestError(error: AuthError): void {
    if (error.code !== 'VALIDATION_ERROR') {
      this.serverError = error.message;
      return;
    }

    this.phoneServerError = this.getValidationMessage(
      error.apiError?.details,
      ['phoneNumber', 'phone'],
    );
    if (!this.phoneServerError) {
      this.serverError = error.message;
    }
  }

  private handleVerificationError(error: AuthError): void {
    if (error.code !== 'VALIDATION_ERROR') {
      this.serverError = error.message;
      return;
    }

    this.otpServerError = this.getValidationMessage(
      error.apiError?.details,
      ['otpCode', 'otp', 'verificationCode'],
    );
    this.passwordServerError = this.getValidationMessage(
      error.apiError?.details,
      ['newPassword', 'password'],
    );

    if (!this.otpServerError && !this.passwordServerError) {
      this.serverError = error.message;
    }
  }

  private getValidationMessage(details: unknown, fieldNames: string[]): string | null {
    if (Array.isArray(details)) {
      for (const detail of details) {
        const match = this.getValidationMessage(detail, fieldNames);
        if (match) {
          return match;
        }
      }
      return null;
    }

    if (!details || typeof details !== 'object') {
      return null;
    }

    const record = details as Record<string, unknown>;
    const namedField = record['field'] ?? record['property'] ?? record['name'];
    if (typeof namedField === 'string' && fieldNames.includes(namedField)) {
      const message = record['message'] ?? record['detail'] ?? record['reason'];
      return typeof message === 'string' ? message : null;
    }

    for (const fieldName of fieldNames) {
      const value = record[fieldName];
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }

    for (const nestedKey of ['errors', 'fieldErrors', 'violations']) {
      const match = this.getValidationMessage(record[nestedKey], fieldNames);
      if (match) {
        return match;
      }
    }

    return null;
  }

  private clearErrors(): void {
    this.serverError = null;
    this.phoneServerError = null;
    this.otpServerError = null;
    this.passwordServerError = null;
  }
}
