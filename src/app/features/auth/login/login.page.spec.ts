import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoginPage } from "./login.page"
import { provideRouter } from "@angular/router";
import { By } from '@angular/platform-browser';


describe('LoginPage', () => {
    let component: LoginPage;
    let fixture: ComponentFixture<LoginPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoginPage],
            providers: [provideRouter([])]

        }).compileComponents();

        fixture = TestBed.createComponent(LoginPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the page title and subtitle', () => {
        const compiled = fixture.nativeElement as HTMLElement;

        expect(compiled.querySelector('.auth-title')?.textContent).toContain('Welcome back');
        expect(compiled.querySelector('.auth-subtitle')?.textContent).toContain('Log in to pick up where your plans left off.');
    });

    it('should initialize the form with empty values', () => {
        expect(component.form.getRawValue()).toEqual({
            email: '',
            password: ''
        });
    });

    it('should be invalid when the form is empty', () => {
        expect(component.form.invalid).toBeTrue();
        expect(component.email.errors?.['required']).toBeTrue();
        expect(component.password.errors?.['required']).toBeTrue();
    });

    it('should validate email format', () => {
        component.email.setValue('invalid-email');
        component.email.markAllAsTouched();
        fixture.detectChanges();

        expect(component.email.invalid).toBeTrue();
        expect(component.email.errors?.['email']).toBeTrue();
    });

    it('should validate password minimum length', () => {
        component.password.setValue('12345');
        component.password.markAsTouched();
        fixture.detectChanges();

        expect(component.password.invalid).toBeTrue();
        expect(component.password.errors?.['minlength']).toBeTruthy();
    });

    it('should show validation messages after submitting an invalid form', () => {
        component.submit();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const errorMessages = compiled.querySelectorAll('.auth-error');

        expect(component.email.touched).toBeTrue();
        expect(component.password.touched).toBeTrue();
        expect(errorMessages.length).toBeGreaterThan(0);
        expect(compiled.textContent).toContain('Email is required.');
        expect(compiled.textContent).toContain('Password is required.');
    });

    it('should keep the form valid with correct values', () => {
        component.form.setValue({
            email: 'test@example.com',
            password: 'password123'
            });
        fixture.detectChanges();

        expect(component.form.valid).toBeTrue();
    });

    it('should call console.log with payload on valid submit', () => {
    const consoleSpy = spyOn(console, 'log');

    component.form.setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.submit();

    expect(consoleSpy).toHaveBeenCalledWith('Login payload', {
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should call forgotPassword when forgot password is clicked', () => {
    const forgotSpy = spyOn(component, 'forgotPassword');

    const forgotButton = fixture.debugElement.query(By.css('.auth-text-button'));
    forgotButton.triggerEventHandler('click', null);

    expect(forgotSpy).toHaveBeenCalled();
  });

  it('should render the sign up footer link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footerLink = compiled.querySelector('.auth-footer-link');

    expect(footerLink).toBeTruthy();
    expect(footerLink?.textContent?.trim()).toBe('Sign up');
  });

})