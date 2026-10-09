import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from 'src/app/core/i18n/i18n.service';

export type AppToastColor = 'success' | 'danger';

export interface AppToast {
  message: string;
  color: AppToastColor;
}

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly i18n = inject(I18nService);
  private dismissTimer?: number;
  readonly toast = signal<AppToast | null>(null);

  async show(
    message: string,
    color: AppToastColor,
    _cssClass = 'app-toast',
  ): Promise<void> {
    window.clearTimeout(this.dismissTimer);
    this.toast.set({
      message: this.i18n.translate(message),
      color,
    });

    this.dismissTimer = window.setTimeout(() => {
      this.toast.set(null);
    }, 3000);
  }

  dismiss(): void {
    window.clearTimeout(this.dismissTimer);
    this.toast.set(null);
  }
}
