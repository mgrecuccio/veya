import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatchInvitationView } from 'src/app/core/api/model/match-invitation-view.model';
import { SuggestedMatchView } from 'src/app/core/api/model/suggested-match-view.model';
import { MatchesService } from 'src/app/core/api/services/matches.service';
import { UserService } from 'src/app/core/api/services/user.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { PhoneNumberSetupService } from 'src/app/shared/phone/phone-number-setup.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { MatchesPage } from './matches.page';

describe('MatchesPage', () => {
  let fixture: ComponentFixture<MatchesPage>;
  let component: MatchesPage;
  let matchesService: jasmine.SpyObj<MatchesService>;
  let userService: jasmine.SpyObj<UserService>;
  let phoneNumberSetupService: PhoneNumberSetupService;
  let appToastService: jasmine.SpyObj<AppToastService>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [
        provideRouter([]),
        {
          provide: MatchesService,
          useValue: jasmine.createSpyObj<MatchesService>(
            'MatchesService',
            [
              'getSuggestions',
              'getIncoming',
              'getAccepted',
              'createMatch',
              'acceptMatch',
              'declineMatch',
              'createContactLink',
            ],
          ),
        },
        {
          provide: AppToastService,
          useValue: jasmine.createSpyObj<AppToastService>(
            'AppToastService',
            ['show'],
          ),
        },
        {
          provide: UserService,
          useValue: jasmine.createSpyObj<UserService>(
            'UserService',
            ['getMe'],
          ),
        },
        {
          provide: AuthService,
          useValue: {
            authState$: of(createAuthTokens()),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
    matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    phoneNumberSetupService = TestBed.inject(PhoneNumberSetupService);
    appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
    router = TestBed.inject(Router);
    matchesService.getSuggestions.and.returnValue(of([]));
    matchesService.getIncoming.and.returnValue(of([]));
    matchesService.getAccepted.and.returnValue(of([]));
    userService.getMe.and.returnValue(of({
      id: 1,
      displayName: 'Marco',
      timezone: 'Europe/Brussels',
      email: 'marco@example.com',
      phoneNumber: '+32470000000',
      status: 'ACTIVE',
    }));
    appToastService.show.and.returnValue(Promise.resolve());
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  });

  function mockSuggestion(
    overrides: Partial<SuggestedMatchView> = {},
  ): SuggestedMatchView {
    return {
      candidateUserId: 9,
      nickName: 'Jamie',
      channelType: 'CALL',
      ...overrides,
    };
  }

  function mockAcceptedMatch(
    overrides: Partial<MatchInvitationView> = {},
  ): MatchInvitationView {
    return {
      id: 42,
      initiatorUserId: 7,
      initiatorDisplayName: 'Alex Morgan',
      channelType: 'CHAT',
      status: 'ACCEPTED',
      score: 94,
      createdAt: '2026-06-12T10:00:00Z',
      respondedAt: '2026-06-12T11:00:00Z',
      ...overrides,
    };
  }

  function mockIncomingProposal(
    overrides: Partial<MatchInvitationView> = {},
  ): MatchInvitationView {
    return {
      id: 31,
      initiatorUserId: 11,
      initiatorDisplayName: 'Riley Chen',
      channelType: 'CALL',
      status: 'PROPOSED',
      score: 91,
      createdAt: '2026-06-12T09:00:00Z',
      respondedAt: null,
      ...overrides,
    };
  }

  it('should emit loading then success with incoming proposals', (done) => {
    matchesService.getIncoming.and.returnValue(of([mockIncomingProposal()]));
    const states: string[] = [];

    component.incomingState$.subscribe((state) => {
      states.push(state.kind);

      if (state.kind === 'success') {
        expect(states).toEqual(['loading', 'success']);
        expect(state.data.proposals.length).toBe(1);
        expect(state.data.proposals[0].displayName).toBe('Riley Chen');
        expect(state.data.proposals[0].initials).toBe('RC');
        expect(state.data.proposals[0].channelLabel).toBe('Call');
        done();
      }
    });
  });

  it('should render match requests above suggestions and accepted matches', () => {
    matchesService.getIncoming.and.returnValue(of([mockIncomingProposal()]));
    matchesService.getSuggestions.and.returnValue(of([mockSuggestion()]));
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const cardTitles = Array.from(
      fixture.nativeElement.querySelectorAll('.card-title'),
      (element: Element) => element.textContent?.trim(),
    );
    expect(cardTitles).toEqual(['Match requests', 'Suggested matches', 'Accepted matches']);
    expect(text).toContain('Riley Chen');
    expect(text).toContain('Jamie');
    expect(text).toContain('Alex Morgan');

    const declineButton = fixture.nativeElement.querySelector('.decline-button') as HTMLElement;
    const acceptButton = fixture.nativeElement.querySelector('.accept-button') as HTMLElement;
    expect(declineButton.textContent?.trim()).toBe('');
    expect(acceptButton.textContent?.trim()).toBe('');
    expect(declineButton.getAttribute('aria-label')).toBe('Decline match request');
    expect(acceptButton.getAttribute('aria-label')).toBe('Accept match request');
  });

  it('should render initiator display name when backend returns a snake case key', () => {
    matchesService.getIncoming.and.returnValue(of([
      {
        id: 31,
        initiatorUserId: 11,
        initiatorDisplayName: '',
        initiator_display_name: 'Maya Rao',
        channelType: 'CHAT',
        status: 'PROPOSED',
        score: 91,
        createdAt: '2026-06-12T09:00:00Z',
        respondedAt: null,
      } as MatchInvitationView & { initiator_display_name: string },
    ]));

    fixture.detectChanges();

    const matchName = fixture.nativeElement.querySelector('.incoming-item .match-name') as HTMLElement;
    expect(matchName.textContent?.trim()).toBe('Maya Rao');
  });

  it('should render the empty state when no incoming proposals are returned', () => {
    matchesService.getIncoming.and.returnValue(of([]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No match requests are waiting right now.');
    expect(text).toContain('Match requests');
  });

  it('should render incoming errors without hiding suggestions or accepted matches', () => {
    matchesService.getIncoming.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: {
          message: 'Incoming proposals are unavailable.',
        },
      })),
    );
    matchesService.getSuggestions.and.returnValue(of([mockSuggestion()]));
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Incoming proposals are unavailable.');
    expect(text).toContain('Suggested matches');
    expect(text).toContain('Accepted matches');
  });

  it('should emit loading then success with suggested matches', (done) => {
    matchesService.getSuggestions.and.returnValue(of([mockSuggestion()]));
    const states: string[] = [];

    component.suggestionsState$.subscribe((state) => {
      states.push(state.kind);

      if (state.kind === 'success') {
        expect(states).toEqual(['loading', 'success']);
        expect(state.data.suggestions.length).toBe(1);
        expect(state.data.suggestions[0].displayName).toBe('Jamie');
        expect(state.data.suggestions[0].initials).toBe('J');
        expect(state.data.suggestions[0].channelLabel).toBe('Call');
        done();
      }
    });
  });

  it('should render backend suggestions above accepted matches', () => {
    matchesService.getSuggestions.and.returnValue(of([
      mockSuggestion(),
      mockSuggestion({
        candidateUserId: 10,
        nickName: 'Taylor',
        channelType: 'CHAT',
      }),
    ]));
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const cardTitles = Array.from(
      fixture.nativeElement.querySelectorAll('.card-title'),
      (element: Element) => element.textContent?.trim(),
    );
    expect(cardTitles).toEqual(['Match requests', 'Suggested matches', 'Accepted matches']);
    expect(text).toContain('Jamie');
    expect(text).toContain('Taylor');
    expect(text).toContain('Call');
    expect(text).toContain('Chat');
    expect(text).not.toContain('88');
    expect(text).not.toContain('260');
    expect(text).not.toContain('0.74');
    expect(text).not.toContain('Favorite');
    expect(text).not.toContain('Jun 12');
    expect(text).not.toContain('3:00 PM');
    expect(text).toContain('Propose');
  });

  it('should render the empty state when no suggestions are returned', () => {
    matchesService.getSuggestions.and.returnValue(of([]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No suggestions are available right now.');
    expect(text).toContain('Suggested matches');
  });

  it('should render suggestion errors without hiding accepted matches', () => {
    matchesService.getSuggestions.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: {
          message: 'Suggestions are unavailable.',
        },
      })),
    );
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Suggestions are unavailable.');
    expect(text).toContain('Accepted matches');
    expect(text).toContain('Alex Morgan');
  });

  it('should show loading while suggestions are pending', () => {
    const suggestions$ = new Subject<SuggestedMatchView[]>();
    matchesService.getSuggestions.and.returnValue(suggestions$);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Loading match suggestions...');
    suggestions$.complete();
  });

  it('should create a proposal with only candidate id and channel type then refresh suggestions', fakeAsync(() => {
    matchesService.createMatch.and.returnValue(of({
      id: 77,
      candidateUserId: 9,
      channelType: 'CALL',
      status: 'PROPOSED',
      score: 88,
      createdAt: '2026-06-12T14:00:00Z',
      respondedAt: null,
    }));
    const sub = component.suggestionsState$.subscribe();

    component.proposeMatch({
      candidateUserId: 9,
      displayName: 'Jamie',
      initials: 'J',
      channelType: 'CALL',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.createMatch).toHaveBeenCalledOnceWith({
      candidateUserId: 9,
      channelType: 'CALL',
    });
    expect(matchesService.getSuggestions).toHaveBeenCalledTimes(2);
    expect(appToastService.show).toHaveBeenCalledWith(
      'Proposal sent.',
      'success',
      'app-toast matches-page-toast',
    );

    sub.unsubscribe();
  }));

  it('should route to phone setup before creating a proposal when the profile has no phone number', fakeAsync(() => {
    userService.getMe.and.returnValue(of({
      id: 1,
      displayName: 'Marco',
      timezone: 'Europe/Brussels',
      email: 'marco@example.com',
      phoneNumber: null,
      status: 'ACTIVE',
    }));

    component.proposeMatch({
      candidateUserId: 9,
      displayName: 'Jamie',
      initials: 'J',
      channelType: 'CALL',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.createMatch).not.toHaveBeenCalled();
    expect(phoneNumberSetupService.consumePendingAction()).toEqual({
      kind: 'proposal',
      candidateUserId: 9,
      channelType: 'CALL',
      returnUrl: '/app/matches',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/settings?setup=phone&action=proposal');
  }));

  it('should route to phone setup when proposal creation returns a phone-required error', fakeAsync(() => {
    matchesService.createMatch.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          code: 'PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION',
          message: 'Add your phone number before sending a proposal.',
        },
      })),
    );

    component.proposeMatch({
      candidateUserId: 9,
      displayName: 'Jamie',
      initials: 'J',
      channelType: 'CALL',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(phoneNumberSetupService.consumePendingAction()).toEqual({
      kind: 'proposal',
      candidateUserId: 9,
      channelType: 'CALL',
      returnUrl: '/app/matches',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/settings?setup=phone&action=proposal');
    expect(appToastService.show).not.toHaveBeenCalled();
  }));

  it('should use backend error codes for duplicate proposal errors', fakeAsync(() => {
    matchesService.createMatch.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          code: 'MATCH_ALREADY_EXISTS',
          message: 'A proposal already exists for this suggestion.',
        },
      })),
    );

    component.proposeMatch({
      candidateUserId: 9,
      displayName: 'Jamie',
      initials: 'J',
      channelType: 'CALL',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(appToastService.show).toHaveBeenCalledWith(
      'A proposal already exists for this suggestion.',
      'danger',
      'app-toast matches-page-toast',
    );
  }));

  it('should accept an incoming proposal then refresh incoming and accepted matches', fakeAsync(() => {
    matchesService.acceptMatch.and.returnValue(of({
      id: 31,
      candidateUserId: 2,
      channelType: 'CALL',
      status: 'ACCEPTED',
      score: 91,
      createdAt: '2026-06-12T09:00:00Z',
      respondedAt: '2026-06-12T09:05:00Z',
    }));
    const incomingSub = component.incomingState$.subscribe();
    const acceptedSub = component.vmState$.subscribe();

    component.acceptProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.acceptMatch).toHaveBeenCalledOnceWith(31);
    expect(matchesService.getIncoming).toHaveBeenCalledTimes(2);
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(2);
    expect(appToastService.show).toHaveBeenCalledWith(
      'Proposal accepted.',
      'success',
      'app-toast matches-page-toast',
    );

    incomingSub.unsubscribe();
    acceptedSub.unsubscribe();
  }));

  it('should route to phone setup before accepting a proposal when the profile has no phone number', fakeAsync(() => {
    userService.getMe.and.returnValue(of({
      id: 1,
      displayName: 'Marco',
      timezone: 'Europe/Brussels',
      email: 'marco@example.com',
      phoneNumber: '',
      status: 'ACTIVE',
    }));

    component.acceptProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.acceptMatch).not.toHaveBeenCalled();
    expect(phoneNumberSetupService.consumePendingAction()).toEqual({
      kind: 'acceptance',
      proposalId: 31,
      returnUrl: '/app/matches',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/settings?setup=phone&action=acceptance');
  }));

  it('should route to phone setup when proposal acceptance returns a phone-required error', fakeAsync(() => {
    matchesService.acceptMatch.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          code: 'PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE',
          message: 'Add your phone number before accepting this proposal.',
        },
      })),
    );

    component.acceptProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(phoneNumberSetupService.consumePendingAction()).toEqual({
      kind: 'acceptance',
      proposalId: 31,
      returnUrl: '/app/matches',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/settings?setup=phone&action=acceptance');
    expect(appToastService.show).not.toHaveBeenCalled();
  }));

  it('should decline an incoming proposal then refresh incoming proposals only', fakeAsync(() => {
    matchesService.declineMatch.and.returnValue(of({
      id: 31,
      candidateUserId: 2,
      channelType: 'CALL',
      status: 'DECLINED',
      score: 91,
      createdAt: '2026-06-12T09:00:00Z',
      respondedAt: '2026-06-12T09:05:00Z',
    }));
    const incomingSub = component.incomingState$.subscribe();
    const acceptedSub = component.vmState$.subscribe();

    component.declineProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.declineMatch).toHaveBeenCalledOnceWith(31);
    expect(matchesService.getIncoming).toHaveBeenCalledTimes(2);
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);
    expect(appToastService.show).toHaveBeenCalledWith(
      'Proposal declined.',
      'success',
      'app-toast matches-page-toast',
    );

    incomingSub.unsubscribe();
    acceptedSub.unsubscribe();
  }));

  it('should refresh incoming proposals after an expired proposal error', fakeAsync(() => {
    matchesService.acceptMatch.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          code: 'MATCH_PROPOSAL_EXPIRED',
          message: 'This proposal has expired.',
        },
      })),
    );
    const incomingSub = component.incomingState$.subscribe();

    component.acceptProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(matchesService.getIncoming).toHaveBeenCalledTimes(2);
    expect(appToastService.show).toHaveBeenCalledWith(
      'This proposal has expired.',
      'danger',
      'app-toast matches-page-toast',
    );

    incomingSub.unsubscribe();
  }));

  it('should surface candidate authorization errors for incoming actions', fakeAsync(() => {
    matchesService.declineMatch.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 403,
        error: {
          message: 'Only the candidate can decline this proposal.',
        },
      })),
    );

    component.declineProposal({
      id: 31,
      displayName: 'Riley Chen',
      initials: 'RC',
      channelLabel: 'Call',
    });
    flushMicrotasks();

    expect(appToastService.show).toHaveBeenCalledWith(
      'Only the candidate can decline this proposal.',
      'danger',
      'app-toast matches-page-toast',
    );
  }));

  it('should emit loading then success with accepted matches', (done) => {
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));
    const states: string[] = [];

    component.vmState$.subscribe((state) => {
      states.push(state.kind);

      if (state.kind === 'success') {
        expect(states).toEqual(['loading', 'success']);
        expect(state.data.matches.length).toBe(1);
        expect(state.data.matches[0].displayName).toBe('Alex Morgan');
        expect(state.data.matches[0].initials).toBe('AM');
        expect(state.data.matches[0].channelLabel).toBe('Chat');
        done();
      }
    });
  });

  it('should render backend accepted matches and count', () => {
    matchesService.getAccepted.and.returnValue(of([
      mockAcceptedMatch(),
      mockAcceptedMatch({
        id: 43,
        initiatorDisplayName: 'Sam Rivera',
        channelType: 'CALL',
        respondedAt: null,
      }),
    ]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Accepted matches');
    expect(text).toContain('2');
    expect(text).toContain('Alex Morgan');
    expect(text).toContain('Sam Rivera');
    expect(text).toContain('Chat');
    expect(text).toContain('Call');
    expect(text).not.toContain('Accepted - Chat');
    expect(text).not.toContain('Accepted - Call');
    expect(text).not.toContain('Created Jun 12');
  });

  it('should open accepted match detail from the list', () => {
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const matchButton = fixture.nativeElement.querySelector('.match-summary-button') as HTMLButtonElement;
    matchButton.click();
    fixture.detectChanges();

    expect(component.selectedMatch()?.displayName).toBe('Alex Morgan');
  });

  it('should open WhatsApp when the accepted match WhatsApp icon is clicked', () => {
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));
    matchesService.createContactLink.and.returnValue(of({
      type: 'WHATSAPP',
      url: 'https://backend.example/contact-link/42',
      expiresAt: '2026-06-12T12:00:00Z',
    }));
    const openSpy = spyOn(window, 'open').and.returnValue(window);

    fixture.detectChanges();

    const matchButton = fixture.nativeElement.querySelector('.match-contact-button') as HTMLButtonElement;
    const matchIcon = matchButton.querySelector('ion-icon') as HTMLElement;
    expect(matchButton.getAttribute('aria-label')).toBe('Open WhatsApp');
    expect(matchIcon.getAttribute('name')).toBe('logo-whatsapp');

    matchButton.click();
    fixture.detectChanges();

    expect(component.selectedMatch()).toBeNull();
    expect(matchesService.createContactLink).toHaveBeenCalledOnceWith(42);
    expect(openSpy).toHaveBeenCalledOnceWith(
      'https://backend.example/contact-link/42',
      '_blank',
    );
  });

  it('should request the backend contact link and open the returned URL', () => {
    const match = mockAcceptedMatch();
    matchesService.createContactLink.and.returnValue(of({
      type: 'WHATSAPP',
      url: 'https://backend.example/contact-link/42',
      expiresAt: '2026-06-12T12:00:00Z',
    }));
    const openSpy = spyOn(window, 'open').and.returnValue(window);

    component.openWhatsApp({
      id: match.id,
      displayName: match.initiatorDisplayName,
      initials: 'AM',
      channelLabel: 'Chat',
    });

    expect(matchesService.createContactLink).toHaveBeenCalledOnceWith(42);
    expect(openSpy).toHaveBeenCalledOnceWith(
      'https://backend.example/contact-link/42',
      '_blank',
    );
    expect(appToastService.show).not.toHaveBeenCalled();
  });

  it('should show an error when the contact link cannot be opened', fakeAsync(() => {
    matchesService.createContactLink.and.returnValue(of({
      type: 'WHATSAPP',
      url: 'https://backend.example/contact-link/42',
      expiresAt: '2026-06-12T12:00:00Z',
    }));
    spyOn(window, 'open').and.returnValue(null);

    component.openWhatsApp({
      id: 42,
      displayName: 'Alex Morgan',
      initials: 'AM',
      channelLabel: 'Chat',
    });
    flushMicrotasks();

    expect(appToastService.show).toHaveBeenCalledWith(
      'We could not open WhatsApp. Make sure it is installed and try again.',
      'danger',
      'app-toast matches-page-toast',
    );
  }));

  it('should show backend errors when contact link creation fails', fakeAsync(() => {
    matchesService.createContactLink.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          message: 'Add your phone number before contacting this match.',
        },
      })),
    );
    const openSpy = spyOn(window, 'open');

    component.openWhatsApp({
      id: 42,
      displayName: 'Alex Morgan',
      initials: 'AM',
      channelLabel: 'Chat',
    });
    flushMicrotasks();

    expect(openSpy).not.toHaveBeenCalled();
    expect(appToastService.show).toHaveBeenCalledWith(
      'Add your phone number before contacting this match.',
      'danger',
      'app-toast matches-page-toast',
    );
  }));

  it('should render the empty state when no accepted matches are returned', () => {
    matchesService.getAccepted.and.returnValue(of([]));

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Accepted matches will appear here after both required consents exist.');
    expect(text).toContain('0');
  });

  it('should render backend error messages without breaking the page', () => {
    matchesService.getAccepted.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: {
          message: 'Matches are unavailable.',
        },
      })),
    );

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Accepted matches');
    expect(text).toContain('Matches are unavailable.');
    expect(text).toContain('Retry');
  });

  it('should reload when retry is called', () => {
    matchesService.getAccepted.and.returnValue(of([]));

    const sub = component.vmState$.subscribe();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);

    component.retry();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(2);

    sub.unsubscribe();
  });

  it('should show loading while accepted matches are pending', () => {
    const acceptedMatches$ = new Subject<MatchInvitationView[]>();
    matchesService.getAccepted.and.returnValue(acceptedMatches$);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Loading accepted matches...');
    acceptedMatches$.complete();
  });

  it('should refresh when returning to the tab after first entry', () => {
    matchesService.getAccepted.and.returnValue(of([]));

    const sub = component.vmState$.subscribe();
    const suggestionsSub = component.suggestionsState$.subscribe();
    const incomingSub = component.incomingState$.subscribe();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);
    expect(matchesService.getSuggestions).toHaveBeenCalledTimes(1);
    expect(matchesService.getIncoming).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);
    expect(matchesService.getSuggestions).toHaveBeenCalledTimes(1);
    expect(matchesService.getIncoming).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(2);
    expect(matchesService.getSuggestions).toHaveBeenCalledTimes(2);
    expect(matchesService.getIncoming).toHaveBeenCalledTimes(2);

    sub.unsubscribe();
    suggestionsSub.unsubscribe();
    incomingSub.unsubscribe();
  });
});

function createAuthTokens() {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresInSeconds: 3600,
  };
}
