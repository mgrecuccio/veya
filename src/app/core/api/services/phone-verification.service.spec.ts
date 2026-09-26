import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  PhoneVerificationError,
  PhoneVerificationService,
} from './phone-verification.service';

describe('PhoneVerificationService', () => {
  let service: PhoneVerificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PhoneVerificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('verifies the initial OTP without a verification id', () => {
    service.verify({ otpCode: '123456' })
      .subscribe((response) => expect(response).toEqual({ userId: 42, verified: true }));

    const request = httpMock.expectOne('http://localhost:8080/api/v1/otp');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      otpCode: '123456',
    });
    request.flush({ userId: 42, verified: true });
  });

  it('supports verification with the id returned by resend', () => {
    service.verify({ otpCode: '123456', verificationId: 'verification-id' })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/otp');
    expect(request.request.body).toEqual({
      otpCode: '123456',
      verificationId: 'verification-id',
    });
    request.flush({ userId: 42, verified: true });
  });

  it('resends without a phone number or request payload', () => {
    service.resend().subscribe((response) => {
      expect(response.verificationId).toBe('new-verification-id');
    });

    const request = httpMock.expectOne(
      'http://localhost:8080/api/v1/otp/resend-phone-verification',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ verificationId: 'new-verification-id' });
  });

  it('maps HTTP 429 to a calm rate-limit error', () => {
    service.resend().subscribe({
      next: () => fail('Expected an error'),
      error: (error: PhoneVerificationError) => {
        expect(error.code).toBe('RATE_LIMITED');
        expect(error.message).toBe(
          'Please wait a few minutes before requesting another code.',
        );
      },
    });

    const request = httpMock.expectOne(
      'http://localhost:8080/api/v1/otp/resend-phone-verification',
    );
    request.flush({}, { status: 429, statusText: 'Too Many Requests' });
  });

  it('maps the exact invalid-code backend error', () => {
    service.verify({ otpCode: '000000', verificationId: 'verification-id' })
      .subscribe({
        next: () => fail('Expected an error'),
        error: (error: PhoneVerificationError) => {
          expect(error.code).toBe('INVALID_CODE');
          expect(error.backendCode).toBe('INVALID_VERIFICATION_CODE');
          expect(error.message).toBe('Invalid code. Please try again.');
        },
      });

    const request = httpMock.expectOne('http://localhost:8080/api/v1/otp');
    request.flush(
      { code: 'INVALID_VERIFICATION_CODE', detail: 'Wrong code.' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('maps the exact missing-verification backend error', () => {
    service.verify({ otpCode: '123456' }).subscribe({
      next: () => fail('Expected an error'),
      error: (error: PhoneVerificationError) => {
        expect(error.code).toBe('EXPIRED_OR_MISSING');
        expect(error.backendCode).toBe('INVALID_VERIFICATION_EXCEPTION');
        expect(error.message).toBe('Code expired. Request a new one.');
      },
    });

    const request = httpMock.expectOne('http://localhost:8080/api/v1/otp');
    request.flush(
      {
        code: 'INVALID_VERIFICATION_EXCEPTION',
        detail: 'Verification not found.',
      },
      { status: 404, statusText: 'Not Found' },
    );
  });

  it('maps HTTP 401 to an authentication error', () => {
    service.verify({ otpCode: '123456' }).subscribe({
      next: () => fail('Expected an error'),
      error: (error: PhoneVerificationError) => {
        expect(error.code).toBe('AUTH_REQUIRED');
      },
    });

    const request = httpMock.expectOne('http://localhost:8080/api/v1/otp');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
  });
});
