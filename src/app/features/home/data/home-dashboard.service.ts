import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EffectiveAvailabilityView } from 'src/app/core/api/model/effective-availability-view.model';
import { AvailabilityRuleView } from 'src/app/core/api/model/availability-rule-view.model';
import { mapEffectiveAvailabilityToUpcomingItems, addDays } from './home-availability-format.util';
import {
  HomeDashboardState,
  HomeDashboardVm,
  ReadinessContent,
  ReadinessLevel,
} from 'src/app/core/api/model/home-dashboard.model';
import { UserService } from 'src/app/core/api/services/user.service';
import { ContactsService } from 'src/app/core/api/services/contacts.service';
import { AvailabilityService } from 'src/app/core/api/services/availability.service';
import {
  extractApiError,
  UserFacingApiError,
} from 'src/app/core/api/api-error.util';

interface AvailabilityPreviewResult {
  windows: EffectiveAvailabilityView[];
  warning: string | null;
}

@Injectable({ providedIn: 'root' })
export class HomeDashboardService {
  private readonly userService = inject(UserService);
  private readonly contactsService = inject(ContactsService);
  private readonly availabilityService = inject(AvailabilityService);

  getDashboardState(now: Date = new Date()): Observable<HomeDashboardState> {
    const from = now.toISOString();
    const tomorrowMidnight = addDays(now, 1);
    tomorrowMidnight.setHours(0, 0, 0, 0);
    const to = tomorrowMidnight.toISOString();

    return forkJoin({
      me: this.userService.getMe(),
      contacts: this.contactsService.getContacts(),
      pendingInvitations: this.contactsService.getPendingInvitations(),
      rules: this.availabilityService.getRules(),
      availabilityPreview: this.availabilityService.getEffectiveAvailability(from, to).pipe(
        map((windows): AvailabilityPreviewResult => ({
          windows,
          warning: null,
        })),
        catchError(() =>
          of<AvailabilityPreviewResult>({
            windows: [],
            warning: 'Today’s availability could not be loaded right now.',
          }),
        ),
      ),
    }).pipe(
      map(({ me, contacts, pendingInvitations, rules, availabilityPreview }) => {
        const enabledRules = this.getEnabledRules(rules);
        const hasContacts = contacts.length > 0;
        const hasPendingInvitations = pendingInvitations.length > 0;
        const upcomingAvailability = mapEffectiveAvailabilityToUpcomingItems(
          availabilityPreview.windows,
          me.timezone,
          now,
        );

        const dashboard: HomeDashboardVm = {
          displayName: me.displayName?.trim() || 'there',
          contactsCount: contacts.length,
          pendingInvitationsCount: pendingInvitations.length,
          hasAvailabilityRules: enabledRules.length > 0,
          upcomingAvailability,
        };

        const readinessLevel = this.computeReadinessLevel(
          hasContacts,
          hasPendingInvitations,
        );

        const readinessContent = this.getReadinessContent(readinessLevel);

        return {
          dashboard,
          readinessLevel,
          readinessContent,
          availabilityErrorMessage: availabilityPreview.warning,
        };
      }),
      catchError((error) => {
        console.error('[HomeDashboardService] Failed to load dashboard', error);

        return throwError(() =>
          this.toDashboardLoadError(
            error,
            'We couldn’t load your dashboard right now. Please try again.',
          ),
        );
      }),
    );
  }

  private getEnabledRules(rules: AvailabilityRuleView[]): AvailabilityRuleView[] {
    return rules.filter((rule) => rule.enabled);
  }

  private computeReadinessLevel(
    hasContacts: boolean,
    hasPendingInvitations: boolean,
  ): ReadinessLevel {
    if (!hasContacts) {
      return 'empty';
    }

    return hasPendingInvitations ? 'almost-ready' : 'ready';
  }

  private getReadinessContent(readinessLevel: ReadinessLevel): ReadinessContent {
    switch (readinessLevel) {
      case 'ready':
        return {
          title: 'You’re ready for spontaneous reconnects.',
          subtitle:
            'Your trusted circle is in place, so you can go visible whenever the moment feels right.',
        };

      case 'almost-ready':
        return {
          title: 'You’re almost ready to reconnect spontaneously.',
          subtitle:
            'A small setup step is still missing, but you’re very close to making spontaneous moments easier.',
        };

      case 'empty':
      default:
        return {
          title: 'Let’s get Veya ready.',
          subtitle:
            'A little setup now will help you reconnect naturally when time lines up with your friends.',
        };
    }
  }

  private toDashboardLoadError(
    error: unknown,
    message: string,
  ): UserFacingApiError {
    const apiError = extractApiError(error);
    const dashboardError = new Error(message) as UserFacingApiError;

    if (apiError) {
      dashboardError.code = apiError.code;
      dashboardError.apiError = apiError;
    }

    return dashboardError;
  }
}
