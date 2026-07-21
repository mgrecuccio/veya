import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  ViewChild,
  inject
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonicModule, NavController } from '@ionic/angular';

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
    AppPrimaryButtonComponent
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  @ViewChild(IonContent) private readonly content?: IonContent;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  isSubmitting = false;
  serverError: string | null = null;
  authFocusOffset = 0;

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
      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        activeElement.closest('.auth-content')
      ) {
        return;
      }

      this.authFocusOffset = 0;
    }, 120);
  }

  @HostListener('window:appKeyboardDidHide')
  resetKeyboardScrollState(): void {
    this.authFocusOffset = 0;
    void this.content?.scrollToTop(220);
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

  goToRegister(): void {
    void this.navController.navigateForward('/auth/register');
  }

  goBack(): void {
    void this.navController.navigateBack('/auth/onboarding');
  }

  private clearInvalidCredentialsError(): void {
    const errors = this.form.errors;
    if (!errors?.['invalidCredentials']) {
      return;
    }

    const { invalidCredentials, ...rest } = errors;
    this.form.setErrors(Object.keys(rest).length ? rest : null);
  }

  private async scrollTargetIntoView(target: HTMLElement): Promise<void> {
    if (!this.content) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const scrollElement = await this.content.getScrollElement();
    const targetRect = target.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();
    const keyboardHeight = this.getKeyboardHeight();
    const visualViewport = window.visualViewport;
    const viewportBottom = visualViewport
      ? visualViewport.offsetTop + visualViewport.height
      : window.innerHeight;
    const visibleBottom = Math.min(
      viewportBottom,
      window.innerHeight - keyboardHeight
    ) - 28;
    const visibleTop = Math.max(scrollRect.top, 28);
    let nextScrollTop = scrollElement.scrollTop;

    if (targetRect.bottom > visibleBottom) {
      nextScrollTop += targetRect.bottom - visibleBottom;
    } else if (targetRect.top < visibleTop) {
      nextScrollTop -= visibleTop - targetRect.top;
    } else {
      return;
    }

    await this.content.scrollToPoint(0, Math.max(0, nextScrollTop), 260);
  }

  private getKeyboardHeight(): number {
    const rawHeight = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-keyboard-height');

    return Number.parseFloat(rawHeight) || 360;
  }

  private getFocusOffset(target: HTMLElement): number {
    if (target.id === 'login-password') {
      return 150;
    }

    return 0;
  }
}
