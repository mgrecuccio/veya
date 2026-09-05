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
        message:
            typeof maybeApiError.message === 'string'
                ? maybeApiError.message
                : typeof maybeApiError.detail === 'string'
                    ? maybeApiError.detail
                    : error.message,
        detail: typeof maybeApiError.detail === 'string' ? maybeApiError.detail : undefined,
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
    const userFacingError = new Error(
        getBackendApiErrorMessage(error) ?? fallbackMessage,
    ) as UserFacingApiError;

    if (apiError) {
        userFacingError.code = apiError.code;
        userFacingError.apiError = apiError;
    }

    return userFacingError;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    const backendMessage = getBackendApiErrorMessage(error);

    if (backendMessage) {
        return backendMessage;
    }

    return fallbackMessage;
}

function getBackendApiErrorMessage(error: unknown): string | null {
    if (error && typeof error === 'object') {
        const userFacingError = error as Partial<UserFacingApiError>;

        if (typeof userFacingError.apiError?.message === 'string') {
            return userFacingError.apiError.message;
        }
    }

    if (error instanceof HttpErrorResponse) {
        const apiError = extractApiError(error);

        if (apiError?.message) {
            return apiError.message;
        }
    }

    const payload =
        error instanceof HttpErrorResponse
            ? error.error
            : error && typeof error === 'object' && 'error' in error
                ? (error as { error: unknown }).error
                : null;

    if (typeof payload === 'string' && payload.trim()) {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const maybePayload = payload as Record<string, unknown>;

        if (typeof maybePayload['message'] === 'string') {
            return maybePayload['message'];
        }

        if (typeof maybePayload['detail'] === 'string') {
            return maybePayload['detail'];
        }

        if (typeof maybePayload['error'] === 'string') {
            return maybePayload['error'];
        }
    }

    return null;
}
