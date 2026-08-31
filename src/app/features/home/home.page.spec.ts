import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';

import { HomePage } from './home.page';
import { HomeDashboardService } from './data/home-dashboard.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthTokens } from 'src/app/core/models/auth-tokens.model';
import { HomeDashboardState } from 'src/app/core/api/model/home-dashboard.model';

describe('HomePage', () => {
  let component: HomePage;
  let homeDashboardService: jasmine.SpyObj<HomeDashboardService>;
  let authState$: BehaviorSubject<AuthTokens | null>;

  const firstAccountTokens = createTokens('first-account-token');

  beforeEach(async () => {
    authState$ = new BehaviorSubject<AuthTokens | null>(firstAccountTokens);

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: HomeDashboardService,
          useValue: jasmine.createSpyObj<HomeDashboardService>(
            'HomeDashboardService',
            ['getDashboardState'],
          ),
        },
        {
          provide: AuthService,
          useValue: {
            authState$: authState$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    homeDashboardService = TestBed.inject(
      HomeDashboardService,
    ) as jasmine.SpyObj<HomeDashboardService>;
  });

  it('should emit loading then success for the authenticated session', (done) => {
    homeDashboardService.getDashboardState.and.returnValue(
      of(createDashboardState('First User')),
    );

    const states: string[] = [];

    component.vmState$.subscribe((state) => {
      states.push(state.kind);

      if (state.kind === 'success') {
        expect(states).toEqual(['loading', 'success']);
        expect(state.data.dashboard.displayName).toBe('First User');
        done();
      }
    });
  });

  it('should reload home data when a new account authenticates', () => {
    const firstResponse$ = new Subject<HomeDashboardState>();
    homeDashboardService.getDashboardState.and.returnValues(
      firstResponse$,
      of(createDashboardState('Second User')),
    );

    const states: Array<{ kind: string; displayName?: string }> = [];
    const sub = component.vmState$.subscribe((state) => {
      states.push({
        kind: state.kind,
        displayName:
          state.kind === 'success'
            ? state.data.dashboard.displayName
            : undefined,
      });
    });

    firstResponse$.next(createDashboardState('First User'));
    authState$.next(null);
    authState$.next(createTokens('second-account-token'));

    expect(homeDashboardService.getDashboardState).toHaveBeenCalledTimes(2);
    expect(states).toEqual([
      { kind: 'loading', displayName: undefined },
      { kind: 'success', displayName: 'First User' },
      { kind: 'loading', displayName: undefined },
      { kind: 'success', displayName: 'Second User' },
    ]);

    sub.unsubscribe();
  });

  it('should refresh when returning to the tab after first entry', () => {
    homeDashboardService.getDashboardState.and.returnValue(
      of(createDashboardState('First User')),
    );

    const sub = component.vmState$.subscribe();
    expect(homeDashboardService.getDashboardState).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(homeDashboardService.getDashboardState).toHaveBeenCalledTimes(1);

    component.ionViewWillEnter();
    expect(homeDashboardService.getDashboardState).toHaveBeenCalledTimes(2);

    sub.unsubscribe();
  });
});

function createTokens(accessToken: string): AuthTokens {
  return {
    accessToken,
    refreshToken: `${accessToken}-refresh`,
    tokenType: 'Bearer',
    expiresInSeconds: 3600,
  };
}

function createDashboardState(displayName: string): HomeDashboardState {
  return {
    dashboard: {
      displayName,
      contactsCount: 0,
      pendingInvitationsCount: 0,
      hasAvailabilityRules: false,
      upcomingAvailability: [],
    },
    readinessLevel: 'empty',
    readinessContent: {
      title: 'Set up Veya',
      subtitle: 'Add contacts and availability.',
    },
    availabilityErrorMessage: null,
  };
}
