import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavController } from '@ionic/angular';

import { OnboardingPage } from './onboarding.page';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;
  let navController: jasmine.SpyObj<NavController>;

  beforeEach(async () => {
    navController = jasmine.createSpyObj<NavController>('NavController', [
      'navigateForward'
    ]);
    navController.navigateForward.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [
        { provide: NavController, useValue: navController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
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

  it('should navigate to /auth/login when goToLogin is called', () => {
    component.goToLogin();

    expect(navController.navigateForward).toHaveBeenCalledWith('/auth/login');
  });

  it('should navigate to /auth/register when goToRegister is called', () => {
    component.goToRegister();

    expect(navController.navigateForward).toHaveBeenCalledWith('/auth/register');
  });
});
