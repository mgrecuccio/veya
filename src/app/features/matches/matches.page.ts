import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { extractApiError, getApiErrorMessage } from 'src/app/core/api/api-error.util';
import { ChannelType } from 'src/app/core/api/model/channel-type.model';
import { MatchInvitationView } from 'src/app/core/api/model/match-invitation-view.model';
import { SuggestedMatchView } from 'src/app/core/api/model/suggested-match-view.model';
import { MatchesService } from 'src/app/core/api/services/matches.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';

type MatchesPageVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: MatchesPageVm };

type SuggestionsVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: SuggestionsVm };

type IncomingProposalsVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: IncomingProposalsVm };

interface MatchesPageVm {
  matches: AcceptedMatchVm[];
}

interface SuggestionsVm {
  suggestions: SuggestedMatchVm[];
}

interface IncomingProposalsVm {
  proposals: IncomingProposalVm[];
}

interface SuggestedMatchVm {
  candidateUserId: number;
  displayName: string;
  initials: string;
  channelType: ChannelType;
  channelLabel: string;
}

interface AcceptedMatchVm {
  id: number;
  displayName: string;
  initials: string;
  channelLabel: string;
}

interface IncomingProposalVm {
  id: number;
  displayName: string;
  initials: string;
  channelLabel: string;
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
  private readonly appToastService = inject(AppToastService);
  private readonly reload$ = new Subject<void>();
  private readonly suggestionsReload$ = new Subject<void>();
  private readonly incomingReload$ = new Subject<void>();
  private hasEntered = false;

  readonly selectedMatch = signal<AcceptedMatchVm | null>(null);
  readonly contactLinkBusyId = signal<number | null>(null);
  readonly proposalBusyId = signal<number | null>(null);
  readonly incomingBusyId = signal<number | null>(null);
  readonly incomingBusyAction = signal<'accept' | 'decline' | null>(null);

