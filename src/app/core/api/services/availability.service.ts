import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AvailabilityRuleView } from "../model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "../model/effective-availability-view.model";
import { environment } from "src/environments/environment";
import { CreateAvailabilityRuleRequest } from "../request/create-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "../request/create-availability-override.request";
import { AvailabilityOverrideView } from "../model/availability-override-view-model";
import { UpdateAvailabilityRuleRequest } from "../model/update-availability-rule.request";


@Injectable({ providedIn: 'root' })
export class AvailabilityService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getRules(): Observable<AvailabilityRuleView[]> {
        return this.http.get<AvailabilityRuleView[]>(`${this.apiBaseUrl}/api/v1/availability/rules`);
    }

    createRule(request: CreateAvailabilityRuleRequest): Observable<AvailabilityRuleView> {
        return this.http.post<AvailabilityRuleView>(
            `${this.apiBaseUrl}/api/v1/availability/rules`,
            request
        );
    }

    updateRule(id: number, request: UpdateAvailabilityRuleRequest): Observable<AvailabilityRuleView> {
        return this.http.put<AvailabilityRuleView>(
        `${this.apiBaseUrl}/api/v1/availability/rules/${id}`,
        request,
        );
  } 

    deleteRule(id: number): Observable<void> {
        return this.http.delete<void>(
        `${this.apiBaseUrl}/api/v1/availability/rules/${id}`,
        );
    }

    getOverrides(endsAfter?: string): Observable<AvailabilityOverrideView[]> {
        const params = endsAfter
            ? new HttpParams().set('endsAfter', endsAfter)
            : undefined;

        return this.http.get<AvailabilityOverrideView[]>(
            `${this.apiBaseUrl}/api/v1/availability/overrides`,
            { params },
        );
    }

    createOverride(request: CreateAvailabilityOverrideRequest): Observable<AvailabilityOverrideView> {
        return this.http.post<AvailabilityOverrideView>(
        `${this.apiBaseUrl}/api/v1/availability/overrides`,
        request,
        );
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
