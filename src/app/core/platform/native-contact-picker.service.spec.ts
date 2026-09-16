import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import {
  NativeContactPickerService,
  SINGLE_CONTACT_PICKER,
  SingleContactPickerPlugin,
} from './native-contact-picker.service';

describe('NativeContactPickerService', () => {
  let service: NativeContactPickerService;
  let plugin: jasmine.SpyObj<SingleContactPickerPlugin>;

  beforeEach(() => {
    plugin = jasmine.createSpyObj<SingleContactPickerPlugin>(
      'SingleContactPickerPlugin',
      ['pickContact'],
    );
    TestBed.configureTestingModule({
      providers: [{ provide: SINGLE_CONTACT_PICKER, useValue: plugin }],
    });
    service = TestBed.inject(NativeContactPickerService);
  });

  it('reports unavailable outside a native Capacitor platform', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    expect(service.isAvailable()).toBeFalse();
    await expectAsync(service.pickContact()).toBeResolvedTo({
      kind: 'unavailable',
    });
  });

  it('reports unavailable when the native plugin is missing', () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'isPluginAvailable').and.returnValue(false);

    expect(service.isAvailable()).toBeFalse();
  });

  it('maps a selected contact to the minimal app shape', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'isPluginAvailable').and.returnValue(true);
    plugin.pickContact.and.resolveTo({
      displayName: ' Alex ',
      phoneNumbers: [
        { label: ' mobile ', value: ' +32 470 12 34 56 ' },
        { label: 'empty', value: ' ' },
      ],
    });

    await expectAsync(service.pickContact()).toBeResolvedTo({
      kind: 'selected',
      contact: {
        displayName: 'Alex',
        phoneNumbers: [
          { label: 'mobile', value: '+32 470 12 34 56' },
        ],
      },
    });
  });

  it('maps native cancellation without throwing', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'isPluginAvailable').and.returnValue(true);
    plugin.pickContact.and.resolveTo({ cancelled: true });

    await expectAsync(service.pickContact()).toBeResolvedTo({
      kind: 'cancelled',
    });
  });

  it('propagates native operational failures', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'isPluginAvailable').and.returnValue(true);
    plugin.pickContact.and.rejectWith(new Error('Native failure'));

    await expectAsync(service.pickContact()).toBeRejectedWithError(
      'Native failure',
    );
  });
});
