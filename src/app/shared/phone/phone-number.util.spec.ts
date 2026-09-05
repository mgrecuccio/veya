import { FormControl, FormGroup } from '@angular/forms';
import {
  createPhoneCountries,
  countryCodeToFlag,
  getNormalizedPhoneNumber,
  optionalPhoneValidator,
  splitE164PhoneNumber,
} from './phone-number.util';

describe('phone-number.util', () => {
  it('normalizes a valid national phone number to E.164', () => {
    expect(getNormalizedPhoneNumber('BE', '0470 12 34 56')).toBe('+32470123456');
  });

  it('returns undefined for empty or invalid phone numbers', () => {
    expect(getNormalizedPhoneNumber('BE', '')).toBeUndefined();
    expect(getNormalizedPhoneNumber('BE', '123')).toBeUndefined();
  });

  it('validates optional phone controls', () => {
    const validator = optionalPhoneValidator();
    const form = new FormGroup({
      phoneCountry: new FormControl('BE'),
      phoneNational: new FormControl('0470 12 34 56'),
    });

    expect(validator(form)).toBeNull();

    form.controls.phoneNational.setValue('');
    expect(validator(form)).toBeNull();

    form.controls.phoneNational.setValue('123');
    expect(validator(form)).toEqual({ invalidPhoneNumber: true });
  });

  it('requires a country when a phone number is present', () => {
    const validator = optionalPhoneValidator();
    const form = new FormGroup({
      phoneCountry: new FormControl(null),
      phoneNational: new FormControl('0470 12 34 56'),
    });

    expect(validator(form)).toEqual({ invalidPhoneNumber: true });
  });

  it('splits an E.164 phone number into country and national number', () => {
    expect(splitE164PhoneNumber('+32470123456', 'US')).toEqual({
      phoneCountry: 'BE',
      phoneNational: '470123456',
    });
  });

  it('falls back when splitting a missing or invalid phone number', () => {
    expect(splitE164PhoneNumber(null, 'US')).toEqual({
      phoneCountry: 'US',
      phoneNational: '',
    });
    expect(splitE164PhoneNumber('not-a-phone-number', 'US')).toEqual({
      phoneCountry: 'US',
      phoneNational: '',
    });
  });

  it('creates country metadata for phone selectors', () => {
    const countries = createPhoneCountries();
    const belgium = countries.find((country) => country.code === 'BE');

    expect(countries.map((country) => country.code).sort()).toEqual([
      'BE',
      'DE',
      'ES',
      'FR',
      'GB',
      'IT',
      'NL',
      'US',
    ]);
    expect(belgium).toEqual(
      jasmine.objectContaining({
        code: 'BE',
        name: 'Belgium',
        dialCode: '+32',
        flag: countryCodeToFlag('BE'),
      }),
    );
  });
});
