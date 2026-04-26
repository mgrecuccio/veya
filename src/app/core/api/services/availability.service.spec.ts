import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AvailabilityService } from "./availability.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { AvailabilityRuleView } from "../model/availability-rule-view.model";
import { environment } from "src/environments/environment";
import { EffectiveAvailabilityView } from "../model/effective-availability-view.model";
import { AvailabilityOverrideView } from "../model/availability-override-view-model";
import { CreateAvailabilityRuleRequest } from "../request/create-availability-rule.request";
import { UpdateAvailabilityRuleRequest } from "../model/update-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "../request/create-availability-override.request";


describe('AvailabilityService', () => {
    let service: AvailabilityService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AvailabilityService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(AvailabilityService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should call availaility rules', () => {
        let mockRules: AvailabilityRuleView[] = [
            {
                id: 1,
                userId: 2,
                dayOfWeek: 'MONDAY',
                startTime: '18:00',
                endTime: '20:00',
                channelType: 'CHAT',
                enabled: false,
                createdAt: '2026-04-10T09:00:00.000Z',
                updatedAt: '2026-04-10T09:00:00.000Z'
            },
        ];

        service.getRules().subscribe(rules => {
            expect(rules).toHaveSize(1);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/availability/rules`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRules);
    });

    it('should call effective availability', () => {
        const from = '2026-04-10T00:00:00.000Z';
        const to = '2026-04-10T00:00:00.000Z';

        let mockAvailabilities: EffectiveAvailabilityView[] = [
            {
                startDateTime: '2026-04-10T09:00:00.000Z',
                endDateTime:'2026-04-10T10:00:00.000Z',
            },
        ];

        service.getEffectiveAvailability(from, to).subscribe(availabilities => {
            expect(availabilities).toEqual(mockAvailabilities);
        });

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/effective`
        );

        expect(req.request.method).toBe('GET');

        expect(req.request.params.get('from')).toBe(from);
        expect(req.request.params.get('to')).toBe(to);

        req.flush(mockAvailabilities);
    });

    it('should call overrides without query params by default', () => {
        const mockOverrides: AvailabilityOverrideView[] = [];

        service.getOverrides().subscribe(overrides => {
            expect(overrides).toEqual(mockOverrides);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/availability/overrides`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.keys()).toEqual([]);

        req.flush(mockOverrides);
    });

    it('should call overrides with endsAfter query param', () => {
        const endsAfter = '2026-04-24T21:30:00.000Z';
        const mockOverrides: AvailabilityOverrideView[] = [
            {
                id: 1,
                userId: 2,
                startDateTime: '2026-04-24T20:00:00.000Z',
                endDateTime: '2026-04-24T22:00:00.000Z',
                type: 'AVAILABLE',
                createdAt: '2026-04-24T19:00:00.000Z',
            },
        ];

        service.getOverrides(endsAfter).subscribe(overrides => {
            expect(overrides).toEqual(mockOverrides);
        });

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/overrides`
        );

        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('endsAfter')).toBe(endsAfter);

        req.flush(mockOverrides);
    });

    it('should create a rule', () => {

        let mockRequest: CreateAvailabilityRuleRequest = {
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            channelType: 'CHAT',
        };

        let mockAvailabilityRuleView: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            channelType: 'CHAT',
            enabled: true,
            createdAt: '2026-04-24T19:00:00.000Z',
            updatedAt: '2026-04-24T19:00:00.000Z',
        };

        service.createRule(mockRequest).subscribe(view => {
            expect(view).toEqual(mockAvailabilityRuleView);
        });

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/rules`
        );

        expect(req.request.method).toBe('POST');
        req.flush(mockAvailabilityRuleView);
    });

    it('should update a rule', () => {
        let ruleId = 1;

        let mockRequest: UpdateAvailabilityRuleRequest = {
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            channelType: 'CHAT',
            enabled: true,
        };

        let mockAvailabilityRuleView: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '18:00',
            channelType: 'CHAT',
            enabled: true,
            createdAt: '2026-04-24T19:00:00.000Z',
            updatedAt: '2026-04-24T19:00:00.000Z',
        };

        service.updateRule(ruleId, mockRequest).subscribe(view => {
            expect(view).toEqual(mockAvailabilityRuleView);
        });

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/rules/${ruleId}`
        );

        expect(req.request.method).toBe('PUT');
        req.flush(mockAvailabilityRuleView);
    });

    it('should delete a rule', () => {
        let ruleId = 1;

        service.deleteRule(ruleId).subscribe();

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/rules/${ruleId}`
        );

        expect(req.request.method).toBe('DELETE');
    });

    it('should create an override', () => {
        let mockRequest: CreateAvailabilityOverrideRequest = {
            startDateTime: '18:00',
            endDateTime: '20:00',
            type: 'AVAILABLE',
        };

        let mockOverride: AvailabilityOverrideView = {
            id: 1,
            userId: 2,
            startDateTime: '18:00',
            endDateTime: '20:00',
            type: 'AVAILABLE',
            createdAt: '2026-04-24T19:00:00.000Z',
        }

        service.createOverride(mockRequest).subscribe((override) => {
            expect(override).toEqual(mockOverride);
        });

        const req = httpMock.expectOne((request) =>
            request.url === `${environment.apiBaseUrl}/api/v1/availability/overrides`
        );

        expect(req.request.method).toBe('POST');
        req.flush(mockOverride);
    });
});
