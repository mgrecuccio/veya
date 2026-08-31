import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PushNotificationIntent } from './push-notification-intent';

@Injectable({ providedIn: 'root' })
export class PushNotificationRefreshService {
  private readonly intentSubject = new Subject<PushNotificationIntent>();

  readonly intents$ = this.intentSubject.asObservable();

  notify(intent: PushNotificationIntent): void {
    this.intentSubject.next(intent);
  }
}
