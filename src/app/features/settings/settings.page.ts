import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, map, merge, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { SettingsPageData, SettingsPageDataService } from './data/settings-page-data.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { authenticatedSessionReload } from 'src/app/core/auth/authenticated-session-reload.util';
import { getApiErrorMessage } from 'src/app/core/api/api-error.util';
import { PushRegistrationReconciliationService } from 'src/app/core/notifications/push-registration-reconciliation.service';
import { DEVICE_TOKEN_PLATFORM } from 'src/app/core/api/request/register-device-token.request';
import { AppToastColor, AppToastService } from 'src/app/shared/toast/app-toast.service';
import { APP_VERSION } from 'src/environments/app-version';
import { BiometricLoginService } from 'src/app/core/auth/biometric-login.service';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  requiredPhoneValidator,
  PhoneCountry,
  splitE164PhoneNumber,
} from 'src/app/shared/phone/phone-number.util';

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
    email: string;
    phoneNumber?: string | null;
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

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

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
    private readonly biometricLogin = inject(BiometricLoginService);
    private readonly router = inject(Router);
    private readonly appToastService = inject(AppToastService);
    private readonly pushRegistration = inject(PushRegistrationReconciliationService);
    private readonly reload$ = new Subject<void>();

    readonly countries: PhoneCountry[] = createPhoneCountries();
    readonly timezoneOptions = TIMEZONE_OPTIONS;
    readonly appVersion = APP_VERSION;
    readonly isSavingProfile = signal(false);
    readonly isSavingPreferences = signal(false);
    readonly isLoggingOut = signal(false);
    readonly isEnablingPushOnDevice = signal(false);
    readonly biometricAvailable = signal(false);
    readonly biometricEnabled = signal(false);
    readonly biometricBusy = signal(false);
    readonly biometricLabel = signal('Biometrics');
    readonly accountPushPreferenceEnabled = signal(false);
    readonly pushPermissionState = computed(() => this.pushRegistration.permissionState());
    readonly showPushDeviceEnablement = computed(() => {
      const permission = this.pushPermissionState();
      return this.accountPushPreferenceEnabled()
        && (permission === 'prompt' || permission === 'prompt-with-rationale');
    });
    readonly isPushPermissionBlocked = computed(() =>
      this.accountPushPreferenceEnabled() && this.pushPermissionState() === 'denied',
    );
    readonly isPushRegistrationFailed = computed(() =>
      this.accountPushPreferenceEnabled()
        && this.pushPermissionState() === 'granted'
        && this.pushRegistration.registrationStatus() === 'error',
    );
    profileError: string | null = null;
    preferencesError: string | null = null;

    readonly profileForm = this.fb.group(
      {
        displayName: [''],
        timezone: [''],
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

    constructor() {
      void this.refreshBiometricState();
    }

    readonly vmState$: Observable<SettingsPageVmState> = merge(
      this.reload$,
      authenticatedSessionReload(this.authService.authState$),
    ).pipe(
      switchMap(() =>
        this.settingsPageDataService.getPageData().pipe(
          tap((data) => {
            this.patchForms(data);
            void this.refreshNotificationPermissionDisplay(
              data.userPreferences.pushNotificationsEnabled,
            );
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

    async saveProfile(): Promise<void> {
      if(this.profileForm.invalid || this.isSavingProfile()) {
        this.profileForm.markAllAsTouched();
        return;
      }

      this.isSavingProfile.set(true);
      const raw = this.profileForm.getRawValue();
      const phoneNumber = getNormalizedPhoneNumber(
        raw.phoneCountry,
        raw.phoneNational,
      );
      
      this.settingsPageDataService.saveProfile({
          displayName: this.blankToNull(raw.displayName),
          timezone: this.blankToNull(raw.timezone),
          phoneNumber: phoneNumber!,
      }).subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.retry();
          this.showToast('Profile saved.', 'success');
        },
        error: (error: any) => {
          this.isSavingProfile.set(false);
          this.showToast(
            getApiErrorMessage(error, 'We couldn’t save your profile right now.'),
            'danger',
          );
        }
      });
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
          this.accountPushPreferenceEnabled.set(preferences.pushNotificationsEnabled);
          void this.pushRegistration.reconcile({
            requestPermission: preferences.pushNotificationsEnabled
              && this.pushRegistration.getDevicePlatform() !== DEVICE_TOKEN_PLATFORM.IOS,
          });
          void this.refreshNotificationPermissionDisplay(
            preferences.pushNotificationsEnabled,
          );
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

    async enablePushOnThisDevice(): Promise<void> {
      if (this.isEnablingPushOnDevice() || !this.showPushDeviceEnablement()) {
        return;
      }

      this.isEnablingPushOnDevice.set(true);

      try {
        await this.pushRegistration.reconcile({ requestPermission: true });

        if (this.pushPermissionState() === 'granted') {
          this.showToast('Notifications enabled on this device.', 'success');
        } else if (this.pushPermissionState() === 'denied') {
          this.showToast(
            'Notifications are blocked. Enable them in iOS Settings to continue.',
            'danger',
          );
        } else if (this.pushRegistration.registrationStatus() === 'error') {
          this.showToast(
            'We couldn’t register this device. Please try again.',
            'danger',
          );
        }
      } finally {
        this.isEnablingPushOnDevice.set(false);
      }
    }

    logout(): void {
      if (this.isLoggingOut()) {
        return;
      }

      this.isLoggingOut.set(true);
      void this.biometricLogin.disable();
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

    async toggleBiometricLogin(): Promise<void> {
      if (this.biometricBusy()) {
        return;
      }

      this.biometricBusy.set(true);

      try {
        if (this.biometricEnabled()) {
          await this.biometricLogin.disable();
          this.showToast('Biometric login disabled.', 'success');
        } else {
          const refreshToken = this.authService.getRefreshToken();
          if (!refreshToken) {
            throw new Error('Log in again before enabling biometric login.');
          }

          await this.biometricLogin.enable(refreshToken);
          this.showToast(`${this.biometricLabel()} login enabled.`, 'success');
        }
      } catch (error) {
        this.showToast(
          error instanceof Error
            ? error.message
            : 'We couldn’t update biometric login.',
          'danger',
        );
      } finally {
        this.biometricBusy.set(false);
        await this.refreshBiometricState();
      }
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

    private blankToNull(value: string | null | undefined): string | null {
      const normalized = value?.trim() ?? '';
      return normalized || null;
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
      this.accountPushPreferenceEnabled.set(
        data.userPreferences.pushNotificationsEnabled,
      );

      this.profileForm.markAsPristine();
      this.preferencesForm.markAsPristine();
    }

    private async refreshNotificationPermissionDisplay(
      pushNotificationsEnabled: boolean,
    ): Promise<void> {
      try {
        await this.pushRegistration.refreshPermissionState();
        this.accountPushPreferenceEnabled.set(pushNotificationsEnabled);
      } catch (error) {
        console.warn('[SettingsPage] Notification permission refresh failed', {
          stage: 'permission-check',
          status: 'error',
          error,
        });
      }
    }

    private async refreshBiometricState(): Promise<void> {
      const availability = await this.biometricLogin.getAvailability();
      this.biometricAvailable.set(availability.available);
      this.biometricEnabled.set(availability.enabled);
      this.biometricLabel.set(availability.label);
    }
}
