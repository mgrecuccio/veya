import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title and subtitle', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.auth-title')?.textContent).toContain('Create your account');
    expect(compiled.querySelector('.auth-subtitle')?.textContent).toContain(
      'Start planning spontaneous moments with the people you care about.'
    );
  });

  it('should initialize the form with empty values', () => {
    expect(component.form.getRawValue()).toEqual({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  });

  it('should be invalid when the form is empty', () => {
    expect(component.form.invalid).toBeTrue();
    expect(component.name.errors?.['required']).toBeTrue();
    expect(component.email.errors?.['required']).toBeTrue();
    expect(component.password.errors?.['required']).toBeTrue();
    expect(component.confirmPassword.errors?.['required']).toBeTrue();
  });

  it('should validate email format', () => {
    component.email.setValue('invalid-email');
    component.email.markAsTouched();
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

  it('should validate password confirmation mismatch', () => {
    component.form.setValue({
      name: 'Mario Rossi',
      email: 'mario@example.com',
      password: 'password123',
      confirmPassword: 'password456'
    });

    component.confirmPassword.markAsTouched();
    component.form.updateValueAndValidity();
    fixture.detectChanges();

    expect(component.form.invalid).toBeTrue();
    expect(component.confirmPassword.errors?.['mismatch']).toBeTrue();
  });

  it('should show validation messages after submitting an invalid form', () => {
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.name.touched).toBeTrue();
    expect(component.email.touched).toBeTrue();
    expect(component.password.touched).toBeTrue();
    expect(component.confirmPassword.touched).toBeTrue();

    expect(compiled.textContent).toContain('Name is required.');
    expect(compiled.textContent).toContain('Email is required.');
    expect(compiled.textContent).toContain('Password is required.');
    expect(compiled.textContent).toContain('Please confirm your password.');
  });

  it('should be valid with correct values', () => {
    component.form.setValue({
      name: 'Mario Rossi',
      email: 'mario@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.form.updateValueAndValidity();
    fixture.detectChanges();

    expect(component.form.valid).toBeTrue();
  });

  it('should call console.log with payload on valid submit', () => {
    const consoleSpy = spyOn(console, 'log');

    component.form.setValue({
      name: 'Mario Rossi',
      email: 'mario@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.submit();

    expect(consoleSpy).toHaveBeenCalledWith('Register payload', {
      name: 'Mario Rossi',
      email: 'mario@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
  });

  it('should render the log in footer link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footerLink = compiled.querySelector('.auth-footer-link');

    expect(footerLink).toBeTruthy();
    expect(footerLink?.textContent?.trim()).toBe('Log in');
  });
});