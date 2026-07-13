import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { UserPrivateProfileView } from "../model/user-private-profile-view.model";
import { UpdateProfileRequest } from "../request/update-profile.request";
import { UserMatchingPreferencesView } from "../model/user-matching-preferences-view.model";
import { UpdatePreferencesRequest } from "../request/update-preferences.request";
import { UserProfileView } from "../model/user-profile-view.model";


@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getMe(): Observable<UserPrivateProfileView> {
        return this.http.get<UserPrivateProfileView>(`${this.apiBaseUrl}/api/v1/users/me`);
    }

    updateMe(payload: UpdateProfileRequest): Observable<UserProfileView> {
        return this.http.put<UserPrivateProfileView>(`${this.apiBaseUrl}/api/v1/users/me`, payload);
    }

    getPreferences(): Observable<UserMatchingPreferencesView> {
        return this.http.get<UserMatchingPreferencesView>(`${this.apiBaseUrl}/api/v1/users/preferences`);
    }

    updatePreferences(payload: UpdatePreferencesRequest): Observable<UserMatchingPreferencesView> {
        return this.http.put<UserMatchingPreferencesView>(`${this.apiBaseUrl}/api/v1/users/preferences`, payload);
    }

}
