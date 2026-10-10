import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { IonContent, IonicModule, NavController } from '@ionic/angular';
import {
  Component,
  DestroyRef,
  HostListener,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, AuthError } from 'src/app/core/auth/auth.service';
import { RegisterRequest } from 'src/app/core/models/register-request.model';
import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';

import { AppPrimaryButtonComponent } from '../../../shared/ui/app-primary-button/app-primary-button.component';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  requiredPhoneValidator,
  PhoneCountry,
} from 'src/app/shared/phone/phone-number.util';

function matchFieldsValidator(
  field: string,
  confirmField: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fieldControl = group.get(field);
    const confirmControl = group.get(confirmField);

    if (!fieldControl || !confirmControl) {
      return null;
    }

    const isMismatch = fieldControl.value !== confirmControl.value;

    if (!isMismatch) {
      const errors = confirmControl.errors;
      if (errors?.['mismatch']) {
        const { mismatch, ...rest } = errors;
        confirmControl.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    confirmControl.setErrors({
      ...(confirmControl.errors ?? {}),
      mismatch: true
    });

    return { mismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    AppPrimaryButtonComponent
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  @ViewChild(IonContent) private readonly content?: IonContent;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly authService = inject(AuthService);
  private readonly verificationState = inject(PhoneVerificationStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly countries: PhoneCountry[] = this.createCountries();

  isSubmitting = false;
  serverError: string | null = null;
  authFocusOffset = 0;

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      phoneCountry: [this.getDefaultPhoneCountry()],
      phoneNational: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    {
      validators: [
        matchFieldsValidator('password', 'confirmPassword'),
        requiredPhoneValidator()
      ]
    }
  );

  get name() {
    return this.form.controls.name;
  }

  get phoneCountry() {
    return this.form.controls.phoneCountry;
  }

  get phoneNational() {
    return this.form.controls.phoneNational;
  }

  get password() {
    return this.form.controls.password;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  get selectedCountryText(): string {
    const country = this.countries.find(
      item => item.code === this.phoneCountry.value
    );

    return country
      ? `${country.flag} ${country.dialCode}`
      : '';
  }

  isPhoneInvalid(): boolean {
    const hasInteraction =
      this.phoneNational.touched || this.phoneNational.dirty;

    return (
      hasInteraction &&
      (this.form.hasError('requiredPhoneNumber') ||
        this.form.hasError('invalidPhoneNumber') ||
        this.phoneNational.hasError('phoneNumberAlreadyExists'))
    );
  } 

  isInvalid(
    controlName: 'name' | 'password' | 'confirmPassword'
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  scrollFocusedControlIntoView(event: FocusEvent): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.authFocusOffset = this.getFocusOffset(target);

    window.setTimeout(() => {
      void this.scrollTargetIntoView(target);
    }, 300);

    window.setTimeout(() => {
      void this.scrollTargetIntoView(target);
    }, 650);
  }

  clearFocusedControlOffset(): void {
    window.setTimeout(() => {
      if (this.hasFocusedAuthControl()) {
        return;
      }

      this.authFocusOffset = 0;
    }, 120);
  }

  @HostListener('window:appKeyboardDidHide')
  resetKeyboardScrollState(): void {
    // iOS can report a keyboard hide while focus moves between fields
    // (e.g. password -> confirm password); keep the current scroll then.
    if (this.hasFocusedAuthControl()) {
      return;
    }

    this.authFocusOffset = 0;
    void this.content?.scrollToTop(220);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError = null;
    this.clearPhoneNumberAlreadyExistsError();

    const phoneNumber = getNormalizedPhoneNumber(
      this.phoneCountry.value,
      this.phoneNational.value,
    );

    const payload: RegisterRequest = {
      password: this.form.controls.password.value,
      displayName: this.form.controls.name.value.trim(),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      phoneNumber: phoneNumber!
    };

    this.isSubmitting = true;

    this.authService.register(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.verificationState.start('registration', phoneNumber!);
        void this.router.navigateByUrl('/auth/verify-phone', { replaceUrl: true });
      },
      error: (error: AuthError) => {
        if (error.code === 'PHONE_NUMBER_ALREADY_EXISTS') {
          this.phoneNational.setErrors({
            ...(this.phoneNational.errors ?? {}),
            phoneNumberAlreadyExists: true
          });
          return;
        }

        this.serverError = error.message;
      },
    });
  }

  private clearPhoneNumberAlreadyExistsError(): void {
    const errors = this.phoneNational.errors;
    
    if (!errors?.['phoneNumberAlreadyExists']) {
      return;
    }

    const { phoneNumberAlreadyExists, ...rest } = errors;
    this.phoneNational.setErrors(Object.keys(rest).length ? rest : null);
  }

  goToLogin(): void {
    void this.navController.navigateForward('/auth/login');
  }

  goBack(): void {
    void this.navController.navigateBack('/auth/onboarding');
  }

  private createCountries(): PhoneCountry[] {
    return createPhoneCountries();
  }

  private getDefaultPhoneCountry() {
    return getDefaultPhoneCountry();
  }

  /*
   * Brings the focused field to the top of the scroll area unless it already sits
   * in the upper part of it. This does not depend on the keyboard height: on iOS the
   * web view is resized above the keyboard (so subtracting the keyboard height again
   * hid the field), while on Android it is not. Pinning the field near the top also
   * keeps the next field (e.g. "Confirm password") visible above the keyboard.
   */
  private async scrollTargetIntoView(target: HTMLElement): Promise<void> {
    const field = target.closest<HTMLElement>('.auth-field') ?? target;

    if (!this.content) {
      field.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    const scrollElement = await this.content.getScrollElement();
    const fieldRect = field.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();
    const comfortableBottom = scrollRect.top + scrollRect.height * 0.45;

    if (fieldRect.top >= scrollRect.top && fieldRect.bottom <= comfortableBottom) {
      return;
    }

    const nextScrollTop =
      scrollElement.scrollTop + fieldRect.top - scrollRect.top - 16;

    await this.content.scrollToPoint(0, Math.max(0, nextScrollTop), 260);
  }

  private hasFocusedAuthControl(): boolean {
    const activeElement = document.activeElement;

    return (
      activeElement instanceof HTMLElement &&
      !!activeElement.closest('.auth-content')
    );
  }

  private getFocusOffset(target: HTMLElement): number {
    switch (target.id) {
      case 'register-phone':
        return 80;
      case 'register-password':
        return 235;
      case 'register-confirm-password':
        return 315;
      default:
        return 0;
    }
  }
}
