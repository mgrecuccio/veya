import { inject, Injectable, InjectionToken } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface PickedPhoneNumber {
  label?: string | null;
  value: string;
}

export interface PickedContact {
  displayName?: string | null;
  phoneNumbers: PickedPhoneNumber[];
}

export type ContactPickResult =
  | { kind: 'selected'; contact: PickedContact }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' };

interface NativeContactPickerResponse {
  cancelled?: boolean;
  displayName?: string | null;
  phoneNumbers?: PickedPhoneNumber[];
}

export interface SingleContactPickerPlugin {
  pickContact(): Promise<NativeContactPickerResponse>;
}

export const SINGLE_CONTACT_PICKER =
  new InjectionToken<SingleContactPickerPlugin>('SingleContactPicker', {
    providedIn: 'root',
    factory: () => registerPlugin<SingleContactPickerPlugin>(
      'SingleContactPicker',
    ),
  });

@Injectable({ providedIn: 'root' })
export class NativeContactPickerService {
  private readonly plugin = inject(SINGLE_CONTACT_PICKER);

  isAvailable(): boolean {
    return (
      Capacitor.isNativePlatform() &&
      Capacitor.isPluginAvailable('SingleContactPicker')
    );
  }

  async pickContact(): Promise<ContactPickResult> {
    if (!this.isAvailable()) {
      return { kind: 'unavailable' };
    }

    const result = await this.plugin.pickContact();

    if (result.cancelled) {
      return { kind: 'cancelled' };
    }

    return {
      kind: 'selected',
      contact: {
        displayName: result.displayName?.trim() || null,
        phoneNumbers: (result.phoneNumbers ?? [])
          .filter((phoneNumber) => Boolean(phoneNumber.value?.trim()))
          .map((phoneNumber) => ({
            label: phoneNumber.label?.trim() || null,
            value: phoneNumber.value.trim(),
          })),
      },
    };
  }
}
