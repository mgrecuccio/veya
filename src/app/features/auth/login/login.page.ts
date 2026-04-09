import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AppPrimaryButtonComponent } from '../../../shared/ui/app-primary-button/app-primary-button.component';
import { LoginRequest } from 'src/app/core/models/login-request.model';
import { AuthError, AuthService } from 'src/app/core/auth/auth.service';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    RouterModule,
    AppPrimaryButtonComponent
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  isSubmitting = false;
  serverError: string | null = null;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError = null;
    this.clearInvalidCredentialsError();

    const payload: LoginRequest = {
      email: this.form.controls.email.value?.trim() ?? '',
      password: this.form.controls.password.value ?? '',
    };

    this.isSubmitting = true;
    this.authService.login(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl('/app/home', { replaceUrl: true });
      },
      error: (error: AuthError) => {
        if (error.code === 'INVALID_CREDENTIALS') {
          this.form.setErrors({
            ...(this.form.errors ?? {}),
            invalidCredentials: true
          });
          return;
        }

        this.serverError = error.message;
      },
    });
  }

  forgotPassword(): void {
    console.log('Forgot password tapped');
  }

  private clearInvalidCredentialsError(): void {
    const errors = this.form.errors;
    if (!errors?.['invalidCredentials']) {
      return;
    }

    const { invalidCredentials, ...rest } = errors;
    this.form.setErrors(Object.keys(rest).length ? rest : null);
  }
}