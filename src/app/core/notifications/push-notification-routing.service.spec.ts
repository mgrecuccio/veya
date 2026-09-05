import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Subject } from 'rxjs';
import { CapacitorPushPlatformService } from './capacitor-push-platform.service';
import { PushNotificationRefreshService } from './push-notification-refresh.service';
import { PushNotificationRoutingService } from './push-notification-routing.service';

describe('PushNotificationRoutingService', () => {
  let service: PushNotificationRoutingService;
  let foreground$: Subject<PushNotificationSchema>;
  let actions$: Subject<ActionPerformed>;
  let refreshService: jasmine.SpyObj<PushNotificationRefreshService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    foreground$ = new Subject<PushNotificationSchema>();
    actions$ = new Subject<ActionPerformed>();

    TestBed.configureTestingModule({
      providers: [
        PushNotificationRoutingService,
        {
          provide: CapacitorPushPlatformService,
          useValue: jasmine.createSpyObj<CapacitorPushPlatformService>(
            'CapacitorPushPlatformService',
            ['initializeListeners'],
            {
              foregroundNotifications$: foreground$.asObservable(),
              actions$: actions$.asObservable(),
            },
          ),
        },
        {
          provide: PushNotificationRefreshService,
          useValue: jasmine.createSpyObj<PushNotificationRefreshService>(
            'PushNotificationRefreshService',
            ['notify'],
          ),
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj<Router>(
            'Router',
            ['navigateByUrl'],
          ),
        },
      ],
    });

    service = TestBed.inject(PushNotificationRoutingService);
    refreshService = TestBed.inject(PushNotificationRefreshService) as jasmine.SpyObj<PushNotificationRefreshService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    router.navigateByUrl.and.returnValue(Promise.resolve(true));
  });

  it('should refresh current backend state for foreground notifications', () => {
    service.initialize();

    foreground$.next(mockNotification({
      type: 'MATCH_SUGGESTIONS_AVAILABLE',
    }));

    expect(refreshService.notify).toHaveBeenCalledWith({
      type: 'MATCH_SUGGESTIONS_AVAILABLE',
      matchId: undefined,
    });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should route notification taps to matches and refresh backend state', async () => {
    service.initialize();

    actions$.next({
      actionId: 'tap',
      notification: mockNotification({
        type: 'MATCH_PROPOSAL_ACCEPTED',
        matchId: '42',
      }),
    });
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/matches');
    expect(refreshService.notify).toHaveBeenCalledWith({
      type: 'MATCH_PROPOSAL_ACCEPTED',
      matchId: 42,
    });
  });

  function mockNotification(data: Record<string, unknown>): PushNotificationSchema {
    return {
      id: 'notification-id',
      data,
    };
  }
});
