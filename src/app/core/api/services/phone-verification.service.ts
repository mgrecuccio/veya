import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { extractApiError } from '../api-error.util';
import {
  PhoneVerificationResponse,
  ResendPhoneVerificationResponse,
} from '../model/phone-verification-response.model';
import { VerifyPhoneOtpRequest } from '../request/verify-phone-otp.request';

export interface PhoneVerificationError {
  code:
    | 'INVALID_CODE'
    | 'EXPIRED_OR_MISSING'
    | 'ALREADY_VERIFIED'
    | 'RATE_LIMITED'
    | 'AUTH_REQUIRED'
    | 'INVALID_REQUEST'
    | 'USER_NOT_FOUND'
    | 'SERVICE_UNAVAILABLE'
    | 'SERVER_ERROR'
    | 'NETWORK'
    | 'API';
  message: string;
  backendCode?: string;
}

@Injectable({ providedIn: 'root' })
export class PhoneVerificationService {
  private readonly http = inject(HttpClient);
  private readonly otpApiUrl = `${environment.apiBaseUrl}/api/v1/otp`;
  private readonly verifyApiUrl = `${this.otpApiUrl}/verify`;

  verify(payload: VerifyPhoneOtpRequest): Observable<PhoneVerificationResponse> {
    return this.http
      .post<PhoneVerificationResponse>(this.verifyApiUrl, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.mapError(error)));
  }

  resend(): Observable<ResendPhoneVerificationResponse> {
    return this.http
      .post<ResendPhoneVerificationResponse>(
        `${this.otpApiUrl}/resend-phone-verification`,
        null,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.mapError(error)));
  }

  private mapError(error: HttpErrorResponse): Observable<never> {
    const apiError = extractApiError(error);
    if (error.status === 0) {
      return throwError(() => ({
        code: 'NETWORK',
        message: 'Unable to reach the server. Please try again.',
      } satisfies PhoneVerificationError));
    }

    const mappedError = this.mapBackendCode(apiError?.code);
    if (mappedError) {
      return throwError(() => mappedError);
    }

    // Status fallbacks keep authentication and rate limiting safe if an
    // intermediary returns a response without the contract's ProblemDetail.
    if (error.status === 401) {
      return throwError(() => this.error(
        'AUTH_REQUIRED',
        'Your session has expired. Please log in again.',
      ));
    }

    if (error.status === 429) {
      return throwError(() => this.error(
        'RATE_LIMITED',
        'Please wait a few minutes before requesting another code.',
      ));
    }

    return throwError(() => ({
      code: 'API',
      message: 'Something went wrong. Please try again.',
      backendCode: apiError?.code,
    } satisfies PhoneVerificationError));
  }

  private mapBackendCode(
    backendCode: string | undefined,
  ): PhoneVerificationError | null {
    switch (backendCode) {
      case 'INVALID_VERIFICATION_CODE':
        return this.error(
          'INVALID_CODE',
          'Invalid code. Please try again.',
          backendCode,
        );
      case 'EXPIRED_VERIFICATION':
      case 'INVALID_VERIFICATION_EXCEPTION':
        return this.error(
          'EXPIRED_OR_MISSING',
          'Code expired. Request a new one.',
          backendCode,
        );
      case 'ALREADY_VERIFIED':
        return this.error(
          'ALREADY_VERIFIED',
          'Phone number is already verified.',
          backendCode,
        );
      case 'TOO_MANY_ATTEMPTS':
        return this.error(
          'RATE_LIMITED',
          'Please wait a few minutes before requesting another code.',
          backendCode,
        );
      case 'AUTHENTICATION_REQUIRED':
      case 'UNSUPPORTED_AUTHENTICATION':
      case 'BAD_CREDENTIALS':
        return this.error(
          'AUTH_REQUIRED',
          'Your session has expired. Please log in again.',
          backendCode,
        );
      case 'VALIDATION_ERROR':
      case 'MALFORMED_JSON':
      case 'INVALID_REQUEST':
        return this.error(
          'INVALID_REQUEST',
          'The verification request was invalid. Please try again.',
          backendCode,
        );
      case 'USER_NOT_FOUND':
        return this.error(
          'USER_NOT_FOUND',
          'Your account could not be found. Please log in again.',
          backendCode,
        );
      case 'PHONE_VERIFICATION_EXCEPTION':
        return this.error(
          'SERVICE_UNAVAILABLE',
          'Verification is temporarily unavailable. Please try again later.',
          backendCode,
        );
      case 'INTERNAL_SERVER_ERROR':
        return this.error(
          'SERVER_ERROR',
          'Something went wrong. Please try again.',
          backendCode,
        );
      default:
        return null;
    }
  }

  private error(
    code: PhoneVerificationError['code'],
    message: string,
    backendCode?: string,
  ): PhoneVerificationError {
    return { code, message, backendCode };
  }
}
