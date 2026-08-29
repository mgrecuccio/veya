import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatchInvitationView } from 'src/app/core/api/model/match-invitation-view.model';
import { MatchesService } from 'src/app/core/api/services/matches.service';
import { AppToastService } from 'src/app/shared/toast/app-toast.service';
import { MatchesPage } from './matches.page';

describe('MatchesPage', () => {
  let fixture: ComponentFixture<MatchesPage>;
  let component: MatchesPage;
  let matchesService: jasmine.SpyObj<MatchesService>;
  let appToastService: jasmine.SpyObj<AppToastService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [
        provideRouter([]),
        {
          provide: MatchesService,
          useValue: jasmine.createSpyObj<MatchesService>(
            'MatchesService',
            ['getAccepted', 'createContactLink'],
          ),
        },
        {
          provide: AppToastService,
          useValue: jasmine.createSpyObj<AppToastService>(
            'AppToastService',
            ['show'],
          ),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
    matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
    appToastService.show.and.returnValue(Promise.resolve());
  });

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
      overlapStart: '2026-06-12T12:00:00Z',
      overlapEnd: '2026-06-12T13:30:00Z',
      createdAt: '2026-06-12T10:00:00Z',
      respondedAt: '2026-06-12T11:00:00Z',
      ...overrides,
    };
  }

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
        expect(state.data.matches[0].statusLabel).toBe('Accepted');
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
    expect(text).toContain('Accepted - Chat');
    expect(text).toContain('Accepted - Call');
  });

  it('should open accepted match detail from the list', () => {
    matchesService.getAccepted.and.returnValue(of([mockAcceptedMatch()]));

    fixture.detectChanges();

    const matchButton = fixture.nativeElement.querySelector('.match-item') as HTMLButtonElement;
    matchButton.click();
    fixture.detectChanges();

    expect(component.selectedMatch()?.displayName).toBe('Alex Morgan');
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
      statusLabel: 'Accepted',
      overlapLabel: 'Jun 12, 12:00 PM - 1:30 PM',
      createdLabel: 'Jun 12, 10:00 AM',
      respondedLabel: 'Jun 12, 11:00 AM',
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
      statusLabel: 'Accepted',
      overlapLabel: 'Jun 12, 12:00 PM - 1:30 PM',
      createdLabel: 'Jun 12, 10:00 AM',
      respondedLabel: 'Jun 12, 11:00 AM',
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
      statusLabel: 'Accepted',
      overlapLabel: 'Jun 12, 12:00 PM - 1:30 PM',
      createdLabel: 'Jun 12, 10:00 AM',
      respondedLabel: 'Jun 12, 11:00 AM',
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
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(matchesService.getAccepted).toHaveBeenCalledTimes(2);

    sub.unsubscribe();
  });
});
