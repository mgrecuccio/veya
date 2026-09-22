import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { EMPTY, Subject, firstValueFrom, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, mapTo, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { NotificationDevicesService } from '../api/services/notification-devices.service';
import { DeviceTokenPlatform } from '../api/request/register-device-token.request';
import { UserService } from '../api/services/user.service';
import { AuthService } from '../auth/auth.service';
import { CapacitorPushPlatformService, PushDeviceToken, PushPermissionState } from './capacitor-push-platform.service';

export type PushRegistrationStatus =
  | 'idle'
  | 'unsupported'
  | 'permission-prompt'
  | 'permission-denied'
  | 'registering'
  | 'registered'
  | 'disabled'
  | 'error';

export interface PushReconciliationOptions {
  requestPermission?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PushRegistrationReconciliationService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly devicesService = inject(NotificationDevicesService);
  private readonly pushPlatform = inject(CapacitorPushPlatformService);
  private readonly destroy$ = new Subject<void>();
  private appStateListener: Promise<PluginListenerHandle> | null = null;
  private initialized = false;

  readonly permissionState = signal<PushPermissionState>('unsupported');
  readonly registrationStatus = signal<PushRegistrationStatus>('idle');

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.pushPlatform.initializeListeners();

    this.pushPlatform.tokens$
      .pipe(takeUntil(this.destroy$))
      .subscribe((deviceToken) => this.registerBackendDevice(deviceToken));

    this.authService.authState$
      .pipe(
        map((tokens) => !!tokens?.accessToken),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          void this.reconcile();
          return;
        }

        this.registrationStatus.set('idle');
      });

    this.appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void this.reconcile();
      }
    });
  }

  async refreshPermissionState(): Promise<PushPermissionState> {
    const permission = await this.pushPlatform.checkPermission();
    this.permissionState.set(permission);
    return permission;
  }

  async requestPermission(): Promise<PushPermissionState> {
    let permission = await this.pushPlatform.checkPermission();

    if (permission === 'prompt' || permission === 'prompt-with-rationale') {
      permission = await this.pushPlatform.requestPermission();
    }

    this.permissionState.set(permission);
    return permission;
  }

  getDevicePlatform(): DeviceTokenPlatform {
    return this.pushPlatform.getDevicePlatform();
  }

  async reconcile(options: PushReconciliationOptions = {}): Promise<void> {
    if (!this.authService.getAccessToken()) {
      this.registrationStatus.set('idle');
      return;
    }

    let stage = 'backend-registration';

    try {
      const preferences = await firstValueFrom(this.userService.getPreferences().pipe(take(1)));

      if (!preferences.pushNotificationsEnabled) {
        await this.disableCurrentDevice();
        this.registrationStatus.set('disabled');
        return;
      }

      stage = 'permission-check';
      let permission = await this.pushPlatform.checkPermission();

      if (
        options.requestPermission &&
        (permission === 'prompt' || permission === 'prompt-with-rationale')
      ) {
        stage = 'permission-request';
        permission = await this.pushPlatform.requestPermission();
      }

      this.permissionState.set(permission);

      if (permission === 'unsupported') {
        this.registrationStatus.set('unsupported');
        return;
      }

      if (permission === 'denied') {
        this.registrationStatus.set('permission-denied');
        return;
      }

      if (permission !== 'granted') {
        this.registrationStatus.set('permission-prompt');
        return;
      }

      this.registrationStatus.set('registering');
      stage = 'apns-registration';
      await this.pushPlatform.registerWithPlatform();
    } catch (error) {
      console.warn('[PushRegistrationReconciliationService] Push reconciliation failed', {
        stage,
        platform: this.pushPlatform.getDevicePlatform(),
        status: 'error',
        error,
      });
      this.registrationStatus.set('error');
    }
  }

  disableCurrentDevice(): Promise<void> {
    const token = this.pushPlatform.getLastToken();

    if (!token || !this.authService.getAccessToken()) {
      this.pushPlatform.clearLastToken();
      return Promise.resolve();
    }

    return firstValueFrom(
      this.devicesService.deleteDevice({ token }).pipe(
        tap(() => this.pushPlatform.clearLastToken()),
        mapTo(void 0),
        catchError((error) => {
          console.warn('[PushRegistrationReconciliationService] Device token disable failed', {
            stage: 'backend-registration',
            status: 'disable-error',
            error,
          });
          return of(void 0);
        }),
      ),
    ).catch(() => void 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    void this.appStateListener?.then((listener) => listener.remove());
    void this.pushPlatform.removeListeners();
  }

  private registerBackendDevice(deviceToken: PushDeviceToken): void {
    if (!this.authService.getAccessToken()) {
      return;
    }

    this.userService.getPreferences().pipe(
      take(1),
      filter((preferences) => preferences.pushNotificationsEnabled),
      switchMap(() => this.devicesService.registerDevice({
        token: deviceToken.token,
        platform: deviceToken.platform,
      })),
      catchError((error) => {
        console.warn('[PushRegistrationReconciliationService] Device token registration failed', {
          stage: 'backend-registration',
          platform: deviceToken.platform,
          status: 'error',
          error,
        });
        this.registrationStatus.set('error');
        return EMPTY;
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: () => {
        this.pushPlatform.rememberRegisteredToken(deviceToken.token);
        this.registrationStatus.set('registered');
      },
    });
  }
}
