import {
  CountryCode,
  getCountryCallingCode,
  getCountries,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export interface PhoneCountry {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

export const E164_REGEX = /^\+[1-9]\d{1,14}$/;
const SUPPORTED_PHONE_COUNTRIES: CountryCode[] = [
  'BE',
  'NL',
  'FR',
  'DE',
  'IT',
  'ES',
  'GB',
  'US',
];

export function countryCodeToFlag(countryCode: CountryCode): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map((character) =>
      String.fromCodePoint(character.charCodeAt(0) + 127397)
    )
    .join('');
}

export function optionalPhoneValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const country = group.get('phoneCountry')?.value as
      | CountryCode
      | undefined;

    const nationalNumber =
      group.get('phoneNational')?.value?.trim() ?? '';

    if (!nationalNumber) {
      return null;
    }

    if (!country) {
      return { invalidPhoneNumber: true };
    }

    return getNormalizedPhoneNumber(country, nationalNumber)
      ? null
      : { invalidPhoneNumber: true };
  };
}

export function getNormalizedPhoneNumber(
  country: CountryCode,
  nationalNumber: string,
): string | undefined {
  const trimmedNationalNumber = nationalNumber.trim();

  if (!trimmedNationalNumber) {
    return undefined;
  }

  try {
    const parsedNumber = parsePhoneNumberFromString(
      trimmedNationalNumber,
      country,
    );

    if (
      !parsedNumber ||
      !parsedNumber.isValid() ||
      !E164_REGEX.test(parsedNumber.number)
    ) {
      return undefined;
    }

    return parsedNumber.number;
  } catch {
    return undefined;
  }
}

export function splitE164PhoneNumber(
  phoneNumber?: string | null,
  fallbackCountry: CountryCode = getDefaultPhoneCountry(),
): { phoneCountry: CountryCode; phoneNational: string } {
  if (!phoneNumber) {
    return {
      phoneCountry: fallbackCountry,
      phoneNational: '',
    };
  }

  const parsedNumber = parsePhoneNumberFromString(phoneNumber);

  return {
    phoneCountry: parsedNumber?.country ?? fallbackCountry,
    phoneNational: parsedNumber?.nationalNumber?.toString() ?? '',
  };
}

export function createPhoneCountries(): PhoneCountry[] {
  const displayNames = new Intl.DisplayNames(['en'], {
    type: 'region',
  });

  return SUPPORTED_PHONE_COUNTRIES
    .map((code) => ({
      code,
      name: displayNames.of(code) ?? code,
      dialCode: `+${getCountryCallingCode(code)}`,
      flag: countryCodeToFlag(code),
    }))
    .sort((first, second) =>
      first.name.localeCompare(second.name)
    );
}

export function getDefaultPhoneCountry(): CountryCode {
  const language = globalThis.navigator?.language ?? '';

  try {
    const region = new Intl.Locale(language).region;

    if (
      region &&
      SUPPORTED_PHONE_COUNTRIES.includes(region as CountryCode)
    ) {
      return region as CountryCode;
    }
  } catch {
  }

  return 'BE';
}
