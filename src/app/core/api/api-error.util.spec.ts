import { HttpErrorResponse } from '@angular/common/http';

import { extractApiError, getApiErrorMessage, toUserFacingApiError } from './api-error.util';

describe('api-error.util', () => {
    it('extracts backend ApiError payloads from HttpErrorResponse', () => {
        const error = new HttpErrorResponse({
            status: 409,
            error: {
                code: 'DUPLICATE_MATCH_PROPOSAL',
                message: 'A match proposal already exists.',
            },
        });

        expect(extractApiError(error)).toEqual(
            jasmine.objectContaining({
                code: 'DUPLICATE_MATCH_PROPOSAL',
                message: 'A match proposal already exists.',
                status: 409,
            }),
        );
    });

    it('preserves backend ApiError code and message on user-facing errors', () => {
        const error = new HttpErrorResponse({
            status: 422,
            error: {
                code: 'PHONE_NUMBER_REQUIRED',
                message: 'Phone number is required.',
            },
        });

        const result = toUserFacingApiError(error, 'Please update your profile.');

        expect(result.message).toBe('Phone number is required.');
        expect(result.code).toBe('PHONE_NUMBER_REQUIRED');
        expect(result.apiError?.message).toBe('Phone number is required.');
    });

    it('returns fallback errors when no stable backend code exists', () => {
        const result = toUserFacingApiError(
            new Error('Network failed'),
            'Something went wrong.',
        );

        expect(result.message).toBe('Something went wrong.');
        expect(result.code).toBeUndefined();
        expect(result.apiError).toBeUndefined();
    });

    it('gets a backend message from ApiError payloads', () => {
        const result = getApiErrorMessage(
            new HttpErrorResponse({
                status: 404,
                error: {
                    code: 'CONTACT_INVITEE_NOT_FOUND',
                    message: 'No account exists for that email address yet.',
                },
            }),
            'Fallback.',
        );

        expect(result).toBe('No account exists for that email address yet.');
    });

    it('gets a backend detail from ProblemDetail ApiError payloads', () => {
        const result = getApiErrorMessage(
            new HttpErrorResponse({
                status: 404,
                error: {
                    status: 404,
                    code: 'USER_NOT_FOUND',
                    title: 'Not Found',
                    detail: 'No account exists for that email address yet. You can invite only existing users.',
                    path: '/api/v1/contacts/invitations',
                    type: 'about:blank',
                },
            }),
            'Fallback.',
        );

        expect(result).toBe('No account exists for that email address yet. You can invite only existing users.');
    });

    it('gets a backend message from unstructured payloads', () => {
        const result = getApiErrorMessage(
            new HttpErrorResponse({
                status: 404,
                error: {
                    message: 'You can invite only existing users.',
                },
            }),
            'Fallback.',
        );

        expect(result).toBe('You can invite only existing users.');
    });

    it('gets a backend detail from plain error-shaped objects', () => {
        const result = getApiErrorMessage(
            {
                error: {
                    detail: 'Profile save failed.',
                },
            },
            'Fallback.',
        );

        expect(result).toBe('Profile save failed.');
    });
});
