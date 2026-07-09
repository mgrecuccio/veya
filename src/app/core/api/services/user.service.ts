import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { UserPrivateProfileView } from "../model/user-private-profile-view.model";


@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getMe(): Observable<UserPrivateProfileView> {
        return this.http.get<UserPrivateProfileView>(`${this.apiBaseUrl}/api/v1/users/me`);
    }

}