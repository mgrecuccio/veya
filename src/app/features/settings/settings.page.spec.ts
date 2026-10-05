import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { SettingsPageData, SettingsPageDataService } from './data/settings-page-data.service';
import { SettingsPage } from './settings.page';
import { PushRegistrationReconciliationService } from 'src/app/core/notifications/push-registration-reconciliation.service';
import { NativeNotificationSettingsService } from 'src/app/core/platform/native-notification-settings.service';
import { PhoneVerificationStateService } from 'src/app/core/auth/phone-verification-state.service';
import { PhoneChangeCooldownService } from 'src/app/core/auth/phone-change-cooldown.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('SettingsPage', () => {
    let fixture: ComponentFixture<SettingsPage>;
    let component: SettingsPage;
    let dataService: jasmine.SpyObj<SettingsPageDataService>;
    let authService: jasmine.SpyObj<AuthService>;
    let appToastService: jasmine.SpyObj<AppToastService>;
    let alertController: jasmine.SpyObj<AlertController>;
    let notificationSettings: jasmine.SpyObj<NativeNotificationSettingsService>;
    let presentAlert: jasmine.Spy;
    let pushRegistration: jasmine.SpyObj<PushRegistrationReconciliationService>;
    let router: jasmine.SpyObj<Router>;
    let phoneVerificationState: jasmine.SpyObj<PhoneVerificationStateService>;
    let phoneChangeCooldown: jasmine.SpyObj<PhoneChangeCooldownService>;
    let permissionState: ReturnType<typeof signal<'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'unsupported'>>;

    beforeEach(async () => {
        permissionState = signal('granted');

        await TestBed.configureTestingModule({
            imports: [SettingsPage],
            providers: [
                {
                    provide: SettingsPageDataService,
                    useValue: jasmine.createSpyObj<SettingsPageDataService>(
                        'SettingsPageDataService',
                        ['getPageData', 'saveProfile', 'savePreferences'],
                    ),
                },
                {
                    provide: AuthService,
                    useValue: jasmine.createSpyObj<AuthService>(
                        'AuthService',
                        ['changePassword', 'deleteAccount', 'logoutAndRevoke'],
                        { authState$: of(createAuthTokens()) },
                    ),
                },
                {
                    provide: Router,
                    useValue: jasmine.createSpyObj<Router>(
                        'Router',
                        ['navigateByUrl'],
                        { events: of() },
                    ),
                },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>(
                        'AppToastService',
                        ['show'],
                    ),
                },
                {
                    provide: AlertController,
                    useValue: jasmine.createSpyObj<AlertController>(
                        'AlertController',
                        ['create'],
                    ),
                },
                {
                    provide: NativeNotificationSettingsService,
                    useValue: jasmine.createSpyObj<NativeNotificationSettingsService>(
                        'NativeNotificationSettingsService',
                        ['open'],
                    ),
                },
                {
                    provide: PushRegistrationReconciliationService,
                    useValue: jasmine.createSpyObj<PushRegistrationReconciliationService>(
                        'PushRegistrationReconciliationService',
                        [
                            'requestPermission',
                            'reconcile',
                            'disableCurrentDevice',
                        ],
                        { permissionState },
                    ),
                },
                {
                    provide: PhoneVerificationStateService,
                    useValue: jasmine.createSpyObj<PhoneVerificationStateService>(
                        'PhoneVerificationStateService',
                        ['start'],
                    ),
                },
                {
                    provide: PhoneChangeCooldownService,
                    useValue: jasmine.createSpyObj<PhoneChangeCooldownService>(
                        'PhoneChangeCooldownService',
                        ['getLockedUntil', 'lock'],
                    ),
                },
            ],
        }).compileComponents();

        dataService = TestBed.inject(SettingsPageDataService) as jasmine.SpyObj<SettingsPageDataService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
        notificationSettings = TestBed.inject(NativeNotificationSettingsService) as jasmine.SpyObj<NativeNotificationSettingsService>;
        pushRegistration = TestBed.inject(PushRegistrationReconciliationService) as jasmine.SpyObj<PushRegistrationReconciliationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        phoneVerificationState = TestBed.inject(
            PhoneVerificationStateService,
        ) as jasmine.SpyObj<PhoneVerificationStateService>;
        phoneChangeCooldown = TestBed.inject(
            PhoneChangeCooldownService,
        ) as jasmine.SpyObj<PhoneChangeCooldownService>;

        pushRegistration.reconcile.and.returnValue(Promise.resolve());
        pushRegistration.requestPermission.and.returnValue(Promise.resolve('granted'));
        pushRegistration.disableCurrentDevice.and.returnValue(Promise.resolve());
        authService.logoutAndRevoke.and.returnValue(of(void 0));
        authService.changePassword.and.returnValue(of(void 0));
        authService.deleteAccount.and.returnValue(of(void 0));
        appToastService.show.and.returnValue(Promise.resolve());
        presentAlert = jasmine.createSpy('present').and.returnValue(Promise.resolve());
        alertController.create.and.callFake((options) => Promise.resolve({
            present: presentAlert,
            options,
        } as any));
        notificationSettings.open.and.returnValue(Promise.resolve(true));
        router.navigateByUrl.and.returnValue(Promise.resolve(true));
        phoneChangeCooldown.getLockedUntil.and.returnValue(null);
        phoneChangeCooldown.lock.and.returnValue(Date.now() + 86_400_000);

        fixture = TestBed.createComponent(SettingsPage);
        component = fixture.componentInstance;
    });

    function mockPageData(): SettingsPageData {
        return {
            userProfile: {
                id: 1,
                displayName: 'Marco',
                timezone: 'Europe/Brussels',
                phoneNumber: '+32470000000',
                status: 'ACTIVE',
            },
            userPreferences: {
                userId: 1,
                timezone: 'Europe/Brussels',
                allowChat: true,
                allowCall: false,
                quietHoursStart: '22:00:00',
                quietHoursEnd: '07:00:00',
                pushNotificationsEnabled: true,
                suggestionNotificationsEnabled: false,
            },
        };
    }

    it('should emit loading then success and patch the settings forms', (done) => {
        dataService.getPageData.and.returnValue(of(mockPageData()));
        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if (state.kind === 'success') {
                expect(states).toEqual(['loading', 'success']);
                expect(component.profileForm.getRawValue()).toEqual({
                    displayName: 'Marco',
                    timezone: 'Europe/Brussels',
                    phoneCountry: 'BE',
                    phoneNational: '470000000',
                });
                expect(component.preferencesForm.getRawValue()).toEqual({
                    allowChat: true,
                    allowCall: false,
                    quietHoursStart: '22:00:00',
                    quietHoursEnd: '07:00:00',
                    pushNotificationsEnabled: true,
                    suggestionNotificationsEnabled: false,
                });
                expect(component.profileForm.pristine).toBeTrue();
                expect(component.preferencesForm.pristine).toBeTrue();
                done();
            }
        });
    });

    it('should fall back to preferences timezone when profile timezone is missing', (done) => {
        const data = mockPageData();
        data.userProfile.timezone = null;
        dataService.getPageData.and.returnValue(of(data));

        component.vmState$.subscribe((state) => {
            if (state.kind === 'success') {
                expect(component.profileForm.controls.timezone.value).toBe('Europe/Brussels');
                done();
            }
        });
    });

    it('should expose the limited timezone options', () => {
        expect(component.timezoneOptions.map((timezone) => timezone.value)).toEqual([
            'UTC',
            'Europe/Brussels',
            'Europe/London',
            'America/New_York',
            'Asia/Tokyo',
        ]);
    });

    it('should enable the profile save button when the profile form is changed', () => {
        dataService.getPageData.and.returnValue(of(mockPageData()));

        fixture.detectChanges();
        component.profileForm.controls.displayName.setValue('Marco Veya');
        component.profileForm.markAsDirty();
        fixture.detectChanges();

        const profileSaveButton = fixture.nativeElement.querySelector(
            'button.settings-save-button',
        ) as { disabled: boolean };

        expect(component.profileForm.dirty).toBeTrue();
        expect(profileSaveButton.disabled).toBeFalse();
    });

    it('should show a success toast after saving the profile', fakeAsync(() => {
        const data = mockPageData();
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();
        tick();

        expect(dataService.saveProfile).toHaveBeenCalledWith({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneNumber: '+32470123456',
        });
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Profile saved.',
            color: 'success',
        });
    }));

    it('should save the selected timezone value', () => {
        const data = mockPageData();
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'America/New_York',
            phoneCountry: 'BE',
            phoneNational: '0470 00 00 00',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();

        expect(dataService.saveProfile).toHaveBeenCalledOnceWith({
            displayName: 'Marco Veya',
            timezone: 'America/New_York',
            phoneNumber: '+32470000000',
        });
    });

    it('should show profile saving state while the save request is pending', fakeAsync(() => {
        const data = mockPageData();
        const save$ = new Subject<SettingsPageData['userProfile']>();
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(save$);
        fixture.detectChanges();
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();
        fixture.detectChanges();

        const profileSaveButton = fixture.nativeElement.querySelector(
            'button.settings-save-button',
        ) as HTMLElement & { disabled: boolean };

        expect(component.isSavingProfile()).toBeTrue();
        expect(profileSaveButton.disabled).toBeTrue();
        expect(profileSaveButton.textContent).toContain('Saving profile...');
        expect(profileSaveButton.querySelector('ion-spinner')).not.toBeNull();

        save$.next(data.userProfile);
        save$.complete();
        tick();
        fixture.detectChanges();

        expect(component.isSavingProfile()).toBeFalse();
    }));

    it('should clear profile saving state when the save request fails', () => {
        const save$ = new Subject<SettingsPageData['userProfile']>();
        dataService.saveProfile.and.returnValue(save$);
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();
        expect(component.isSavingProfile()).toBeTrue();

        save$.error({
            error: {
                detail: 'Profile save failed.',
            },
        });

        expect(component.isSavingProfile()).toBeFalse();
    });

    it('should require non-blank profile fields', () => {
        component.profileForm.patchValue({
            displayName: '   ',
            timezone: '',
            phoneCountry: 'BE',
            phoneNational: '0470 00 00 00',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();

        expect(component.profileForm.invalid).toBeTrue();
        expect(dataService.saveProfile).not.toHaveBeenCalled();
    });

    it('should start phone verification after changing the phone number', fakeAsync(() => {
        const data = mockPageData();
        const updatedProfile = {
            ...data.userProfile,
            phoneNumber: '+32470123456',
        };
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(of(updatedProfile));
        fixture.detectChanges();
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });

        component.saveProfile();
        tick();

        expect(phoneVerificationState.start).toHaveBeenCalledOnceWith('phone-change');
        expect(phoneChangeCooldown.lock).toHaveBeenCalledOnceWith(data.userProfile.id);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/verify-phone', {
            replaceUrl: true,
        });
    }));

    it('should treat an equivalently formatted phone number as unchanged', fakeAsync(() => {
        const data = mockPageData();
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(of({
            ...data.userProfile,
            displayName: 'Marco Veya',
        }));
        fixture.detectChanges();
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            phoneNational: '+32 470 00 00 00',
        });

        component.saveProfile();
        tick();

        expect(dataService.saveProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            displayName: 'Marco Veya',
            phoneNumber: '+32470000000',
        }));
        expect(phoneChangeCooldown.lock).not.toHaveBeenCalled();
        expect(phoneVerificationState.start).not.toHaveBeenCalled();
        expect(component.toastState().message).toBe('Profile saved.');
    }));

    it('should explain a backend phone-change rate limit and preserve other edits', () => {
        const data = mockPageData();
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 429,
            error: {
                code: 'TOO_MANY_ATTEMPTS',
                detail: 'Too many attempts',
            },
        })));
        fixture.detectChanges();
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            phoneNational: '0470 12 34 56',
        });

        component.saveProfile();

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'You can change your phone number once per day. Please try again later.',
            color: 'danger',
        });
        expect(component.profileForm.controls.displayName.value).toBe('Marco Veya');
        expect(component.phoneNational.value).toBe('470000000');
        expect(component.profileForm.controls.displayName.enabled).toBeTrue();
        expect(component.profileForm.controls.timezone.enabled).toBeTrue();
        expect(phoneVerificationState.start).not.toHaveBeenCalled();
    });

    it('should lock only phone editing during a known cooldown', () => {
        const data = mockPageData();
        phoneChangeCooldown.getLockedUntil.and.returnValue(Date.now() + 60_000);
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(of({
            ...data.userProfile,
            displayName: 'Marco Veya',
        }));
        fixture.detectChanges();

        expect(component.phoneCountry.disabled).toBeTrue();
        expect(component.phoneNational.disabled).toBeTrue();
        expect(component.profileForm.controls.displayName.enabled).toBeTrue();
        expect(component.profileForm.controls.timezone.enabled).toBeTrue();

        component.profileForm.controls.displayName.setValue('Marco Veya');
        component.saveProfile();

        expect(dataService.saveProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            displayName: 'Marco Veya',
            phoneNumber: '+32470000000',
        }));
    });

    it('should not allow the phone number to be cleared', () => {
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '',
        });

        component.saveProfile();

        expect(component.profileForm.hasError('requiredPhoneNumber')).toBeTrue();
        expect(component.phoneNational.touched).toBeTrue();
        expect(dataService.saveProfile).not.toHaveBeenCalled();
    });

    it('should not save the profile when the phone number is invalid', () => {
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '123',
        });

        component.saveProfile();

        expect(component.profileForm.hasError('invalidPhoneNumber')).toBeTrue();
        expect(component.phoneNational.touched).toBeTrue();
        expect(dataService.saveProfile).not.toHaveBeenCalled();
    });

    it('should normalize blank quiet hours to null when saving preferences', () => {
        const data = mockPageData();
        dataService.savePreferences.and.returnValue(of(data.userPreferences));
        component.preferencesForm.patchValue({
            allowChat: true,
            allowCall: false,
            quietHoursStart: '',
            quietHoursEnd: '   ',
            pushNotificationsEnabled: true,
            suggestionNotificationsEnabled: false,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();

        expect(dataService.savePreferences).toHaveBeenCalledOnceWith({
            allowChat: true,
            allowCall: false,
            quietHoursStart: null,
            quietHoursEnd: null,
            pushNotificationsEnabled: true,
            suggestionNotificationsEnabled: false,
        });
    });

    it('should save preferences, reload the page, and show a success toast', fakeAsync(() => {
        const data = mockPageData();
        dataService.getPageData.and.returnValue(of(data));
        dataService.savePreferences.and.returnValue(of(data.userPreferences));
        const sub = component.vmState$.subscribe();
        component.preferencesForm.patchValue({
            allowChat: false,
            allowCall: true,
            quietHoursStart: '21:00:00',
            quietHoursEnd: '06:30:00',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();

        expect(component.isSavingPreferences()).toBeFalse();
        expect(component.isSavingProfile()).toBeFalse();
        expect(dataService.savePreferences).toHaveBeenCalledOnceWith({
            allowChat: false,
            allowCall: true,
            quietHoursStart: '21:00:00',
            quietHoursEnd: '06:30:00',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        });
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

        tick();

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Preferences saved.',
            color: 'success',
        });

        sub.unsubscribe();
    }));

    it('should request notification permission and keep the form dirty when switched on', async () => {
        component.preferencesForm.patchValue({ pushNotificationsEnabled: true });
        component.preferencesForm.markAsDirty();

        await component.onPushNotificationsToggle();

        expect(pushRegistration.requestPermission).toHaveBeenCalledTimes(1);
        expect(dataService.savePreferences).not.toHaveBeenCalled();
        expect(pushRegistration.reconcile).not.toHaveBeenCalled();
        expect(appToastService.show).not.toHaveBeenCalled();
        expect(component.preferencesForm.dirty).toBeTrue();
    });

    it('should not request notification permission when switched off', async () => {
        component.preferencesForm.patchValue({ pushNotificationsEnabled: false });
        component.preferencesForm.markAsDirty();

        await component.onPushNotificationsToggle();

        expect(pushRegistration.requestPermission).not.toHaveBeenCalled();
        expect(dataService.savePreferences).not.toHaveBeenCalled();
    });

    it('should show preferences saving state while the save request is pending', fakeAsync(() => {
        const data = mockPageData();
        const save$ = new Subject<SettingsPageData['userPreferences']>();
        dataService.getPageData.and.returnValue(of(data));
        dataService.savePreferences.and.returnValue(save$);
        fixture.detectChanges();
        component.preferencesForm.patchValue({
            allowChat: false,
            allowCall: true,
            quietHoursStart: '21:00',
            quietHoursEnd: '06:30',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();
        fixture.detectChanges();

        const preferenceSaveButton = fixture.nativeElement.querySelectorAll(
            'button.settings-save-button',
        )[1] as HTMLElement & { disabled: boolean };

        expect(component.isSavingPreferences()).toBeTrue();
        expect(preferenceSaveButton.disabled).toBeTrue();
        expect(preferenceSaveButton.textContent).toContain('Saving preferences...');
        expect(preferenceSaveButton.querySelector('ion-spinner')).not.toBeNull();

        save$.next(data.userPreferences);
        save$.complete();
        tick();
        fixture.detectChanges();

        expect(component.isSavingPreferences()).toBeFalse();
    }));

    it('should clear preferences saving state when the save request fails', () => {
        const save$ = new Subject<SettingsPageData['userPreferences']>();
        dataService.savePreferences.and.returnValue(save$);
        component.preferencesForm.patchValue({
            allowChat: true,
            allowCall: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            pushNotificationsEnabled: true,
            suggestionNotificationsEnabled: false,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();
        expect(component.isSavingPreferences()).toBeTrue();

        save$.error({
            error: {
                detail: 'Preferences save failed.',
            },
        });

        expect(component.isSavingPreferences()).toBeFalse();
    });

    it('should normalize HH:mm quiet hours to backend-compatible HH:mm:ss values', () => {
        const data = mockPageData();
        dataService.savePreferences.and.returnValue(of(data.userPreferences));
        component.preferencesForm.patchValue({
            allowChat: true,
            allowCall: true,
            quietHoursStart: '21:00',
            quietHoursEnd: '06:30',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();

        expect(dataService.savePreferences).toHaveBeenCalledOnceWith({
            allowChat: true,
            allowCall: true,
            quietHoursStart: '21:00:00',
            quietHoursEnd: '06:30:00',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        });
    });

    it('should show an error toast when saving preferences fails', fakeAsync(() => {
        dataService.savePreferences.and.returnValue(
            throwError(() => ({
                error: {
                    detail: 'Quiet hours are invalid.',
                },
            })),
        );
        component.preferencesForm.patchValue({
            allowChat: true,
            allowCall: false,
            quietHoursStart: '22:00:00',
            quietHoursEnd: '07:00:00',
            pushNotificationsEnabled: true,
            suggestionNotificationsEnabled: false,
        });
        component.preferencesForm.markAsDirty();

        component.savePreferences();
        tick();

        expect(component.isSavingPreferences()).toBeFalse();
        expect(dataService.savePreferences).toHaveBeenCalledTimes(1);
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Quiet hours are invalid.',
            color: 'danger',
        });
    }));

    it('should offer to open device settings when notification permission is denied', fakeAsync(() => {
        pushRegistration.requestPermission.and.returnValue(Promise.resolve('denied'));
        component.preferencesForm.patchValue({ pushNotificationsEnabled: true });
        component.preferencesForm.markAsDirty();

        component.onPushNotificationsToggle();
        tick();

        expect(alertController.create).toHaveBeenCalledTimes(1);
        expect(presentAlert).toHaveBeenCalledTimes(1);
        expect(appToastService.show).not.toHaveBeenCalled();

        const options = alertController.create.calls.mostRecent().args[0] as any;
        expect(options.header).toBe('Enable notifications');
        options.buttons[1].handler();
        tick();

        expect(notificationSettings.open).toHaveBeenCalledTimes(1);
    }));

    it('should emit loading then error when page load fails', (done) => {
        dataService.getPageData.and.returnValue(
            throwError(() => new Error('Load failed')),
        );
        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if (state.kind === 'error') {
                expect(states).toEqual(['loading', 'error']);
                expect(state.message).toBe('Load failed');
                done();
            }
        });
    });

    it('should reload when retry is called', () => {
        dataService.getPageData.and.returnValue(of(mockPageData()));

        const sub = component.vmState$.subscribe();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.retry();
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

        sub.unsubscribe();
    });

    it('should logout and navigate to login', fakeAsync(() => {
        component.logout();
        tick();

        expect(component.isLoggingOut()).toBeTrue();
        expect(pushRegistration.disableCurrentDevice).toHaveBeenCalledTimes(1);
        expect(authService.logoutAndRevoke).toHaveBeenCalledTimes(1);
        expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/auth/login', {
            replaceUrl: true,
        });
    }));

    it('should confirm account deletion before sending the request', () => {
        dataService.getPageData.and.returnValue(of(mockPageData()));
        component.openDeleteAccountModal();
        fixture.detectChanges();

        expect(component.isDeleteAccountModalOpen()).toBeTrue();
        expect(authService.deleteAccount).not.toHaveBeenCalled();

        const dialog = fixture.nativeElement.querySelector(
            '[aria-labelledby="delete-account-title"]',
        ) as HTMLElement;
        const deleteButton = dialog.querySelector(
            '.contact-actions-sheet__button--danger',
        ) as HTMLButtonElement;

        expect(dialog).not.toBeNull();
        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.textContent).toContain('This action cannot be undone.');

        deleteButton.click();

        expect(authService.deleteAccount).toHaveBeenCalledTimes(1);
        expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/auth/login', {
            replaceUrl: true,
        });
    });

    it('should close account deletion confirmation without deleting', () => {
        component.openDeleteAccountModal();
        component.closeDeleteAccountModal();

        expect(component.isDeleteAccountModalOpen()).toBeFalse();
        expect(authService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should show an error and keep the user on settings when deletion fails', () => {
        authService.deleteAccount.and.returnValue(throwError(() => ({
            apiError: { message: 'Account deletion failed.' },
        })));

        component.deleteAccount();

        expect(component.isDeletingAccount()).toBeFalse();
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Account deletion failed.',
            color: 'danger',
        });
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should ignore duplicate account deletion attempts while pending', () => {
        authService.deleteAccount.and.returnValue(new Subject<void>());

        component.deleteAccount();
        component.deleteAccount();

        expect(component.isDeletingAccount()).toBeTrue();
        expect(authService.deleteAccount).toHaveBeenCalledTimes(1);
    });

    it('should change the password and navigate to login', () => {
        component.openPasswordModal();
        component.passwordForm.setValue({
            currentPassword: 'password123',
            newPassword: 'new-password-456',
            confirmPassword: 'new-password-456',
        });

        component.changePassword();

        expect(authService.changePassword).toHaveBeenCalledOnceWith({
            currentPassword: 'password123',
            newPassword: 'new-password-456',
        });
        expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/auth/login', {
            replaceUrl: true,
        });
        expect(component.isChangingPassword()).toBeFalse();
        expect(component.isPasswordModalOpen()).toBeFalse();
        expect(component.passwordForm.getRawValue()).toEqual({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    });

    it('should open the password dialog from the security action', () => {
        dataService.getPageData.and.returnValue(of(mockPageData()));
        fixture.detectChanges();

        const changePasswordButton = fixture.nativeElement.querySelector(
            '.settings-card .primary-cta-card',
        ) as HTMLButtonElement;

        expect(component.isPasswordModalOpen()).toBeFalse();
        expect(changePasswordButton.textContent).toContain('Change password');

        changePasswordButton.click();
        fixture.detectChanges();

        expect(component.isPasswordModalOpen()).toBeTrue();
        const passwordDialog = fixture.nativeElement.querySelector(
            '.contact-actions-overlay .password-dialog',
        ) as HTMLElement;
        expect(passwordDialog).not.toBeNull();
        expect(passwordDialog.getAttribute('role')).toBe('dialog');
        expect(passwordDialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should clear sensitive password state when the dialog closes', () => {
        component.openPasswordModal();
        component.passwordForm.setValue({
            currentPassword: 'password123',
            newPassword: 'new-password-456',
            confirmPassword: 'new-password-456',
        });
        component.passwordError = 'Example error';
        component.togglePasswordVisibility('currentPassword');

        component.closePasswordModal();

        expect(component.isPasswordModalOpen()).toBeFalse();
        expect(component.passwordForm.getRawValue()).toEqual({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        expect(component.passwordError).toBeNull();
        expect(component.isPasswordVisible('currentPassword')).toBeFalse();
    });

    it('should reject mismatched passwords without sending a request', () => {
        component.passwordForm.setValue({
            currentPassword: 'password123',
            newPassword: 'new-password-456',
            confirmPassword: 'different-password',
        });

        component.changePassword();

        expect(component.passwordForm.hasError('passwordMismatch')).toBeTrue();
        expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should independently show and hide change-password fields', () => {
        expect(component.isPasswordVisible('currentPassword')).toBeFalse();
        expect(component.isPasswordVisible('newPassword')).toBeFalse();

        component.togglePasswordVisibility('currentPassword');

        expect(component.isPasswordVisible('currentPassword')).toBeTrue();
        expect(component.isPasswordVisible('newPassword')).toBeFalse();

        component.togglePasswordVisibility('currentPassword');

        expect(component.isPasswordVisible('currentPassword')).toBeFalse();
    });

    it('should show a change-password error and keep the session active', () => {
        authService.changePassword.and.returnValue(throwError(() => ({
            code: 'INVALID_CREDENTIALS',
            message: 'Your current password is incorrect.',
        })));
        component.openPasswordModal();
        component.passwordForm.setValue({
            currentPassword: 'wrong-password',
            newPassword: 'new-password-456',
            confirmPassword: 'new-password-456',
        });

        component.changePassword();

        expect(component.passwordError).toBe('Your current password is incorrect.');
        expect(component.isChangingPassword()).toBeFalse();
        expect(component.isPasswordModalOpen()).toBeTrue();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should ignore duplicate logout attempts while logging out', fakeAsync(() => {
        authService.logoutAndRevoke.and.returnValue(new Subject<void>());

        component.logout();
        component.logout();
        tick();

        expect(pushRegistration.disableCurrentDevice).toHaveBeenCalledTimes(1);
        expect(authService.logoutAndRevoke).toHaveBeenCalledTimes(1);
    }));
});

function createAuthTokens() {
    return {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
    };
}
