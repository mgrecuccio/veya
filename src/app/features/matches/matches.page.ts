import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { getApiErrorMessage } from 'src/app/core/api/api-error.util';
import { ChannelType } from 'src/app/core/api/model/channel-type.model';
import { MatchInvitationView } from 'src/app/core/api/model/match-invitation-view.model';
import { MatchesService } from 'src/app/core/api/services/matches.service';

type MatchesPageVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: MatchesPageVm };

interface MatchesPageVm {
  matches: AcceptedMatchVm[];
}

interface AcceptedMatchVm {
  id: number;
  displayName: string;
  initials: string;
  channelLabel: string;
  statusLabel: string;
  overlapLabel: string;
  createdLabel: string;
  respondedLabel: string | null;
}

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchesPage {
  private readonly matchesService = inject(MatchesService);
  private readonly reload$ = new Subject<void>();
  private hasEntered = false;

  readonly vmState$: Observable<MatchesPageVmState> = this.reload$.pipe(
    startWith(void 0),
    switchMap(() =>
      this.matchesService.getAccepted().pipe(
        map((matches): MatchesPageVmState => ({
          kind: 'success',
          data: {
            matches: matches.map((match) => this.mapAcceptedMatch(match)),
          },
        })),
        startWith<MatchesPageVmState>({ kind: 'loading' }),
        catchError((error: unknown) =>
          of<MatchesPageVmState>({
            kind: 'error',
            message: getApiErrorMessage(
              error,
              'We could not load your accepted matches right now. Please try again.',
            ),
          }),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ionViewWillEnter(): void {
    if (!this.hasEntered) {
      this.hasEntered = true;
      return;
    }

    this.retry();
  }

  retry(): void {
    this.reload$.next();
  }

  private mapAcceptedMatch(match: MatchInvitationView): AcceptedMatchVm {
    const displayName = this.cleanText(match.initiatorDisplayName) || 'Accepted match';

    return {
      id: match.id,
      displayName,
      initials: this.toInitials(displayName),
      channelLabel: this.formatChannel(match.channelType),
      statusLabel: this.formatStatus(match.status),
      overlapLabel: this.formatOverlap(match.overlapStart, match.overlapEnd),
      createdLabel: this.formatDateTime(match.createdAt),
      respondedLabel: match.respondedAt ? this.formatDateTime(match.respondedAt) : null,
    };
  }

  private formatChannel(channel: ChannelType): string {
    switch (channel) {
      case 'CHAT':
        return 'Chat';
      case 'CALL':
        return 'Call';
      default:
        return this.formatStatus(channel);
    }
  }

  private formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Accepted';
  }

  private formatOverlap(startValue: string, endValue: string): string {
    const start = this.parseDate(startValue);
    const end = this.parseDate(endValue);

    if (!start || !end) {
      return 'Overlap time unavailable';
    }

    const dateLabel = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(start);
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${dateLabel}, ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  }

  private formatDateTime(value: string): string {
    const date = this.parseDate(value);

    if (!date) {
      return 'Recently';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  private parseDate(value: string): Date | null {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private cleanText(value: string | null | undefined): string | null {
    const cleanValue = value?.trim();

    return cleanValue ? cleanValue : null;
  }

  private toInitials(value: string): string {
    const words = value
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (words.length === 0) {
      return 'AM';
    }

    return words.map((word) => word.charAt(0).toUpperCase()).join('');
  }
}
