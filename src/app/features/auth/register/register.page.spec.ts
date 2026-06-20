import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterPage } from './register.page';
import { AuthService, AuthError } from 'src/app/core/auth/auth.service';
import { Router } from '@angular/router';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.detectChanges();
  });

  function fillValidForm(): void {
    component.form.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.form.patchValue({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    component.submit();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call authService.register with mapped payload', () => {
    spyOn(Intl, 'DateTimeFormat').and.returnValue({
      resolvedOptions: () => ({
        timeZone: 'Europe/Brussels',
      } as Intl.ResolvedDateTimeFormatOptions),
    } as Intl.DateTimeFormat);

    authServiceSpy.register.and.returnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      })
    );

    fillValidForm();

    component.submit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
      displayName: 'John Doe',
      timezone: 'Europe/Brussels',
    });
  });

  it('should navigate to /home on successful register', () => {
    authServiceSpy.register.and.returnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      })
    );

    fillValidForm();

    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home', { replaceUrl: true });
  });

  it('should set emailAlreadyExists error on register conflict', () => {
    const error: AuthError = {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email already exists.',
    };

    authServiceSpy.register.and.returnValue(
      throwError(() => error)
    );

    fillValidForm();

    component.submit();

    expect(component.form.controls.email.errors?.['emailAlreadyExists']).toBeTrue();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should set serverError for generic register error', () => {
    const error: AuthError = {
      code: 'UNKNOWN',
      message: 'Something went wrong.',
    };

    authServiceSpy.register.and.returnValue(
      throwError(() => error)
    );

    fillValidForm();

    component.submit();

    expect(component.serverError).toBe('Something went wrong.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not call register when passwords do not match', () => {
    component.form.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });

    component.submit();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should expose name getter', () => {
    expect(component.name).toBe(component.form.controls.name);
  });

  it('should expose email getter', () => {
    expect(component.email).toBe(component.form.controls.email);
  });

  it('should expose password getter', () => {
    expect(component.password).toBe(component.form.controls.password);
  });

  it('should expose confirmPassword getter', () => {
    expect(component.confirmPassword).toBe(component.form.controls.confirmPassword);
  });

  it('should return true from isInvalid when control is invalid and touched', () => {
    component.form.controls.name.markAsTouched();
    component.form.controls.name.setValue('');

    expect(component.isInvalid('name')).toBeTrue();
  });

  it('should return false from isInvalid when control is valid', () => {
    component.form.controls.name.setValue('John');
    component.form.controls.name.markAsTouched();

    expect(component.isInvalid('name')).toBeFalse();
  });

  it('should normalize and submit a phone number in E.164 format', () => {
    authServiceSpy.register.and.returnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600
      })
    );

    fillValidForm();

    component.form.patchValue({
      phoneCountry: 'BE',
      phoneNational: '0470 12 34 56',
    });

    component.submit();

    expect(authServiceSpy.register).toHaveBeenCalledWith(
      jasmine.objectContaining({
        phoneNumber: '+32470123456',
      })
    );

  });

  it('should not submit an invalid phone number', () => {
    fillValidForm();

    component.form.patchValue({
      phoneCountry: 'BE',
      phoneNational: '123',
    });

    component.submit();

    expect(component.form.hasError('invalidPhoneNumber')).toBeTrue();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should allow the phone number to be empty', () => {
    authServiceSpy.register.and.returnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      })
    );

    fillValidForm();

    component.form.patchValue({
      phoneCountry: 'BE',
      phoneNational: '',
    });

    component.submit();

    const payload =
      authServiceSpy.register.calls.mostRecent().args[0];

    expect(payload.phoneNumber).toBeUndefined();
  });

});
