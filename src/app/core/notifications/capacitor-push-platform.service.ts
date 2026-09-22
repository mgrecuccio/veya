import { Injectable, NgZone, inject } from '@angular/core';
import type {
  ActionPerformed,
  PermissionStatus,
  PushNotificationSchema,
} from '@capacitor/push-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { Platform } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DEVICE_TOKEN_PLATFORM, DeviceTokenPlatform } from '../api/request/register-device-token.request';
import { NativeNotificationSettingsService } from '../platform/native-notification-settings.service';

export type PushPermissionState = PermissionStatus['receive'] | 'unsupported';

export interface PushDeviceToken {
  token: string;
  platform: DeviceTokenPlatform;
}

const LAST_PUSH_TOKEN_KEY = 'veya:lastPushToken';

@Injectable({ providedIn: 'root' })
export class CapacitorPushPlatformService {
  private readonly platform = inject(Platform);
  private readonly zone = inject(NgZone);
  private readonly notificationSettings = inject(NativeNotificationSettingsService);
  private readonly tokenSubject = new Subject<PushDeviceToken>();
  private readonly foregroundNotificationSubject = new Subject<PushNotificationSchema>();
  private readonly actionSubject = new Subject<ActionPerformed>();
  private listeners: Promise<PluginListenerHandle>[] = [];
  private listenersRegistered = false;

  readonly tokens$ = this.tokenSubject.asObservable();
  readonly foregroundNotifications$ = this.foregroundNotificationSubject.asObservable();
  readonly actions$ = this.actionSubject.asObservable();

  initializeListeners(): void {
    if (!this.isNativePushAvailable() || this.listenersRegistered) {
      return;
    }

    this.listenersRegistered = true;
    this.listeners = [
      PushNotifications.addListener('registration', ({ value }) => {
        this.zone.run(() => {
          const token = {
            token: value,
            platform: this.getDevicePlatform(),
          };

          this.tokenSubject.next(token);
        });
      }),
      PushNotifications.addListener('registrationError', (error) => {
        console.warn('[CapacitorPushPlatformService] Push registration failed', error);
      }),
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        this.zone.run(() => this.foregroundNotificationSubject.next(notification));
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        this.zone.run(() => this.actionSubject.next(action));
      }),
    ];
  }

  async checkPermission(): Promise<PushPermissionState> {
    if (!this.isNativePushAvailable()) {
      return 'unsupported';
    }

    const permission = await PushNotifications.checkPermissions();
    return this.normalizeAndroidPermission(permission.receive);
  }

  async requestPermission(): Promise<PushPermissionState> {
    if (!this.isNativePushAvailable()) {
      return 'unsupported';
    }

    const permission = await PushNotifications.requestPermissions();
    return this.normalizeAndroidPermission(permission.receive);
  }

  async registerWithPlatform(): Promise<void> {
    if (!this.isNativePushAvailable()) {
      return;
    }

    await PushNotifications.register();
  }

  async unregisterFromPlatform(): Promise<void> {
    if (!this.isNativePushAvailable()) {
      return;
    }

    await PushNotifications.unregister();
  }

  getLastToken(): string | null {
    return window.localStorage.getItem(LAST_PUSH_TOKEN_KEY);
  }

  clearLastToken(): void {
    window.localStorage.removeItem(LAST_PUSH_TOKEN_KEY);
  }

  rememberRegisteredToken(token: string): void {
    window.localStorage.setItem(LAST_PUSH_TOKEN_KEY, token);
  }

  async removeListeners(): Promise<void> {
    const listeners = this.listeners;
    this.listeners = [];
    this.listenersRegistered = false;

    await Promise.all(
      listeners.map(async (listener) => {
        const handle = await listener;
        await handle.remove();
      }),
    );
  }

  getDevicePlatform(): DeviceTokenPlatform {
    if (this.platform.is('ios')) {
      return DEVICE_TOKEN_PLATFORM.IOS;
    }

    if (this.platform.is('android')) {
      return DEVICE_TOKEN_PLATFORM.ANDROID;
    }

    return DEVICE_TOKEN_PLATFORM.WEB;
  }

  private isNativePushAvailable(): boolean {
    return this.platform.is('capacitor') && environment.nativePushNotificationsConfigured;
  }

  private async normalizeAndroidPermission(
    permission: PermissionStatus['receive'],
  ): Promise<PermissionStatus['receive']> {
    if (!this.platform.is('android') || permission !== 'granted') {
      return permission;
    }

    const notificationsEnabled = await this.notificationSettings.areEnabled();
    return notificationsEnabled === false ? 'denied' : permission;
  }

}
