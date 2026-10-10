import { Injectable, inject } from "@angular/core";
import { forkJoin, Observable, of, throwError } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { AvailabilityOverrideView } from "src/app/core/api/model/availability-override-view-model";
import { AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "src/app/core/api/model/effective-availability-view.model";
import { UpdateAvailabilityRuleRequest } from "src/app/core/api/request/update-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "src/app/core/api/request/create-availability-override.request";
import { CreateAvailabilityRuleRequest } from "src/app/core/api/request/create-availability-rule.request";
import { AvailabilityService } from "src/app/core/api/services/availability.service";
import { UserService } from "src/app/core/api/services/user.service";
import { toUserFacingApiError } from "src/app/core/api/api-error.util";
import { startOfDayInTimeZone } from "src/app/shared/time/zoned-date.util";

export interface AvailabilityPageData {
    rules: AvailabilityRuleView[];
    effective: EffectiveAvailabilityView[];
    // the user's profile time zone; null when unknown, in which case the device time zone applies.
    timeZone: string | null;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityPageDataService {
    private readonly availabilityService = inject(AvailabilityService);
    private readonly userService = inject(UserService);

    getPageData(): Observable<AvailabilityPageData> {
        return forkJoin({
            rules: this.availabilityService.getRules(),
            week: this.getTimeZone().pipe(
                switchMap((timeZone) => {
                    const { from, to } = this.getThisWeekRange(timeZone);

                    return this.availabilityService.getEffectiveAvailability(from, to).pipe(
                        map((effective) => ({ effective, timeZone })),
                    );
                }),
            ),
        }).pipe(
            map(({ rules, week }) => ({
                rules,
                effective: week.effective,
                timeZone: week.timeZone,
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

    // the profile time zone only refines the week boundaries and formatting, so the device one is a safe fallback.
    private getTimeZone(): Observable<string | null> {
        return this.userService.getMe().pipe(
            map((me) => me.timezone ?? null),
            catchError(() => of(null)),
        );
    }

    // "today" starts at midnight in the user's time zone, not the device one.
    private getThisWeekRange(timeZone: string | null): { from: string; to: string } {
        const now = new Date();
        const from = startOfDayInTimeZone(now, timeZone);
        const to = new Date(startOfDayInTimeZone(now, timeZone, 8).getTime() - 1);

        return {
            from: from.toISOString(),
            to: to.toISOString(),
        };
    }
}
