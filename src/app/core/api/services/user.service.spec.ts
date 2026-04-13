import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { UserService } from "./user.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
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
        const mockUser: UserProfileView = {
            id: 'user-id',
            displayName: 'Nina',
            timezone: 'UTC',
        };

        service.getMe().subscribe(user => {
            expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/me`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUser);
    });
});