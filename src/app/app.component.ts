import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  IonApp,
  IonRouterOutlet,
  Platform
} from '@ionic/angular/standalone';
import { AppToastService } from './shared/toast/app-toast.service';
import { PushNotificationRoutingService } from './core/notifications/push-notification-routing.service';
import { PushRegistrationReconciliationService } from './core/notifications/push-registration-reconciliation.service';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  add,
  calendar,
  chevronForwardOutline,
  checkmarkOutline,
  closeOutline,
  ellipsisHorizontal,
  heart,
  home,
  logoWhatsapp,
  mailOpenOutline,
  people,
  sendOutline,
  settings,
  settingsOutline,
  sparklesOutline,
  star,
  starOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      @if (appToastService.toast(); as toast) {
        <div
          class="app-toast-overlay"
          [class.app-toast-overlay--danger]="toast.color === 'danger'"
          [class.app-toast-overlay--success]="toast.color === 'success'"
          role="status"
          aria-live="polite"
          (click)="appToastService.dismiss()"
        >
          {{ toast.message }}
        </div>
      }
    </ion-app>
  `,
})
export class AppComponent implements OnDestroy {
  @ViewChild(IonRouterOutlet) private readonly routerOutlet?: IonRouterOutlet;

  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly zone = inject(NgZone);
  readonly appToastService = inject(AppToastService);
  private readonly pushRegistration = inject(PushRegistrationReconciliationService);
  private readonly pushNotificationRouting = inject(PushNotificationRoutingService);

  private keyboardListeners: Promise<PluginListenerHandle>[] = [];
  private backButtonSubscription?: Subscription;
  private routerEventsSubscription?: Subscription;

  constructor() {
    addIcons({
      add,
      'chevron-forward-outline': chevronForwardOutline,
      'checkmark-outline': checkmarkOutline,
      'close-outline': closeOutline,
      home,
      people,
      heart,
      calendar,
      'send-outline': sendOutline,
      settings,
      'logo-whatsapp': logoWhatsapp,
      'mail-open-outline': mailOpenOutline,
      'settings-outline': settingsOutline,
      'ellipsis-horizontal': ellipsisHorizontal,
      'sparkles-outline': sparklesOutline,
      star,
      'star-outline': starOutline,
    });

    this.applyPlatformClasses();
    void this.configureStatusBar();
    this.registerKeyboardListeners();
    this.registerBackButtonHandler();
    this.registerContentScrollRefresh();
    this.pushRegistration.initialize();
    this.pushNotificationRouting.initialize();
  }

  ngOnDestroy(): void {
    document.documentElement.classList.remove('keyboard-is-open');
    document.documentElement.style.removeProperty('--app-keyboard-height');

    for (const listener of this.keyboardListeners) {
      void listener.then(handle => {
        void handle.remove();
      });
    }

    this.backButtonSubscription?.unsubscribe();
    this.routerEventsSubscription?.unsubscribe();
  }

  private registerContentScrollRefresh(): void {
    this.routerEventsSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scheduleContentScrollRefresh();
      });

    this.scheduleContentScrollRefresh();
  }

  private scheduleContentScrollRefresh(): void {
    this.refreshScrollableContent();
    window.setTimeout(() => this.refreshScrollableContent(), 80);
    window.setTimeout(() => this.refreshScrollableContent(), 250);
    window.setTimeout(() => this.refreshScrollableContent(), 700);
  }

  private refreshScrollableContent(): void {
    window.requestAnimationFrame(() => {
      const contents = document.querySelectorAll<ScrollableIonContent>(
        'ion-content.app-gradient-content'
      );

      contents.forEach(content => {
        content.scrollY = true;
        content.style.setProperty('--overflow', 'auto');
        void content.resize?.();

        void content.getScrollElement?.().then(scrollElement => {
          scrollElement.style.overflowX = 'hidden';
          scrollElement.style.overflowY = 'auto';
          scrollElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
          scrollElement.style.touchAction = 'pan-y';
        });
      });
    });
  }

  private registerKeyboardListeners(): void {
    this.keyboardListeners = [
      Keyboard.addListener('keyboardWillShow', info => {
        this.applyKeyboardHeight(info);
      }),
      Keyboard.addListener('keyboardDidShow', info => {
        this.applyKeyboardHeight(info);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        this.clearKeyboardHeight();
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        this.clearKeyboardHeight();
      }),
    ];
  }

  private applyPlatformClasses(): void {
    document.documentElement.classList.toggle(
      'app-platform-android',
      this.platform.is('android')
    );
    document.documentElement.classList.toggle(
      'app-platform-ios',
      this.platform.is('ios')
    );
  }

  private async configureStatusBar(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      return;
    }

    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#f8a99a' });
      await StatusBar.show();
    } catch (error) {
      console.warn('[AppComponent] Status bar configuration failed', error);
    }
  }

  private applyKeyboardHeight(info: KeyboardInfo): void {
    const height = Math.max(0, Math.round(info.keyboardHeight));

    document.documentElement.classList.add('keyboard-is-open');
    document.documentElement.style.setProperty(
      '--app-keyboard-height',
      `${height}px`
    );
  }

  private clearKeyboardHeight(): void {
    document.documentElement.classList.remove('keyboard-is-open');
    document.documentElement.style.removeProperty('--app-keyboard-height');
    window.dispatchEvent(new CustomEvent('appKeyboardDidHide'));
  }

  private registerBackButtonHandler(): void {
    this.backButtonSubscription = this.platform.backButton
      .subscribeWithPriority(10000, processNextHandler => {
        this.handleBackButton(processNextHandler);
      });
  }

  private handleBackButton(processNextHandler: () => void): void {
    const path = this.getPath(this.router.url);

    if (path === '/auth/onboarding') {
      void this.exitApp();
      return;
    }

    if (this.isAuthPath(path)) {
      this.navigateBack();
      return;
    }

    if (this.isTabPath(path)) {
      void this.exitApp();
      return;
    }

    if (this.routerOutlet?.canGoBack()) {
      void this.routerOutlet.pop();
      return;
    }

    processNextHandler();
  }

  private navigateBack(): void {
    this.zone.run(() => {
      this.location.back();
    });
  }

  private getPath(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private isAuthPath(path: string): boolean {
    return path.startsWith('/auth/');
  }

  private isTabPath(path: string): boolean {
    return path === '/app' || path.startsWith('/app/');
  }

  private async exitApp(): Promise<void> {
    try {
      await App.exitApp();
    } catch {
      await App.minimizeApp();
    }
  }

}

type ScrollableIonContent = HTMLElement & {
  getScrollElement?: () => Promise<HTMLElement>;
  resize?: () => Promise<void> | void;
  scrollY?: boolean;
};
