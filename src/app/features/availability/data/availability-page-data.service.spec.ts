import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { CreateAvailabilityOverrideRequest } from "src/app/core/api/request/create-availability-override.request";
import { CreateAvailabilityRuleRequest } from "src/app/core/api/request/create-availability-rule.request";
import { AvailabilityService } from "src/app/core/api/services/availability.service";
import { AvailabilityPageDataService } from "./availability-page-data.service";

describe('AvailabilityPageDataService', () => {
    let service: AvailabilityPageDataService;
    let availabilityService: jasmine.SpyObj<AvailabilityService>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AvailabilityPageDataService,
                {
                    provide: AvailabilityService,
                    useValue: jasmine.createSpyObj<AvailabilityService>('AvailabilityService', [
                        'getRules',
                        'getOverrides',
                        'getEffectiveAvailability',
                        'createRule',
                        'updateRule',
                        'deleteRule',
                        'createOverride',
                    ]),
                },
            ],
        });

        service = TestBed.inject(AvailabilityPageDataService);
        availabilityService = TestBed.inject(AvailabilityService) as jasmine.SpyObj<AvailabilityService>;
    });

    function mockBase(): void {
        availabilityService.getRules.and.returnValue(
            of([
                {
                    id: 1,
                    userId: 2,
                    dayOfWeek: 'MONDAY',
                    startTime: '09:00:00',
                    endTime: '17:00:00',
                    channelType: 'CHAT',
                    enabled: true,
                    createdAt: '2026-04-24T09:00:00.000Z',
                    updatedAt: '2026-04-24T09:00:00.000Z',
                },
            ]),
        );

        availabilityService.getOverrides.and.returnValue(
            of([
                {
                    id: 2,
                    userId: 2,
                    startDateTime: '2026-04-25T09:00:00.000Z',
                    endDateTime: '2026-04-25T10:00:00.000Z',
                    type: 'UNAVAILABLE',
                    createdAt: '2026-04-24T09:00:00.000Z',
                },
            ]),
        );

        availabilityService.getEffectiveAvailability.and.returnValue(
            of([
                {
                    startDateTime: '2026-04-25T09:00:00.000Z',
                    endDateTime: '2026-04-25T10:00:00.000Z',
                },
            ]),
        );
    }

    it('loads availability page data from the required API calls', (done) => {
        mockBase();

        service.getPageData().subscribe((data) => {
            expect(data.rules).toHaveSize(1);
            expect(data.overrides).toHaveSize(1);
            expect(data.effective).toHaveSize(1);
            expect(data.overrideEndsAfter).toContain('T');
            expect(availabilityService.getOverrides).toHaveBeenCalledWith(data.overrideEndsAfter);
            expect(availabilityService.getEffectiveAvailability).toHaveBeenCalled();
            done();
        });
    });

    it('fails the whole availability page when a core request fails', (done) => {
        mockBase();
        availabilityService.getRules.and.returnValue(
            throwError(() => new Error('Internal Server Error')),
        );

        service.getPageData().subscribe({
            next: () => fail('unexpected data'),
            error: (error: Error) => {
                expect(error.message).toBe('We couldn’t load your availability right now. Please try again.');
                done();
            },
        });
    });

    it('delegates createRule to AvailabilityService', (done) => {
        const request: CreateAvailabilityRuleRequest = {
            dayOfWeek: 'MONDAY',
            startTime: '09:00:00',
            endTime: '17:00:00',
            channelType: 'CHAT',
        };
        const response: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            ...request,
            enabled: true,
            createdAt: '2026-04-24T09:00:00.000Z',
            updatedAt: '2026-04-24T09:00:00.000Z',
        };
        availabilityService.createRule.and.returnValue(of(response));

        service.createRule(request).subscribe((result) => {
            expect(availabilityService.createRule).toHaveBeenCalledWith(request);
            expect(result).toEqual(response);
            done();
        });
    });

    it('delegates updateRule to AvailabilityService', (done) => {
        const request = {
            dayOfWeek: 'MONDAY' as const,
            startTime: '09:00:00',
            endTime: '17:00:00',
            channelType: 'CHAT' as const,
            enabled: true,
        };
        const response: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            ...request,
            createdAt: '2026-04-24T09:00:00.000Z',
            updatedAt: '2026-04-24T09:00:00.000Z',
        };
        availabilityService.updateRule.and.returnValue(of(response));

        service.updateRule(1, request).subscribe((result) => {
            expect(availabilityService.updateRule).toHaveBeenCalledWith(1, request);
            expect(result).toEqual(response);
            done();
        });
    });

    it('delegates deleteRule to AvailabilityService', (done) => {
        availabilityService.deleteRule.and.returnValue(of(void 0));

        service.deleteRule(1).subscribe(() => {
            expect(availabilityService.deleteRule).toHaveBeenCalledWith(1);
            done();
        });
    });

    it('delegates createOverride to AvailabilityService', (done) => {
        const request: CreateAvailabilityOverrideRequest = {
            startDateTime: '2026-04-25T09:00:00.000Z',
            endDateTime: '2026-04-25T10:00:00.000Z',
            type: 'UNAVAILABLE',
        };
        const response = {
            id: 1,
            userId: 2,
            ...request,
            createdAt: '2026-04-24T09:00:00.000Z',
        };
        availabilityService.createOverride.and.returnValue(of(response));

        service.createOverride(request).subscribe((result) => {
            expect(availabilityService.createOverride).toHaveBeenCalledWith(request);
            expect(result).toEqual(response);
            done();
        });
    });
});
