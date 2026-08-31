import { Injectable, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CapacitorPushPlatformService } from './capacitor-push-platform.service';
import { normalizePushNotificationIntent, PushNotificationIntent } from './push-notification-intent';
import { PushNotificationRefreshService } from './push-notification-refresh.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationRoutingService implements OnDestroy {
  private readonly pushPlatform = inject(CapacitorPushPlatformService);
  private readonly refreshService = inject(PushNotificationRefreshService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.pushPlatform.initializeListeners();

    this.pushPlatform.foregroundNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        const intent = normalizePushNotificationIntent(notification.data);

        if (intent) {
          this.refreshService.notify(intent);
        }
      });

    this.pushPlatform.actions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((action) => {
        const intent = normalizePushNotificationIntent(action.notification.data);

        if (intent) {
          void this.routeToIntent(intent);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async routeToIntent(intent: PushNotificationIntent): Promise<void> {
    await this.router.navigateByUrl('/app/matches');
    this.refreshService.notify(intent);
  }
}
