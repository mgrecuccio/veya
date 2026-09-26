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
    | 'RATE_LIMITED'
    | 'AUTH_REQUIRED'
    | 'NETWORK'
    | 'API';
  message: string;
  backendCode?: string;
}

@Injectable({ providedIn: 'root' })
export class PhoneVerificationService {
  private readonly http = inject(HttpClient);
  private readonly otpApiUrl = `${environment.apiBaseUrl}/api/v1/otp`;
  private readonly verifyApiUrl = `${environment.apiBaseUrl}/api/v1/otp`;

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

    if (error.status === 401) {
      return throwError(() => ({
        code: 'AUTH_REQUIRED',
        message: 'Your session has expired. Please log in again.',
        backendCode: apiError?.code,
      } satisfies PhoneVerificationError));
    }

    if (error.status === 429) {
      return throwError(() => ({
        code: 'RATE_LIMITED',
        message: 'Please wait a few minutes before requesting another code.',
      } satisfies PhoneVerificationError));
    }

    if (apiError?.code === 'INVALID_VERIFICATION_CODE') {
      return throwError(() => ({
        code: 'INVALID_CODE',
        message: 'Invalid code. Please try again.',
        backendCode: apiError.code,
      } satisfies PhoneVerificationError));
    }

    if (
      apiError?.code === 'EXPIRED_VERIFICATION' ||
      apiError?.code === 'INVALID_VERIFICATION_EXCEPTION'
    ) {
      return throwError(() => ({
        code: 'EXPIRED_OR_MISSING',
        message: 'Code expired. Request a new one.',
        backendCode: apiError.code,
      } satisfies PhoneVerificationError));
    }

    return throwError(() => ({
      code: 'API',
      message: apiError?.message || 'Something went wrong. Please try again.',
      backendCode: apiError?.code,
    } satisfies PhoneVerificationError));
  }
}