  readonly incomingState$: Observable<IncomingProposalsVmState> = this.incomingReload$.pipe(
    startWith(void 0),
    switchMap(() =>
      this.matchesService.getIncoming().pipe(
        map((proposals): IncomingProposalsVmState => ({
          kind: 'success',
          data: {
            proposals: proposals.map((proposal) => this.mapIncomingProposal(proposal)),
          },
        })),
        startWith<IncomingProposalsVmState>({ kind: 'loading' }),
        catchError((error: unknown) =>
          of<IncomingProposalsVmState>({
            kind: 'error',
            message: getApiErrorMessage(
              error,
              'We could not load match requests right now. Please try again.',
            ),
          }),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly suggestionsState$: Observable<SuggestionsVmState> = this.suggestionsReload$.pipe(
    startWith(void 0),
    switchMap(() =>
      this.matchesService.getSuggestions().pipe(
        map((suggestions): SuggestionsVmState => ({
          kind: 'success',
          data: {
            suggestions: suggestions.map((suggestion) => this.mapSuggestedMatch(suggestion)),
          },
        })),
        startWith<SuggestionsVmState>({ kind: 'loading' }),
        catchError((error: unknown) =>
          of<SuggestionsVmState>({
            kind: 'error',
            message: getApiErrorMessage(
              error,
              'We could not load match suggestions right now. Please try again.',
            ),
          }),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

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
    this.retrySuggestions();
    this.retryIncoming();
  }

  retry(): void {
    this.reload$.next();
  }

  retrySuggestions(): void {
    this.suggestionsReload$.next();
  }

  retryIncoming(): void {
    this.incomingReload$.next();
  }

  proposeMatch(suggestion: SuggestedMatchVm): void {
    if (this.proposalBusyId() !== null) {
      return;
    }

    this.proposalBusyId.set(suggestion.candidateUserId);

    this.matchesService.createMatch({
      candidateUserId: suggestion.candidateUserId,
      channelType: suggestion.channelType,
    }).subscribe({
      next: () => {
        this.proposalBusyId.set(null);
        void this.appToastService.show(
          'Proposal sent.',
          'success',
          'app-toast matches-page-toast',
        );
        this.retrySuggestions();
      },
      error: (error: unknown) => {
        this.proposalBusyId.set(null);
        this.showToast(this.getProposalErrorMessage(error));
      },
    });
  }

  acceptProposal(proposal: IncomingProposalVm): void {
    this.respondToIncomingProposal(proposal, 'accept');
  }

  declineProposal(proposal: IncomingProposalVm): void {
    this.respondToIncomingProposal(proposal, 'decline');
  }

  openMatchDetail(match: AcceptedMatchVm): void {
    this.selectedMatch.set(match);
  }

  closeMatchDetail(): void {
    if (this.contactLinkBusyId() !== null) {
      return;
    }

    this.selectedMatch.set(null);
  }

  openWhatsApp(match: AcceptedMatchVm): void {
    if (this.contactLinkBusyId() !== null) {
      return;
    }

    this.contactLinkBusyId.set(match.id);

    this.matchesService.createContactLink(match.id).subscribe({
      next: (contactLink) => {
        this.contactLinkBusyId.set(null);
        const url = contactLink.url.trim();

        if (!url) {
          this.showToast('WhatsApp is not available for this match right now.');
          return;
        }

        const openedWindow = window.open(url, '_blank');

        if (!openedWindow) {
          this.showToast('We could not open WhatsApp. Make sure it is installed and try again.');
          return;
        }

        openedWindow.opener = null;
      },
      error: (error: unknown) => {
        this.contactLinkBusyId.set(null);
        this.showToast(
          getApiErrorMessage(error, 'We could not open WhatsApp for this match right now.'),
        );
      },
    });
  }

  private mapSuggestedMatch(suggestion: SuggestedMatchView): SuggestedMatchVm {
    const displayName = this.cleanText(suggestion.nickName) || 'Suggested match';

    return {
      candidateUserId: suggestion.candidateUserId,
      displayName,
      initials: this.toInitials(displayName),
      channelType: suggestion.channelType,
      channelLabel: this.formatChannel(suggestion.channelType),
    };
  }

  private mapIncomingProposal(proposal: MatchInvitationView): IncomingProposalVm {
    const displayName = this.getInitiatorDisplayName(proposal) || 'Match request';

    return {
      id: proposal.id,
      displayName,
      initials: this.toInitials(displayName),
      channelLabel: this.formatChannel(proposal.channelType),
    };
  }

  private mapAcceptedMatch(match: MatchInvitationView): AcceptedMatchVm {
    const displayName = this.getInitiatorDisplayName(match) || 'Accepted match';

    return {
      id: match.id,
      displayName,
      initials: this.toInitials(displayName),
      channelLabel: this.formatChannel(match.channelType),
    };
  }

  private respondToIncomingProposal(
    proposal: IncomingProposalVm,
    action: 'accept' | 'decline',
  ): void {
    if (this.incomingBusyId() !== null) {
      return;
    }

    this.incomingBusyId.set(proposal.id);
    this.incomingBusyAction.set(action);
    const request$ =
      action === 'accept'
        ? this.matchesService.acceptMatch(proposal.id)
        : this.matchesService.declineMatch(proposal.id);

    request$.subscribe({
      next: () => {
        this.incomingBusyId.set(null);
        this.incomingBusyAction.set(null);
        void this.appToastService.show(
          action === 'accept' ? 'Proposal accepted.' : 'Proposal declined.',
          'success',
          'app-toast matches-page-toast',
        );
        this.retryIncoming();

        if (action === 'accept') {
          this.retry();
        }
      },
      error: (error: unknown) => {
        this.incomingBusyId.set(null);
        this.incomingBusyAction.set(null);
        this.showToast(this.getIncomingActionErrorMessage(error, action));

        if (this.shouldRefreshIncomingAfterActionError(error)) {
          this.retryIncoming();
        }
      },
    });
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

  private getInitiatorDisplayName(match: MatchInvitationView): string | null {
    const rawMatch = match as MatchInvitationView & Record<string, unknown>;

    return (
      this.cleanText(match.initiatorDisplayName) ||
      this.cleanText(rawMatch['initiator_display_name']) ||
      this.cleanText(rawMatch['initiatorName']) ||
      this.cleanText(rawMatch['initiatorNickName']) ||
      this.cleanText(rawMatch['initiatorNickname']) ||
      null
    );
  }

  private cleanText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const cleanValue = value.trim();

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

  private getProposalErrorMessage(error: unknown): string {
    const apiError = extractApiError(error);

    switch (apiError?.code) {
      case 'MATCH_ALREADY_EXISTS':
      case 'DUPLICATE_MATCH_PROPOSAL':
        return apiError.message || 'You already have a proposal for this suggestion.';
      case 'MATCH_SCORE_BELOW_THRESHOLD':
        return apiError.message || 'This suggestion is no longer available.';
      case 'PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION':
        return apiError.message || 'Add your phone number before sending a proposal.';
      default:
        return getApiErrorMessage(error, 'We could not send this proposal right now.');
    }
  }

  private getIncomingActionErrorMessage(error: unknown, action: 'accept' | 'decline'): string {
    const apiError = extractApiError(error);

    switch (apiError?.code) {
      case 'MATCH_PROPOSAL_EXPIRED':
        return apiError.message || 'This proposal is no longer available.';
      case 'PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE':
        return apiError.message || 'Add your phone number before accepting this proposal.';
      default:
        return getApiErrorMessage(
          error,
          action === 'accept'
            ? 'We could not accept this proposal right now.'
            : 'We could not decline this proposal right now.',
        );
    }
  }

  private shouldRefreshIncomingAfterActionError(error: unknown): boolean {
    const apiError = extractApiError(error);

    return apiError?.code === 'MATCH_PROPOSAL_EXPIRED';
  }

  private showToast(message: string): void {
    void this.appToastService.show(message, 'danger', 'app-toast matches-page-toast');
  }
}
