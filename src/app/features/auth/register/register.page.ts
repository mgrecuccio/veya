import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, AuthError } from 'src/app/core/auth/auth.service';
import { RegisterRequest } from 'src/app/core/models/register-request.model';

import { AppPrimaryButtonComponent } from '../../../shared/ui/app-primary-button/app-primary-button.component';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  optionalPhoneValidator,
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
    RouterModule,
    AppPrimaryButtonComponent
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly countries: PhoneCountry[] = this.createCountries();

  isSubmitting = false;
  serverError: string | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneCountry: [this.getDefaultPhoneCountry()],
      phoneNational: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    {
      validators: [
        matchFieldsValidator('password', 'confirmPassword'),
        optionalPhoneValidator()
      ]
    }
  );

  get name() {
    return this.form.controls.name;
  }

  get email() {
    return this.form.controls.email;
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
      this.form.hasError('invalidPhoneNumber')
    );
  } 

  isInvalid(
    controlName: 'name' | 'email' | 'password' | 'confirmPassword'
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError = null;
    this.clearEmailAlreadyExistsError();

    const phoneNumber = getNormalizedPhoneNumber(
      this.phoneCountry.value,
      this.phoneNational.value,
    );

    const payload: RegisterRequest = {
      email: this.form.controls.email.value.trim(),
      password: this.form.controls.password.value,
      displayName: this.form.controls.name.value.trim(),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      ...(phoneNumber ? { phoneNumber } : {})
    };

    this.isSubmitting = true;

    this.authService.register(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl('/app/home', { replaceUrl: true });
      },
      error: (error: AuthError) => {
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          this.form.controls.email.setErrors({
            ...(this.form.controls.email.errors ?? {}),
            emailAlreadyExists: true
          });
          return;
        }

        this.serverError = error.message;
      },
    });
  }

  private clearEmailAlreadyExistsError(): void {
    const errors = this.form.controls.email.errors;
    
    if (!errors?.['emailAlreadyExists']) {
      return;
    }

    const { emailAlreadyExists, ...rest } = errors;
    this.form.controls.email.setErrors(Object.keys(rest).length ? rest : null);
  }

  private createCountries(): PhoneCountry[] {
    return createPhoneCountries();
  }

  private getDefaultPhoneCountry() {
    return getDefaultPhoneCountry();
  }
}
