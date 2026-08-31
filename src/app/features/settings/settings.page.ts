import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { SettingsPageData, SettingsPageDataService } from './data/settings-page-data.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { getApiErrorMessage } from 'src/app/core/api/api-error.util';
import { MatchesService } from 'src/app/core/api/services/matches.service';
import { PhoneNumberSetupService } from 'src/app/shared/phone/phone-number-setup.service';
import { AppToastColor, AppToastService } from 'src/app/shared/toast/app-toast.service';
import {
  createPhoneCountries,
  getDefaultPhoneCountry,
  getNormalizedPhoneNumber,
  optionalPhoneValidator,
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
    private readonly matchesService = inject(MatchesService);
    private readonly phoneNumberSetupService = inject(PhoneNumberSetupService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly appToastService = inject(AppToastService);
    private readonly reload$ = new Subject<void>();

    readonly countries: PhoneCountry[] = createPhoneCountries();
    readonly timezoneOptions = TIMEZONE_OPTIONS;
    readonly isSavingProfile = signal(false);
    readonly isSavingPreferences = signal(false);
    readonly isLoggingOut = signal(false);
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
        validators: [optionalPhoneValidator()],
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

    readonly phoneSetupMessage$: Observable<string | null> = this.route.queryParamMap.pipe(
      map((params) => {
        if (params.get('setup') !== 'phone') {
          return null;
        }

        switch (params.get('action')) {
          case 'proposal':
            return 'Add your phone number to send this match proposal.';
          case 'acceptance':
            return 'Add your phone number to accept this match request.';
          default:
            return 'Add your phone number to continue with this match.';
        }
      }),
    );

    readonly vmState$: Observable<SettingsPageVmState> = this.reload$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.settingsPageDataService.getPageData().pipe(
          tap((data) => this.patchForms(data)),
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
        this.profileForm.hasError('invalidPhoneNumber')
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
          phoneNumber: phoneNumber ?? null,
      }).subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.retry();
          this.retryPendingPhoneAction();
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
        next: () => {
          this.isSavingPreferences.set(false);
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

    logout(): void {
      if (this.isLoggingOut()) {
        return;
      }

      this.isLoggingOut.set(true);
      this.authService.logoutAndRevoke().subscribe({
        next: () => {
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        },
        error: () => {
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
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

    private retryPendingPhoneAction(): void {
      const pendingAction = this.phoneNumberSetupService.consumePendingAction();

      if (!pendingAction) {
        this.showToast('Profile saved.', 'success');
        return;
      }

      const retry$ =
        pendingAction.kind === 'proposal'
          ? this.matchesService.createMatch({
              candidateUserId: pendingAction.candidateUserId,
              channelType: pendingAction.channelType,
            })
          : this.matchesService.acceptMatch(pendingAction.proposalId);

      retry$.subscribe({
        next: () => {
          this.showToast(
            pendingAction.kind === 'proposal'
              ? 'Phone number saved. Proposal sent.'
              : 'Phone number saved. Proposal accepted.',
            'success',
          );
          void this.router.navigateByUrl(pendingAction.returnUrl);
        },
        error: (error: unknown) => {
          this.showToast(
            getApiErrorMessage(
              error,
              pendingAction.kind === 'proposal'
                ? 'Your phone number was saved, but we couldn’t send the proposal.'
                : 'Your phone number was saved, but we couldn’t accept the proposal.',
            ),
            'danger',
          );
        },
      });
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

      this.profileForm.markAsPristine();
      this.preferencesForm.markAsPristine();
    }
}
