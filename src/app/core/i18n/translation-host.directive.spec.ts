import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { TranslationHostDirective } from './translation-host.directive';

@Component({
  standalone: true,
  imports: [TranslationHostDirective],
  template: `
    <section appTranslationHost>
      <h1>Welcome back</h1>
      <input placeholder="Enter your password" aria-label="Phone number" />
    </section>
  `,
})
class TranslationHostTestComponent {}

describe('TranslationHostDirective', () => {
  let fixture: ComponentFixture<TranslationHostTestComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TranslationHostTestComponent],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture = TestBed.createComponent(TranslationHostTestComponent);
    fixture.detectChanges();
  });

  it('updates visible text and accessibility attributes at runtime', async () => {
    i18n.setLanguage('fr');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input')!;
    expect(element.querySelector('h1')?.textContent).toContain('Bon retour');
    expect(input.placeholder).toBe('Saisissez votre mot de passe');
    expect(input.getAttribute('aria-label')).toBe('Numéro de téléphone');

    i18n.setLanguage('en');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Welcome back');
  });

  it('updates visible text and accessibility attributes in Italian', async () => {
    i18n.setLanguage('it');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input')!;
    expect(element.querySelector('h1')?.textContent).toContain('Bentornato');
    expect(input.placeholder).toBe('Inserisci la password');
    expect(input.getAttribute('aria-label')).toBe('Numero di telefono');
  });
});
