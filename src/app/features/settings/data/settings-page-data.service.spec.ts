import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserService } from 'src/app/core/api/services/user.service';
import { SettingsPageDataService } from './settings-page-data.service';

describe('SettingsPageDataService', () => {
    let service: SettingsPageDataService;
    let userService: jasmine.SpyObj<UserService>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SettingsPageDataService,
                {
                    provide: UserService,
                    useValue: jasmine.createSpyObj<UserService>('UserService', [
                        'getMe',
                        'getPreferences',
                        'updateMe',
                        'updatePreferences',
                    ]),
                },
            ],
        });

        service = TestBed.inject(SettingsPageDataService);
        userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    });

    function mockBase(): void {
        userService.getMe.and.returnValue(
            of({
                id: 1,
                displayName: 'Marco',
                timezone: 'Europe/Brussels',
                email: 'marco@example.com',
                phoneNumber: '+32470000000',
                status: 'ACTIVE',
            }),
        );

        userService.getPreferences.and.returnValue(
            of({
                userId: 1,
                timezone: 'Europe/Brussels',
                allowChat: true,
                allowCall: false,
                quietHoursStart: '22:00:00',
                quietHoursEnd: '07:00:00',
                pushNotificationsEnabled: true,
                suggestionNotificationsEnabled: false,
            }),
        );
    }

    it('loads settings page data from profile and preferences API calls', (done) => {
        mockBase();

        service.getPageData().subscribe((data) => {
            expect(userService.getMe).toHaveBeenCalledTimes(1);
            expect(userService.getPreferences).toHaveBeenCalledTimes(1);
            expect(data.userProfile).toEqual(
                jasmine.objectContaining({
                    id: 1,
                    displayName: 'Marco',
                    timezone: 'Europe/Brussels',
                    email: 'marco@example.com',
                    phoneNumber: '+32470000000',
                    status: 'ACTIVE',
                }),
            );
            expect(data.userPreferences).toEqual(
                jasmine.objectContaining({
                    userId: 1,
                    timezone: 'Europe/Brussels',
                    allowChat: true,
                    allowCall: false,
                    quietHoursStart: '22:00:00',
                    quietHoursEnd: '07:00:00',
                    pushNotificationsEnabled: true,
                    suggestionNotificationsEnabled: false,
                }),
            );
            done();
        });
    });

    it('fails the whole settings page when a core request fails', (done) => {
        mockBase();
        spyOn(console, 'error');
        userService.getMe.and.returnValue(
            throwError(() => new Error('Internal Server Error')),
        );

        service.getPageData().subscribe({
            next: () => fail('unexpected data'),
            error: (error: Error) => {
                expect(error.message).toBe('We couldn’t load your settings right now. Please try again.');
                done();
            },
        });
    });

    it('saves profile through the user API', (done) => {
        const payload = {
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            phoneNumber: '+32470000000',
        };
        const savedProfile = {
            id: 1,
            displayName: 'Marco Veya',
            timezone: 'Europe/Brussels',
            email: 'marco@example.com',
            phoneNumber: '+32470000000',
            status: 'ACTIVE',
        };
        userService.updateMe.and.returnValue(of(savedProfile));

        service.saveProfile(payload).subscribe((profile) => {
            expect(userService.updateMe).toHaveBeenCalledOnceWith(payload);
            expect(profile).toEqual(savedProfile);
            done();
        });
    });

    it('saves preferences through the user API', (done) => {
        const payload = {
            allowChat: true,
            allowCall: true,
            quietHoursStart: '21:00:00',
            quietHoursEnd: '06:30:00',
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        };
        const savedPreferences = {
            userId: 1,
            timezone: 'Europe/Brussels',
            ...payload,
        };
        userService.updatePreferences.and.returnValue(of(savedPreferences));

        service.savePreferences(payload).subscribe((preferences) => {
            expect(userService.updatePreferences).toHaveBeenCalledOnceWith(payload);
            expect(preferences).toEqual(savedPreferences);
            done();
        });
    });
});
