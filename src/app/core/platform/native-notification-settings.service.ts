import { inject, Injectable, InjectionToken } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NotificationSettingsPlugin {
  areEnabled(): Promise<{ enabled: boolean }>;
  open(): Promise<{ completed: boolean }>;
}

export const NOTIFICATION_SETTINGS_PLUGIN =
  new InjectionToken<NotificationSettingsPlugin>('NotificationSettings', {
    providedIn: 'root',
    factory: () => registerPlugin<NotificationSettingsPlugin>(
      'NotificationSettings',
    ),
  });

@Injectable({ providedIn: 'root' })
export class NativeNotificationSettingsService {
  private readonly plugin = inject(NOTIFICATION_SETTINGS_PLUGIN);

  async areEnabled(): Promise<boolean | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const result = await this.plugin.areEnabled();
    return result.enabled;
  }

  async open(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const result = await this.plugin.open();
    return result.completed;
  }

  private isAvailable(): boolean {
    return (
      Capacitor.isNativePlatform()
      && Capacitor.isPluginAvailable('NotificationSettings')
    );
  }
}
