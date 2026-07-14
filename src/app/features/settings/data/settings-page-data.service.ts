import { inject, Injectable } from "@angular/core";
import { UserService } from "src/app/core/api/services/user.service";
import { UserPrivateProfileView } from "src/app/core/api/model/user-private-profile-view.model";
import { UserMatchingPreferencesView } from "src/app/core/api/model/user-matching-preferences-view.model";
import { forkJoin, Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { toUserFacingApiError } from "src/app/core/api/api-error.util";
import { UpdateProfileRequest } from "src/app/core/api/request/update-profile.request";
import { UpdatePreferencesRequest } from "src/app/core/api/request/update-preferences.request";

export interface SettingsPageData {
    userProfile: UserPrivateProfileView,
    userPreferences: UserMatchingPreferencesView,
}

@Injectable({providedIn: 'root'})
export class SettingsPageDataService {
    private readonly userService = inject(UserService);

    getPageData(): Observable<SettingsPageData> {
        return forkJoin({
            userProfile: this.userService.getMe(),
            userPreferences: this.userService.getPreferences()
        }).pipe(
            map(({ userProfile, userPreferences }) => ({
                userProfile,
                userPreferences,
            })),
            catchError((error) => {
                console.error('[SettingsPageDataService] Failed to load settings page', error);
                return throwError(() =>
                    toUserFacingApiError(
                        error,
                        'We couldn’t load your settings right now. Please try again.',
                    ),
                );
            }),
        );
    }

    saveProfile(input: UpdateProfileRequest): Observable<UserPrivateProfileView> {
        return this.userService.updateMe(input);
    }

    savePreferences(input: UpdatePreferencesRequest): Observable<UserMatchingPreferencesView> {
        return this.userService.updatePreferences(input);
    }
}
