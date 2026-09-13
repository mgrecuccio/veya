import { Injectable } from '@angular/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class ExternalUrlLauncherService {
  async open(url: string): Promise<boolean> {
    if (Capacitor.getPlatform() === 'ios') {
      const { completed } = await AppLauncher.openUrl({ url });
      return completed;
    }

    const openedWindow = window.open(url, '_blank');

    if (!openedWindow) {
      return false;
    }

    openedWindow.opener = null;
    return true;
  }
}
