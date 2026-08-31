import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { MatchesService } from 'src/app/core/api/services/matches.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { PhoneNumberSetupService } from 'src/app/shared/phone/phone-number-setup.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { SettingsPageData, SettingsPageDataService } from './data/settings-page-data.service';
import { SettingsPage } from './settings.page';
import { PushRegistrationReconciliationService } from 'src/app/core/notifications/push-registration-reconciliation.service';

describe('SettingsPage', () => {
    let fixture: ComponentFixture<SettingsPage>;
    let component: SettingsPage;
    let dataService: jasmine.SpyObj<SettingsPageDataService>;
    let authService: jasmine.SpyObj<AuthService>;
    let matchesService: jasmine.SpyObj<MatchesService>;
    let phoneNumberSetupService: PhoneNumberSetupService;
    let appToastService: jasmine.SpyObj<AppToastService>;
    let pushRegistration: jasmine.SpyObj<PushRegistrationReconciliationService>;
    let router: jasmine.SpyObj<Router>;
    let queryParamMap$: BehaviorSubject<ParamMap>;

    beforeEach(async () => {
        queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

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
                        ['logoutAndRevoke'],
                        { authState$: of(createAuthTokens()) },
                    ),
                },
                {
                    provide: MatchesService,
                    useValue: jasmine.createSpyObj<MatchesService>(
                        'MatchesService',
                        ['createMatch', 'acceptMatch'],
                    ),
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParamMap: queryParamMap$,
                    },
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
                    provide: PushRegistrationReconciliationService,
                    useValue: jasmine.createSpyObj<PushRegistrationReconciliationService>(
                        'PushRegistrationReconciliationService',
                        ['refreshPermissionState', 'reconcile', 'disableCurrentDevice'],
                    ),
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SettingsPage);
        component = fixture.componentInstance;
        dataService = TestBed.inject(SettingsPageDataService) as jasmine.SpyObj<SettingsPageDataService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
        phoneNumberSetupService = TestBed.inject(PhoneNumberSetupService);
        appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        pushRegistration = TestBed.inject(PushRegistrationReconciliationService) as jasmine.SpyObj<PushRegistrationReconciliationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        pushRegistration.refreshPermissionState.and.returnValue(Promise.resolve('granted'));
        pushRegistration.reconcile.and.returnValue(Promise.resolve());
        pushRegistration.disableCurrentDevice.and.returnValue(Promise.resolve());
        authService.logoutAndRevoke.and.returnValue(of(void 0));
        matchesService.createMatch.and.returnValue(of({
            id: 77,
            candidateUserId: 9,
            channelType: 'CALL',
            status: 'PROPOSED',
            score: 88,
            createdAt: '2026-06-12T14:00:00Z',
            respondedAt: null,
        }));
        matchesService.acceptMatch.and.returnValue(of({
            id: 31,
            candidateUserId: 2,
            channelType: 'CALL',
            status: 'ACCEPTED',
            score: 91,
            createdAt: '2026-06-12T09:00:00Z',
            respondedAt: '2026-06-12T09:05:00Z',
        }));
        appToastService.show.and.returnValue(Promise.resolve());
        router.navigateByUrl.and.returnValue(Promise.resolve(true));
    });

    function mockPageData(): SettingsPageData {
        return {
            userProfile: {
                id: 1,
                displayName: 'Marco',
                timezone: 'Europe/Brussels',
                email: 'marco@example.com',
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

    it('should explain why phone setup is required for a proposal', () => {
        dataService.getPageData.and.returnValue(of(mockPageData()));
        queryParamMap$.next(convertToParamMap({
            setup: 'phone',
            action: 'proposal',
        }));

        fixture.detectChanges();

        const notice = fixture.nativeElement.querySelector(
            '.settings-phone-setup-notice',
        ) as HTMLElement;
        expect(notice.textContent).toContain('Add your phone number to send this match proposal.');
    });

    it('should retry a pending proposal after saving the phone number', fakeAsync(() => {
        const data = mockPageData();
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        phoneNumberSetupService.setPendingAction({
            kind: 'proposal',
            candidateUserId: 9,
            channelType: 'CALL',
            returnUrl: '/app/matches',
        });
        component.vmState$.subscribe();
        component.profileForm.patchValue({
            displayName: 'Marco',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();
        tick();

        expect(dataService.saveProfile).toHaveBeenCalledWith({
            displayName: 'Marco',
            timezone: 'Europe/Brussels',
            phoneNumber: '+32470123456',
        });
        expect(matchesService.createMatch).toHaveBeenCalledOnceWith({
            candidateUserId: 9,
            channelType: 'CALL',
        });
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/matches');
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Phone number saved. Proposal sent.',
            color: 'success',
        });
        expect(phoneNumberSetupService.consumePendingAction()).toBeNull();
    }));

    it('should retry a pending acceptance after saving the phone number', fakeAsync(() => {
        const data = mockPageData();
        dataService.getPageData.and.returnValue(of(data));
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        phoneNumberSetupService.setPendingAction({
            kind: 'acceptance',
            proposalId: 31,
            returnUrl: '/app/matches',
        });
        component.vmState$.subscribe();
        component.profileForm.patchValue({
            displayName: 'Marco',
            timezone: 'Europe/Brussels',
            phoneCountry: 'BE',
            phoneNational: '0470 12 34 56',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();
        tick();

        expect(matchesService.acceptMatch).toHaveBeenCalledOnceWith(31);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/matches');
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Phone number saved. Proposal accepted.',
            color: 'success',
        });
        expect(phoneNumberSetupService.consumePendingAction()).toBeNull();
    }));

    it('should save the selected timezone value', () => {
        const data = mockPageData();
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        component.profileForm.patchValue({
            displayName: 'Marco Veya',
            timezone: 'America/New_York',
            phoneCountry: 'BE',
            phoneNational: '',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();

        expect(dataService.saveProfile).toHaveBeenCalledOnceWith({
            displayName: 'Marco Veya',
            timezone: 'America/New_York',
            phoneNumber: null,
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

    it('should normalize blank optional profile fields to null', () => {
        const data = mockPageData();
        dataService.saveProfile.and.returnValue(of(data.userProfile));
        component.profileForm.patchValue({
            displayName: '   ',
            timezone: '',
            phoneCountry: 'BE',
            phoneNational: '',
        });
        component.profileForm.markAsDirty();

        component.saveProfile();

        expect(dataService.saveProfile).toHaveBeenCalledOnceWith({
            displayName: null,
            timezone: null,
            phoneNumber: null,
        });
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
