import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { OnboardingPage } from './onboarding.page';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-brand')?.textContent).toContain('Veya');
  });

  it('should render the hero title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-title')?.textContent).toContain(
      'Reconnect with your friends'
    );
  });

  it('should render the CTA text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cta-text')?.textContent).toContain(
      'Join Veya and make plans in the moment!'
    );
  });

  it('should navigate to /auth/login when goToLogin is called', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.goToLogin();

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should navigate to /auth/register when goToRegister is called', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.goToRegister();

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/register']);
  });
});