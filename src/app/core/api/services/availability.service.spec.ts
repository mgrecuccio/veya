import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AvailabilityService } from "./availability.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { AvailabilityRuleView } from "../model/availability-rule-view.model";
import { environment } from "src/environments/environment";
import { EffectiveAvailabilityView } from "../model/effective-availability-view.model";


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
                id: 'rule-id',
                dayOfWeek: 5,
                startTime: '18:00',
                endTime: '20:00',
                channelType: 'CHAT',
                enabled: true,
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
});