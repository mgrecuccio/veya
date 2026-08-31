import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { NotificationDevicesService } from './notification-devices.service';

describe('NotificationDevicesService', () => {
  let service: NotificationDevicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationDevicesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(NotificationDevicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should register a notification device token', () => {
    const payload = {
      token: 'device-token',
      platform: 'IOS',
    };

    service.registerDevice(payload).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/notifications/devices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });

  it('should delete a notification device token', () => {
    const payload = {
      token: 'device-token',
    };

    service.deleteDevice(payload).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/notifications/devices`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });
});
