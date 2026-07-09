import { HttpErrorResponse } from '@angular/common/http';

import { extractApiError, toUserFacingApiError } from './api-error.util';

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

    it('preserves backend ApiError code on user-facing errors', () => {
        const error = new HttpErrorResponse({
            status: 422,
            error: {
                code: 'PHONE_NUMBER_REQUIRED',
                message: 'Phone number is required.',
            },
        });

        const result = toUserFacingApiError(error, 'Please update your profile.');

        expect(result.message).toBe('Please update your profile.');
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
});
