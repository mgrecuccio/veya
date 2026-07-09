import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EffectiveAvailabilityView } from 'src/app/core/api/model/effective-availability-view.model';
import { AvailabilityRuleView } from 'src/app/core/api/model/availability-rule-view.model';
import { mapEffectiveAvailabilityToUpcomingItems, addDays } from './home-availability-format.util';
import {
  HomeDashboardState,
  HomeDashboardVm,
  NextBestActionVm,
  ReadinessContent,
  ReadinessLevel,
  SetupChecklistItem,
} from 'src/app/core/api/model/home-dashboard.model';
import { UserService } from 'src/app/core/api/services/user.service';
import { ContactsService } from 'src/app/core/api/services/contacts.service';
import { AvailabilityService } from 'src/app/core/api/services/availability.service';
import { toUserFacingApiError } from 'src/app/core/api/api-error.util';

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
        const hasAvailabilityRules = enabledRules.length > 0;

        const upcomingAvailability = mapEffectiveAvailabilityToUpcomingItems(
          availabilityPreview.windows,
          me.timezone,
          now,
        );

        const dashboard: HomeDashboardVm = {
          displayName: me.displayName?.trim() || 'there',
          contactsCount: contacts.length,
          pendingInvitationsCount: pendingInvitations.length,
          hasAvailabilityRules,
          upcomingAvailability,
        };

        const readinessLevel = this.computeReadinessLevel(
          hasContacts,
          hasPendingInvitations,
        );

        const readinessContent = this.getReadinessContent(readinessLevel);
        const nextBestAction = this.getNextBestAction(
          hasContacts,
          hasPendingInvitations,
        );

        const setupItems = this.getSetupItems(
          hasContacts,
          hasPendingInvitations,
        );

        return {
          dashboard,
          readinessLevel,
          readinessContent,
          nextBestAction,
          setupItems,
          completedSetupItems: setupItems.filter((item) => item.complete).length,
          availabilityErrorMessage: availabilityPreview.warning,
        };
      }),
      catchError((error) => {
        console.error('[HomeDashboardService] Failed to load dashboard', error);

        return throwError(() =>
          toUserFacingApiError(
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

  private getNextBestAction(
    hasContacts: boolean,
    hasPendingInvitations: boolean,
  ): NextBestActionVm {
    if (!hasContacts) {
      return {
        kind: 'contacts',
        kicker: 'Step 1',
        title: 'Add your first contact',
        subtitle:
          'Start your trusted circle so Veya has someone to match with your future availability.',
        route: '/app/contacts',
      };
    }

    if (hasPendingInvitations) {
      return {
        kind: 'invitations',
        kicker: 'Step 2',
        title: 'Review received invitations',
        subtitle:
          'Confirm pending connections so your trusted contacts list stays up to date.',
        route: '/app/contacts',
      };
    }

    return {
      kind: 'ready',
      kicker: 'Ready',
      title: 'You’re all set',
      subtitle: 'Free now stays your main action from here.',
    };
  }

  private getSetupItems(
    hasContacts: boolean,
    hasPendingInvitations: boolean,
  ): SetupChecklistItem[] {
    return [
      {
        key: 'contacts',
        label: 'Add at least 1 contact',
        complete: hasContacts,
      },
      {
        key: 'invitations',
        label: 'Review received invitations',
        complete: !hasPendingInvitations,
      },
    ];
  }  
}
