import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize, interval, switchMap } from 'rxjs';

import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import {
  PhoneVerificationError,
  PhoneVerificationService,
} from 'src/app/core/api/services/phone-verification.service';
import { AppPrimaryButtonComponent } from 'src/app/shared/ui/app-primary-button/app-primary-button.component';
import { AuthService } from 'src/app/core/auth/auth.service';
import { UserService } from 'src/app/core/api/services/user.service';
import { getApiErrorMessage } from 'src/app/core/api/api-error.util';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  requiredPhoneValidator,
  splitE164PhoneNumber,
} from 'src/app/shared/phone/phone-number.util';

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

@Component({
  selector: 'app-verify-phone',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    AppPrimaryButtonComponent,
  ],
  templateUrl: './verify-phone.page.html',
  styleUrls: ['./verify-phone.page.scss'],
})
export class VerifyPhonePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly verificationService = inject(PhoneVerificationService);
  private readonly verificationState = inject(PhoneVerificationStateService);
  private readonly appToastService = inject(AppToastService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    otpCode: ['', [Validators.required]],
  });

  readonly phoneForm = this.fb.nonNullable.group(
    {
      phoneCountry: [getDefaultPhoneCountry()],
      phoneNational: [''],
    },
    { validators: [requiredPhoneValidator()] },
  );
  readonly countries = createPhoneCountries();

  verificationId = this.verificationState.getPending()?.verificationId ?? null;
  cooldownSeconds = 0;
  isVerifying = false;
  isResending = false;
  isEditingPhone = false;
  isUpdatingPhone = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  constructor() {
    if (!this.verificationState.getPending()) {
      void this.router.navigateByUrl('/app/home', { replaceUrl: true });
      return;
    }

    this.updateCooldown();
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateCooldown());
  }

  get otpCode() {
    return this.form.controls.otpCode;
  }

  get canVerify(): boolean {
    return this.form.valid && !this.isVerifying;
  }

  get canResend(): boolean {
    return this.cooldownSeconds === 0 && !this.isResending;
  }

  get canChangePhone(): boolean {
    return this.verificationState.getPending()?.purpose === 'registration';
  }

  get phoneNational() {
    return this.phoneForm.controls.phoneNational;
  }

  get isPhoneInvalid(): boolean {
    return this.phoneNational.touched && this.phoneForm.invalid;
  }

  get resendLabel(): string {
    if (this.isResending) {
      return 'Sending...';
    }

    if (this.cooldownSeconds > 0) {
      const minutes = Math.floor(this.cooldownSeconds / 60);
      const seconds = this.cooldownSeconds % 60;
      return `Resend code in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return 'Resend code';
  }

  verify(): void {
    if (this.form.invalid || this.isVerifying) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.infoMessage = null;
    this.isVerifying = true;

    const payload = {
      otpCode: this.otpCode.value,
      ...(this.verificationId
        ? { verificationId: this.verificationId }
        : {}),
    };

    const purpose = this.verificationState.getPending()?.purpose ?? 'registration';
    const verificationRequest = purpose === 'phone-change'
      ? this.verificationService.verifyPhone(payload)
      : this.verificationService.verifyRegistrationPhone(payload);

    verificationRequest.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isVerifying = false;
      }),
    ).subscribe({
      next: (response) => {
        if (!response.verified) {
          this.showError('Invalid code. Please try again.');
          return;
        }

        this.completeVerification();
      },
      error: (error: PhoneVerificationError) => {
        if (this.handleAuthenticationError(error)) {
          return;
        }

        if (error.code === 'ALREADY_VERIFIED') {
          this.completeVerification();
          return;
        }

        this.showError(error.message);
      },
    });
  }

  resend(): void {
    if (!this.canResend) {
      return;
    }

    this.errorMessage = null;
    this.infoMessage = null;
    this.isResending = true;

    this.verificationService.resend().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isResending = false;
      }),
    ).subscribe({
      next: (response) => {
        this.verificationId = response.verificationId;
        this.verificationState.updateAfterResend(response.verificationId);
        this.form.reset();
        this.infoMessage = 'A new verification code has been sent.';
        this.updateCooldown();
      },
      error: (error: PhoneVerificationError) => {
        if (this.handleAuthenticationError(error)) {
          return;
        }

        this.showError(error.message);
      },
    });
  }

  editPhoneNumber(): void {
    if (!this.canChangePhone) {
      return;
    }

    const currentPhone = this.verificationState.getPending()?.phoneNumber;
    this.phoneForm.reset(splitE164PhoneNumber(currentPhone));
    this.errorMessage = null;
    this.infoMessage = null;
    this.isEditingPhone = true;
  }

  cancelPhoneEdit(): void {
    if (this.isUpdatingPhone) {
      return;
    }

    this.isEditingPhone = false;
    this.phoneForm.reset();
  }

  updatePhoneNumber(): void {
    if (this.phoneForm.invalid || this.isUpdatingPhone || !this.canChangePhone) {
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

    this.errorMessage = null;
    this.infoMessage = null;
    this.isUpdatingPhone = true;

    this.userService.getMe().pipe(
      switchMap((profile) => this.userService.updateMe({
        displayName: profile.displayName?.trim() ?? '',
        timezone: profile.timezone?.trim() ||
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        phoneNumber,
      })),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isUpdatingPhone = false;
      }),
    ).subscribe({
      next: () => {
        this.verificationState.start('registration', phoneNumber);
        this.verificationId = null;
        this.form.reset();
        this.isEditingPhone = false;
        this.infoMessage = 'Your phone number was updated. A new verification code has been sent.';
        this.updateCooldown();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(
          error,
          'We couldn’t update your phone number. Please try again.',
        );
      },
    });
  }

  private handleAuthenticationError(error: PhoneVerificationError): boolean {
    if (error.code !== 'AUTH_REQUIRED' && error.code !== 'USER_NOT_FOUND') {
      return false;
    }

    this.authService.logout();
    this.verificationState.clear();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    return true;
  }

  private showError(message: string): void {
    this.errorMessage = message;
  }

  private completeVerification(): void {
    const purpose = this.verificationState.getPending()?.purpose;
    this.verificationState.clear();

    if (purpose === 'phone-change') {
      void this.appToastService.show('Phone number verified and updated.', 'success');
      void this.router.navigateByUrl('/settings', { replaceUrl: true });
      return;
    }

    void this.router.navigateByUrl('/app/home', { replaceUrl: true });
  }

  private updateCooldown(): void {
    const pending = this.verificationState.getPending();
    const sentCooldownUntil = pending
      ? pending.lastSentAt + RESEND_COOLDOWN_MS
      : 0;
    this.cooldownSeconds = Math.max(
      0,
      Math.ceil((sentCooldownUntil - Date.now()) / 1000),
    );
  }
}
