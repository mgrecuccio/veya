import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { UserService } from "./user.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { UserPrivateProfileView } from "../model/user-private-profile-view.model";
import { UpdateProfileRequest } from "../request/update-profile.request";
import { UserMatchingPreferencesView } from "../model/user-matching-preferences-view.model";
import { UpdatePreferencesRequest } from "../request/update-preferences.request";
import { UserProfileView } from "../model/user-profile-view.model";

describe('UserService', () => {
    let service: UserService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                UserService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should call getMe', () => {
        const mockUser: UserPrivateProfileView = {
            id: 1,
            displayName: 'Nina',
            timezone: 'UTC',
            email: 'test@email.com',
            status: 'ACTIVE',
            phoneNumber: '0032009933',
        };

        service.getMe().subscribe(user => {
            expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/me`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUser);
    });

    it('should call updateMe', () => {
        const payload: UpdateProfileRequest = {
            displayName: 'Nina Updated',
            timezone: 'Europe/Rome',
            phoneNumber: '+393331112222',
        };

        const mockUser: UserProfileView = {
            id: 1,
            displayName: 'Nina Updated',
            timezone: 'Europe/Rome',
            email: 'test@email.com',
            status: 'ACTIVE',
        };

        service.updateMe(payload).subscribe(user => {
            expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/me`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush(mockUser);
    });

    it('should call getPreferences', () => {
        const mockPreferences: UserMatchingPreferencesView = {
            userId: 1,
            timezone: 'Europe/Rome',
            allowChat: true,
            allowCall: false,
            quietHoursStart: '22:00:00',
            quietHoursEnd: '07:00:00',
            pushNotificationsEnabled: true,
            suggestionNotificationsEnabled: false,
        };

        service.getPreferences().subscribe(preferences => {
            expect(preferences).toEqual(mockPreferences);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/preferences`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPreferences);
    });

    it('should call updatePreferences', () => {
        const payload: UpdatePreferencesRequest = {
            allowChat: true,
            allowCall: true,
            quietHoursStart: null,
            quietHoursEnd: null,
            pushNotificationsEnabled: false,
            suggestionNotificationsEnabled: true,
        };

        const mockPreferences: UserMatchingPreferencesView = {
            userId: 1,
            timezone: 'Europe/Rome',
            ...payload,
        };

        service.updatePreferences(payload).subscribe(preferences => {
            expect(preferences).toEqual(mockPreferences);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/preferences`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush(mockPreferences);
    });
});
