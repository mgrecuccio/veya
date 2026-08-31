import { TestBed } from '@angular/core/testing';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { UserMatchingPreferencesView } from '../api/model/user-matching-preferences-view.model';
import { NotificationDevicesService } from '../api/services/notification-devices.service';
import { UserService } from '../api/services/user.service';
import { AuthService } from '../auth/auth.service';
import { AuthTokens } from '../models/auth-tokens.model';
import { CapacitorPushPlatformService, PushDeviceToken } from './capacitor-push-platform.service';
import { PushRegistrationReconciliationService } from './push-registration-reconciliation.service';

describe('PushRegistrationReconciliationService', () => {
  let service: PushRegistrationReconciliationService;
  let userService: jasmine.SpyObj<UserService>;
  let devicesService: jasmine.SpyObj<NotificationDevicesService>;
  let pushPlatform: jasmine.SpyObj<CapacitorPushPlatformService>;
  let authState$: BehaviorSubject<AuthTokens | null>;
  let tokens$: Subject<PushDeviceToken>;

  beforeEach(() => {
    authState$ = new BehaviorSubject<AuthTokens | null>(createAuthTokens());
    tokens$ = new Subject<PushDeviceToken>();

    spyOn(App, 'addListener').and.returnValue(Promise.resolve({
      remove: () => Promise.resolve(),
    } as PluginListenerHandle));

    TestBed.configureTestingModule({
      providers: [
        PushRegistrationReconciliationService,
        {
          provide: AuthService,
          useValue: {
            authState$: authState$.asObservable(),
            getAccessToken: () => authState$.value?.accessToken ?? null,
          },
        },
        {
          provide: UserService,
          useValue: jasmine.createSpyObj<UserService>(
            'UserService',
            ['getPreferences'],
          ),
        },
        {
          provide: NotificationDevicesService,
          useValue: jasmine.createSpyObj<NotificationDevicesService>(
            'NotificationDevicesService',
            ['registerDevice', 'deleteDevice'],
          ),
        },
        {
          provide: CapacitorPushPlatformService,
          useValue: jasmine.createSpyObj<CapacitorPushPlatformService>(
            'CapacitorPushPlatformService',
            [
              'initializeListeners',
              'checkPermission',
              'requestPermission',
              'registerWithPlatform',
              'getLastToken',
              'clearLastToken',
              'removeListeners',
            ],
            { tokens$: tokens$.asObservable() },
          ),
        },
      ],
    });

    service = TestBed.inject(PushRegistrationReconciliationService);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    devicesService = TestBed.inject(NotificationDevicesService) as jasmine.SpyObj<NotificationDevicesService>;
    pushPlatform = TestBed.inject(CapacitorPushPlatformService) as jasmine.SpyObj<CapacitorPushPlatformService>;

    userService.getPreferences.and.returnValue(of(mockPreferences()));
    devicesService.registerDevice.and.returnValue(of(void 0));
    devicesService.deleteDevice.and.returnValue(of(void 0));
    pushPlatform.checkPermission.and.returnValue(Promise.resolve('granted'));
    pushPlatform.requestPermission.and.returnValue(Promise.resolve('granted'));
    pushPlatform.registerWithPlatform.and.returnValue(Promise.resolve());
    pushPlatform.getLastToken.and.returnValue('last-token');
    pushPlatform.removeListeners.and.returnValue(Promise.resolve());
  });

  it('should register with the native platform when preference and permission allow push', async () => {
    await service.reconcile();

    expect(pushPlatform.checkPermission).toHaveBeenCalled();
    expect(pushPlatform.registerWithPlatform).toHaveBeenCalled();
    expect(service.registrationStatus()).toBe('registering');
  });

  it('should request permission when reconciliation is triggered by enabling the preference', async () => {
    pushPlatform.checkPermission.and.returnValue(Promise.resolve('prompt'));

    await service.reconcile({ requestPermission: true });

    expect(pushPlatform.requestPermission).toHaveBeenCalled();
    expect(pushPlatform.registerWithPlatform).toHaveBeenCalled();
  });

  it('should not register when OS permission is denied', async () => {
    pushPlatform.checkPermission.and.returnValue(Promise.resolve('denied'));

    await service.reconcile();

    expect(pushPlatform.registerWithPlatform).not.toHaveBeenCalled();
    expect(service.registrationStatus()).toBe('permission-denied');
  });

  it('should disable the existing token when the backend preference is off', async () => {
    userService.getPreferences.and.returnValue(of(mockPreferences({
      pushNotificationsEnabled: false,
    })));

    await service.reconcile();

    expect(devicesService.deleteDevice).toHaveBeenCalledWith({ token: 'last-token' });
    expect(pushPlatform.clearLastToken).toHaveBeenCalled();
    expect(pushPlatform.registerWithPlatform).not.toHaveBeenCalled();
  });

  it('should register emitted native tokens with the backend when the preference is enabled', () => {
    service.initialize();

    tokens$.next({
      token: 'fresh-token',
      platform: 'ANDROID',
    });

    expect(devicesService.registerDevice).toHaveBeenCalledWith({
      token: 'fresh-token',
      platform: 'ANDROID',
    });
    expect(service.registrationStatus()).toBe('registered');
  });

  function mockPreferences(
    overrides: Partial<UserMatchingPreferencesView> = {},
  ): UserMatchingPreferencesView {
    return {
      userId: 1,
      timezone: 'Europe/Brussels',
      allowChat: true,
      allowCall: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      pushNotificationsEnabled: true,
      suggestionNotificationsEnabled: true,
      ...overrides,
    };
  }
});

function createAuthTokens(): AuthTokens {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresInSeconds: 3600,
  };
}
