import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize, interval } from 'rxjs';

import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import {
  PhoneVerificationError,
  PhoneVerificationService,
} from 'src/app/core/api/services/phone-verification.service';
import { AppPrimaryButtonComponent } from 'src/app/shared/ui/app-primary-button/app-primary-button.component';
import { AuthService } from 'src/app/core/auth/auth.service';

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;
const RATE_LIMIT_FALLBACK_MS = 60 * 1000;

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
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  verificationId = this.verificationState.getPending()?.verificationId ?? null;
  cooldownSeconds = 0;
  isVerifying = false;
  isResending = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  private rateLimitedUntil = 0;

  constructor() {
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

    this.verificationService.verify(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isVerifying = false;
      }),
    ).subscribe({
      next: (response) => {
        if (!response.verified) {
          this.errorMessage = 'Invalid code. Please try again.';
          return;
        }

        const purpose = this.verificationState.getPending()?.purpose;
        this.verificationState.clear();

        if (purpose === 'phone-change') {
          void this.appToastService.show('Phone number verified and updated.', 'success');
          void this.router.navigateByUrl('/settings', { replaceUrl: true });
          return;
        }

        void this.router.navigateByUrl('/app/home', { replaceUrl: true });
      },
      error: (error: PhoneVerificationError) => {
        if (this.handleAuthenticationError(error)) {
          return;
        }

        this.errorMessage = error.message;
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

        if (error.code === 'RATE_LIMITED') {
          this.rateLimitedUntil = Date.now() + RATE_LIMIT_FALLBACK_MS;
          this.updateCooldown();
        }

        this.errorMessage = error.message;
      },
    });
  }

  private handleAuthenticationError(error: PhoneVerificationError): boolean {
    if (error.code !== 'AUTH_REQUIRED') {
      return false;
    }

    this.authService.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    return true;
  }

  private updateCooldown(): void {
    const pending = this.verificationState.getPending();
    const sentCooldownUntil = pending
      ? pending.lastSentAt + RESEND_COOLDOWN_MS
      : 0;
    const cooldownUntil = Math.max(sentCooldownUntil, this.rateLimitedUntil);
    this.cooldownSeconds = Math.max(
      0,
      Math.ceil((cooldownUntil - Date.now()) / 1000),
    );
  }
}
