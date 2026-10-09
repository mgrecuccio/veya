import { Injectable, inject } from "@angular/core";
import { forkJoin, Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AvailabilityOverrideView } from "src/app/core/api/model/availability-override-view-model";
import { AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "src/app/core/api/model/effective-availability-view.model";
import { UpdateAvailabilityRuleRequest } from "src/app/core/api/request/update-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "src/app/core/api/request/create-availability-override.request";
import { CreateAvailabilityRuleRequest } from "src/app/core/api/request/create-availability-rule.request";
import { AvailabilityService } from "src/app/core/api/services/availability.service";
import { toUserFacingApiError } from "src/app/core/api/api-error.util";

export interface AvailabilityPageData {
    rules: AvailabilityRuleView[];
    effective: EffectiveAvailabilityView[];
}

@Injectable({ providedIn: 'root' })
export class AvailabilityPageDataService {
    private readonly availabilityService = inject(AvailabilityService);

    getPageData(): Observable<AvailabilityPageData> {
        const { from, to } = this.getThisWeekRange();

        return forkJoin({
            rules: this.availabilityService.getRules(),
            effective: this.availabilityService.getEffectiveAvailability(from, to),
        }).pipe(
            map(({ rules, effective }) => ({
                rules,
                effective,
            })),
            catchError((error) => {
                console.error('[AvailabilityPageDataService] Failed to load availability page', error);
                return throwError(() =>
                    toUserFacingApiError(
                        error,
                        'We couldn’t load your availability right now. Please try again.',
                    ),
                );
            }),
        );
    }

    createRule(request: CreateAvailabilityRuleRequest): Observable<AvailabilityRuleView> {
        return this.availabilityService.createRule(request);
    }

    updateRule(id: number, request: UpdateAvailabilityRuleRequest): Observable<AvailabilityRuleView> {
        return this.availabilityService.updateRule(id, request);
    }

    deleteRule(id: number): Observable<void> {
        return this.availabilityService.deleteRule(id);
    }

    createOverride(request: CreateAvailabilityOverrideRequest): Observable<AvailabilityOverrideView> {
        return this.availabilityService.createOverride(request);
    }

    private getThisWeekRange(): { from: string; to: string } {
        const from = new Date();
        from.setHours(0, 0, 0, 0);

        const to = new Date(from);
        to.setDate(from.getDate() + 7);
        to.setHours(23, 59, 59, 999);

        return {
            from: from.toISOString(),
            to: to.toISOString(),
        };
    }
}
