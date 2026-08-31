import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DeleteDeviceTokenRequest } from '../request/delete-device-token.request';
import { RegisterDeviceTokenRequest } from '../request/register-device-token.request';

@Injectable({ providedIn: 'root' })
export class NotificationDevicesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  registerDevice(payload: RegisterDeviceTokenRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/api/v1/notifications/devices`,
      payload,
    );
  }

  deleteDevice(payload: DeleteDeviceTokenRequest): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/api/v1/notifications/devices`,
      { body: payload },
    );
  }
}
