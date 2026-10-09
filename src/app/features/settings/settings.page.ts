import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { catchError, map, merge, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { SettingsPageData, SettingsPageDataService } from './data/settings-page-data.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { authenticatedSessionReload } from 'src/app/core/auth/authenticated-session-reload.util';
import {
  extractApiError,
  getApiErrorMessage,
  UserFacingApiError,
} from 'src/app/core/api/api-error.util';
import { PushRegistrationReconciliationService } from 'src/app/core/notifications/push-registration-reconciliation.service';
import { AppToastColor, AppToastService } from 'src/app/shared/toast/app-toast.service';
import { NativeNotificationSettingsService } from 'src/app/core/platform/native-notification-settings.service';
import { APP_VERSION } from 'src/environments/app-version';
import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';
import { PhoneChangeCooldownService } from 'src/app/core/auth/phone-change-cooldown.service';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  requiredPhoneValidator,
  PhoneCountry,
  splitE164PhoneNumber,
} from 'src/app/shared/phone/phone-number.util';
import { I18nService, SupportedLanguage } from 'src/app/core/i18n/i18n.service';

type SettingsPageVmState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; data: SettingsPageVm };

interface SettingsPageVm {
  userProfile: UserPrivateProfileCardVm;
  userPreferences: UserMatchingPreferencesCardVm;
}

interface UserPrivateProfileCardVm {
    id: number;
    displayName?: string | null;
    timezone?: string | null;
    phoneNumber: string;
    status: string;
}

interface UserMatchingPreferencesCardVm {
    userId: number;
    timezone: string;
    allowChat: boolean;
    allowCall: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    pushNotificationsEnabled: boolean;
    suggestionNotificationsEnabled: boolean;
}

interface TimezoneOption {
  value: string;
  label: string;
}

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

const PHONE_CHANGE_RATE_LIMIT_MESSAGE =
  'You can change your phone number once per day. Please try again later.';

function matchingPasswordsValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirmation = group.get('confirmPassword')?.value;

  return password === confirmation ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule],
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
    private readonly fb = inject(FormBuilder).nonNullable;
    private readonly settingsPageDataService = inject(SettingsPageDataService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly appToastService = inject(AppToastService);
    private readonly alertController = inject(AlertController);
    private readonly notificationSettings = inject(NativeNotificationSettingsService);
    private readonly pushRegistration = inject(PushRegistrationReconciliationService);
    private readonly phoneVerificationState = inject(PhoneVerificationStateService);
    private readonly phoneChangeCooldown = inject(PhoneChangeCooldownService);
    readonly i18n = inject(I18nService);
    private readonly reload$ = new Subject<void>();
    private savedPhoneNumber: string | null = null;
    private profileUserId: number | null = null;
    private savedProfileForLanguage: {
      displayName: string;
      timezone: string;
      phoneNumber: string;
    } | null = null;

    readonly countries: PhoneCountry[] = createPhoneCountries();
    readonly timezoneOptions = TIMEZONE_OPTIONS;
    readonly appVersion = APP_VERSION;
    readonly languageOptions = this.i18n.options;
    readonly isSavingProfile = signal(false);
    readonly isSavingPreferences = signal(false);
    readonly isLoggingOut = signal(false);
    readonly isDeletingAccount = signal(false);
    readonly isDeleteAccountModalOpen = signal(false);
    readonly isChangingPassword = signal(false);
    readonly isSavingLanguage = signal(false);
    readonly isPasswordModalOpen = signal(false);
    readonly visiblePasswordFields = signal<ReadonlySet<PasswordField>>(new Set());
    readonly isPhoneChangeLocked = signal(false);
    readonly phoneChangeMessage = signal<string | null>(null);
    profileError: string | null = null;
    preferencesError: string | null = null;
    passwordError: string | null = null;

    readonly profileForm = this.fb.group(
      {
        displayName: ['', [Validators.required, Validators.pattern(/\S/)]],
        timezone: ['', [Validators.required]],
        phoneCountry: [getDefaultPhoneCountry()],
        phoneNational: [''],
      },
      {
        validators: [requiredPhoneValidator()],
      },
    );

    readonly toastState = signal<{
      isOpen: boolean;
      message: string;
      color: AppToastColor;
    }>({
      isOpen: false,
      message: '',
      color: 'success',
    });

    readonly preferencesForm = this.fb.group({
        allowChat: [false],
        allowCall: [false],
        quietHoursStart: [''],
        quietHoursEnd: [''],
        pushNotificationsEnabled: [false],
        suggestionNotificationsEnabled: [false],
    });

    readonly passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [matchingPasswordsValidator] },
    );

    readonly vmState$: Observable<SettingsPageVmState> = merge(
      this.reload$,
      authenticatedSessionReload(this.authService.authState$),
    ).pipe(
      switchMap(() =>
        this.settingsPageDataService.getPageData().pipe(
          tap((data) => {
            this.patchForms(data);
          }),
          map((data): SettingsPageVmState => ({
            kind: 'success',
            data: this.mapToVm(data),
          })),
          startWith<SettingsPageVmState>({ kind: 'loading' }),
          catchError((error: Error) =>
            of<SettingsPageVmState>({
              kind: 'error',
              message:
                error.message ||
                'We couldn’t load your settings right now. Please try again.',
            }),
          ),
        ),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    retry(): void {
      this.reload$.next();
    }

    get phoneCountry() {
      return this.profileForm.controls.phoneCountry;
    }

    get phoneNational() {
      return this.profileForm.controls.phoneNational;
    }

    get selectedCountryText(): string {
      const country = this.countries.find(
        item => item.code === this.phoneCountry.value
      );

      return country
        ? `${country.flag} ${country.dialCode}`
        : '';
    }

    getCompactCountryLabel(country: PhoneCountry): string {
      return `${country.flag} ${country.dialCode}`;
    }

    isPhoneInvalid(): boolean {
      const hasInteraction =
        this.phoneNational.touched || this.phoneNational.dirty;

      return (
        hasInteraction &&
        (this.profileForm.hasError('requiredPhoneNumber') ||
          this.profileForm.hasError('invalidPhoneNumber'))
      );
    }

    isRequiredProfileFieldInvalid(
      controlName: 'displayName' | 'timezone',
    ): boolean {
      const control = this.profileForm.controls[controlName];
      return control.invalid && (control.touched || control.dirty);
    }

    async saveProfile(): Promise<void> {
      if(this.profileForm.invalid || this.isSavingProfile()) {
        this.profileForm.markAllAsTouched();
        return;
      }

      const raw = this.profileForm.getRawValue();
      const phoneNumber = getNormalizedPhoneNumber(
        raw.phoneCountry,
        raw.phoneNational,
      );
      const phoneNumberChanged = this.hasPhoneNumberChanged(phoneNumber!);

      if (phoneNumberChanged && this.isPhoneChangeLocked()) {
        this.phoneChangeMessage.set(PHONE_CHANGE_RATE_LIMIT_MESSAGE);
        this.showToast(PHONE_CHANGE_RATE_LIMIT_MESSAGE, 'danger');
        this.restoreSavedPhoneNumber();
        return;
      }

      this.phoneChangeMessage.set(null);
      this.isSavingProfile.set(true);

      this.settingsPageDataService.saveProfile({
          displayName: raw.displayName.trim(),
          timezone: raw.timezone.trim(),
          phoneNumber: phoneNumber!,
      }).subscribe({
        next: (profile) => {
          this.isSavingProfile.set(false);

          if (phoneNumberChanged) {
            this.savedPhoneNumber = profile.phoneNumber;
            this.lockPhoneNumberEditing(profile.id);
            this.phoneVerificationState.start('phone-change');
            void this.router.navigateByUrl('/auth/verify-phone', { replaceUrl: true });
            return;
          }

          this.savedPhoneNumber = profile.phoneNumber;
          this.retry();
          this.showToast('Profile saved.', 'success');
        },
        error: (error: unknown) => {
          this.isSavingProfile.set(false);

          if (phoneNumberChanged && this.isPhoneChangeRateLimit(error)) {
            this.phoneChangeMessage.set(PHONE_CHANGE_RATE_LIMIT_MESSAGE);
            this.restoreSavedPhoneNumber();
            this.showToast(PHONE_CHANGE_RATE_LIMIT_MESSAGE, 'danger');
            return;
          }

          this.showToast(
            getApiErrorMessage(error, 'We couldn’t save your profile right now.'),
            'danger',
          );
        }
      });
    }

    onLanguageChange(event: Event): void {
      const language = (event.target as HTMLSelectElement).value;
      if (!this.i18n.isSupportedLanguage(language)) {
        return;
      }

      this.i18n.setLanguage(language);
      this.saveLanguage(language);
    }

    async onPushNotificationsToggle(): Promise<void> {
      if (!this.preferencesForm.controls.pushNotificationsEnabled.value) {
        return;
      }

      try {
        const permission = await this.pushRegistration.requestPermission();

        if (permission === 'denied') {
          await this.showNotificationSettingsPrompt();
        }
      } catch (error) {
        console.warn('[SettingsPage] Notification permission request failed', {
          stage: 'permission-request',
          status: 'error',
          error,
        });
      }
    }

    async savePreferences(): Promise<void> {
      if(this.preferencesForm.invalid || this.isSavingPreferences()) {
        this.preferencesForm.markAllAsTouched();
        return;
      }

      this.isSavingPreferences.set(true);
      const raw = this.preferencesForm.getRawValue();

      this.settingsPageDataService.savePreferences({
          allowChat: raw.allowChat,
          allowCall: raw.allowCall,
          quietHoursStart: this.toBackendTimeOrNull(raw.quietHoursStart),
          quietHoursEnd: this.toBackendTimeOrNull(raw.quietHoursEnd),
          pushNotificationsEnabled: raw.pushNotificationsEnabled,
          suggestionNotificationsEnabled: raw.suggestionNotificationsEnabled
      }).subscribe({
        next: (preferences) => {
          this.isSavingPreferences.set(false);
          void this.reconcilePushNotifications(preferences.pushNotificationsEnabled);
          this.retry();
          this.showToast('Preferences saved.', 'success');
        },
        error: (error: any) => {
          this.isSavingPreferences.set(false);
          this.showToast(
            getApiErrorMessage(error, 'We couldn’t save your preferences right now.'),
            'danger',
          );
        }
      });
    }

    changePassword(): void {
      if (this.passwordForm.invalid || this.isChangingPassword()) {
        this.passwordForm.markAllAsTouched();
        return;
      }

      this.passwordError = null;
      this.isChangingPassword.set(true);
      const { currentPassword, newPassword } = this.passwordForm.getRawValue();

      this.authService.changePassword({ currentPassword, newPassword }).subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.closePasswordModal();
          void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        },
        error: (error: unknown) => {
          this.isChangingPassword.set(false);
          this.passwordError =
            error && typeof error === 'object' && 'message' in error &&
            typeof error.message === 'string'
              ? error.message
              : getApiErrorMessage(
                  error,
                  'We couldn’t change your password right now.',
                );
        },
      });
    }

    openPasswordModal(): void {
      if (this.isPasswordModalOpen()) {
        return;
      }

      this.resetPasswordForm();
      this.isPasswordModalOpen.set(true);
    }

    closePasswordModal(): void {
      if (this.isChangingPassword()) {
        return;
      }

      this.isPasswordModalOpen.set(false);
      this.resetPasswordForm();
    }

    isPasswordFieldInvalid(
      controlName: PasswordField,
    ): boolean {
      const control = this.passwordForm.controls[controlName];
      return control.invalid && (control.touched || control.dirty);
    }

    isPasswordVisible(field: PasswordField): boolean {
      return this.visiblePasswordFields().has(field);
    }

    togglePasswordVisibility(field: PasswordField): void {
      this.visiblePasswordFields.update((visibleFields) => {
        const updatedFields = new Set(visibleFields);

        if (updatedFields.has(field)) {
          updatedFields.delete(field);
        } else {
          updatedFields.add(field);
        }

        return updatedFields;
      });
    }

    private resetPasswordForm(): void {
      this.passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      this.passwordError = null;
      this.visiblePasswordFields.set(new Set());
    }

    logout(): void {
      if (this.isLoggingOut()) {
        return;
      }

      this.isLoggingOut.set(true);
      void this.pushRegistration.disableCurrentDevice().finally(() => {
        this.authService.logoutAndRevoke().subscribe({
          next: () => {
            this.router.navigateByUrl('/auth/login', { replaceUrl: true });
          },
          error: () => {
            this.router.navigateByUrl('/auth/login', { replaceUrl: true });
          },
        });
      });
    }

    openDeleteAccountModal(): void {
      if (this.isDeletingAccount()) {
        return;
      }

      this.isDeleteAccountModalOpen.set(true);
    }

    closeDeleteAccountModal(): void {
      if (this.isDeletingAccount()) {
        return;
      }

      this.isDeleteAccountModalOpen.set(false);
    }

    deleteAccount(): void {
      if (this.isDeletingAccount()) {
        return;
      }

      this.isDeletingAccount.set(true);
      this.authService.deleteAccount().subscribe({
        next: () => {
          void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        },
        error: (error: unknown) => {
          this.isDeletingAccount.set(false);
          this.showToast(
            getApiErrorMessage(
              error,
              'We couldn’t delete your account right now. Please try again.',
            ),
            'danger',
          );
        },
      });
    }

    goBack(): void {
      void this.router.navigateByUrl('/app/home');
    }

    onToastDismiss(): void {
      this.toastState.update((state) => ({
        ...state,
        isOpen: false,
      }));
    }

    private showToast(message: string, color: AppToastColor): void {
      this.toastState.set({
        isOpen: true,
        message,
        color,
      });

      void this.appToastService.show(message, color, 'app-toast settings-page-toast');
    }

    private toBackendTimeOrNull(value: string | null | undefined): string | null {
      const normalized = value?.trim() ?? '';

      if (!normalized) {
        return null;
      }

      if (/^\d{2}:\d{2}$/.test(normalized)) {
        return `${normalized}:00`;
      }

      return normalized;
    }

    private mapToVm(data: SettingsPageData): SettingsPageVm {
      return {
        userProfile: data.userProfile,
        userPreferences: data.userPreferences,
      };
    }

    private patchForms(data: SettingsPageData): void {
      const phone = splitE164PhoneNumber(data.userProfile.phoneNumber);
      this.savedPhoneNumber = data.userProfile.phoneNumber;
      this.profileUserId = data.userProfile.id;
      this.savedProfileForLanguage = {
        displayName: data.userProfile.displayName?.trim() ?? '',
        timezone: data.userProfile.timezone ?? data.userPreferences.timezone ?? '',
        phoneNumber: data.userProfile.phoneNumber,
      };

      if (this.i18n.isSupportedLanguage(data.userProfile.preferredLanguage)) {
        this.i18n.setLanguage(data.userProfile.preferredLanguage);
      }

      this.profileForm.patchValue({
        displayName: data.userProfile.displayName ?? '',
        timezone: data.userProfile.timezone ?? data.userPreferences.timezone ?? '',
        phoneCountry: phone.phoneCountry,
        phoneNational: phone.phoneNational,
      });

      this.preferencesForm.patchValue({
        allowChat: data.userPreferences.allowChat,
        allowCall: data.userPreferences.allowCall,
        quietHoursStart: data.userPreferences.quietHoursStart ?? '',
        quietHoursEnd: data.userPreferences.quietHoursEnd ?? '',
        pushNotificationsEnabled: data.userPreferences.pushNotificationsEnabled,
        suggestionNotificationsEnabled: data.userPreferences.suggestionNotificationsEnabled,
      });
      this.profileForm.markAsPristine();
      this.preferencesForm.markAsPristine();
      this.applyStoredPhoneChangeLock();
    }

    private saveLanguage(language: SupportedLanguage): void {
      if (!this.savedProfileForLanguage || this.isSavingLanguage()) {
        return;
      }

      this.isSavingLanguage.set(true);
      this.settingsPageDataService.saveProfile({
        ...this.savedProfileForLanguage,
        preferredLanguage: language,
      }).subscribe({
        next: (profile) => {
          this.isSavingLanguage.set(false);
          this.savedProfileForLanguage = {
            displayName: profile.displayName?.trim() ?? this.savedProfileForLanguage?.displayName ?? '',
            timezone: profile.timezone ?? this.savedProfileForLanguage?.timezone ?? '',
            phoneNumber: profile.phoneNumber,
          };
          this.showToast('Language saved.', 'success');
        },
        error: () => {
          this.isSavingLanguage.set(false);
          this.showToast('We couldn’t save your language right now.', 'danger');
        },
      });
    }

    private hasPhoneNumberChanged(phoneNumber: string): boolean {
      if (this.savedPhoneNumber === null) {
        return false;
      }

      const savedPhone = splitE164PhoneNumber(this.savedPhoneNumber);
      const normalizedSavedPhone = getNormalizedPhoneNumber(
        savedPhone.phoneCountry,
        savedPhone.phoneNational,
      );

      return phoneNumber !== (normalizedSavedPhone ?? this.savedPhoneNumber.trim());
    }

    private isPhoneChangeRateLimit(error: unknown): boolean {
      const extractedError = extractApiError(error);
      const userFacingError = error as Partial<UserFacingApiError> | null;
      const apiError = extractedError ?? userFacingError?.apiError;

      return apiError?.status === 429 && apiError.code === 'TOO_MANY_ATTEMPTS';
    }

    private applyStoredPhoneChangeLock(): void {
      const locked = this.profileUserId !== null &&
        this.phoneChangeCooldown.getLockedUntil(this.profileUserId) !== null;

      this.setPhoneNumberEditingLocked(locked);
      this.phoneChangeMessage.set(locked ? PHONE_CHANGE_RATE_LIMIT_MESSAGE : null);
    }

    private lockPhoneNumberEditing(userId: number): void {
      this.phoneChangeCooldown.lock(userId);
      this.setPhoneNumberEditingLocked(true);
      this.phoneChangeMessage.set(PHONE_CHANGE_RATE_LIMIT_MESSAGE);
    }

    private setPhoneNumberEditingLocked(locked: boolean): void {
      this.isPhoneChangeLocked.set(locked);
      const controls = [this.phoneCountry, this.phoneNational];

      controls.forEach((control) => {
        if (locked) {
          control.disable({ emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
        }
      });
    }

    private restoreSavedPhoneNumber(): void {
      if (this.savedPhoneNumber === null) {
        return;
      }

      const phone = splitE164PhoneNumber(this.savedPhoneNumber);
      this.profileForm.patchValue({
        phoneCountry: phone.phoneCountry,
        phoneNational: phone.phoneNational,
      });
      this.phoneCountry.markAsPristine();
      this.phoneNational.markAsPristine();
    }

    private async reconcilePushNotifications(enabled: boolean): Promise<void> {
      await this.pushRegistration.reconcile({ requestPermission: enabled });

      if (enabled && this.pushRegistration.permissionState() === 'denied') {
        await this.showNotificationSettingsPrompt();
      }
    }

    private async showNotificationSettingsPrompt(): Promise<void> {
      const alert = await this.alertController.create({
        header: this.i18n.translate('Enable notifications'),
        message: this.i18n.translate('Notifications are disabled for Veya. You can enable them in your device settings.'),
        buttons: [
          {
            text: this.i18n.translate('Cancel'),
            role: 'cancel',
          },
          {
            text: this.i18n.translate('Open Settings'),
            handler: () => {
              void this.notificationSettings.open().catch((error) => {
                console.warn('[SettingsPage] Opening notification settings failed', {
                  stage: 'open-settings',
                  status: 'error',
                  error,
                });
              });
            },
          },
        ],
      });

      await alert.present();
    }

}
