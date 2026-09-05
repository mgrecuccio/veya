import { Injectable, signal } from '@angular/core';

export type AppToastColor = 'success' | 'danger';

export interface AppToast {
  message: string;
  color: AppToastColor;
}

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private dismissTimer?: number;
  readonly toast = signal<AppToast | null>(null);

  async show(
    message: string,
    color: AppToastColor,
    _cssClass = 'app-toast',
  ): Promise<void> {
    window.clearTimeout(this.dismissTimer);
    this.toast.set({
      message,
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
