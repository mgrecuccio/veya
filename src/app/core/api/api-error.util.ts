import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from './model/api-error.model';

export type ApiErrorCode = string;

export interface UserFacingApiError extends Error {
    code?: ApiErrorCode;
    apiError?: ApiError;
}

export function extractApiError(error: unknown): ApiError | null {
    if (!(error instanceof HttpErrorResponse)) {
        return null;
    }

    const payload = error.error;

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const maybeApiError = payload as Partial<ApiError>;

    if (typeof maybeApiError.code !== 'string') {
        return null;
    }

    return {
        code: maybeApiError.code,
        message: typeof maybeApiError.message === 'string' ? maybeApiError.message : error.message,
        details: maybeApiError.details,
        path: maybeApiError.path,
        status: typeof maybeApiError.status === 'number' ? maybeApiError.status : error.status,
        timestamp: maybeApiError.timestamp,
    };
}

export function toUserFacingApiError(
    error: unknown,
    fallbackMessage: string,
): UserFacingApiError {
    const apiError = extractApiError(error);
    const userFacingError = new Error(fallbackMessage) as UserFacingApiError;

    if (apiError) {
        userFacingError.code = apiError.code;
        userFacingError.apiError = apiError;
    }

    return userFacingError;
}
