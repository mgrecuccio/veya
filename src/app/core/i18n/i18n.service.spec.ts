import { TestBed } from '@angular/core/testing';
import { FRENCH_TRANSLATIONS, I18nService } from './i18n.service';
import { ITALIAN_TRANSLATIONS } from './italian-translations';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses English as the supported fallback language', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('en');

    expect(service.translate('Welcome back')).toBe('Welcome back');
    expect(document.documentElement.lang).toBe('en');
  });

  it('translates known text and formatted text into French', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('fr');

    expect(service.translate('Welcome back')).toBe('Bon retour');
    expect(service.translate('Hi, Marco')).toBe('Bonjour, Marco');
    expect(service.translateRendered('  Phone number\n')).toBe('  Numéro de téléphone\n');
    expect(service.locale()).toBe('fr-BE');
  });

  it('persists the selected language locally', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('fr');

    expect(localStorage.getItem('veya.preferredLanguage')).toBe('fr');
  });

  it('translates known and formatted text into Italian', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('it');

    expect(service.translate('Welcome back')).toBe('Bentornato');
    expect(service.translate('Hi, Marco')).toBe('Ciao, Marco');
    expect(service.translateRendered('  Phone number\n')).toBe('  Numero di telefono\n');
    expect(service.locale()).toBe('it-IT');
    expect(document.documentElement.lang).toBe('it');
    expect(localStorage.getItem('veya.preferredLanguage')).toBe('it');
  });

  it('keeps the Italian catalogue aligned with the French catalogue', () => {
    const missingItalianKeys = Object.keys(FRENCH_TRANSLATIONS)
      .filter((key) => !(key in ITALIAN_TRANSLATIONS));

    expect(missingItalianKeys).toEqual([]);
  });
});
