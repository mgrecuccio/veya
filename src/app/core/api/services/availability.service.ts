import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AvailabilityRuleView } from "../model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "../model/effective-availability-view.model";
import { environment } from "src/environments/environment";


@Injectable({ providedIn: 'root' })
export class AvailabilityService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getRules(): Observable<AvailabilityRuleView[]> {
        return this.http.get<AvailabilityRuleView[]>(`${this.apiBaseUrl}/api/v1/availability/rules`);
    }

    getEffectiveAvailability(
        from: string,
        to: string,
    ): Observable<EffectiveAvailabilityView[]> {
        const params = new HttpParams()
            .set('from', from)
            .set('to', to);

        return this.http.get<EffectiveAvailabilityView[]>(
            `${this.apiBaseUrl}/api/v1/availability/effective`,
            { params }
        );
    }

}