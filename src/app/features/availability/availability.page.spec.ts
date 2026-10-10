import { fakeAsync, flushMicrotasks, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AvailabilityPage } from "./availability.page";
import { AvailabilityPageDataService } from "./data/availability-page-data.service";
import { of, Subject, throwError } from "rxjs";
import { AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { AuthService } from "src/app/core/auth/auth.service";
import { AppToastService } from "src/app/shared/toast/app-toast.service";

describe('AbailabilityPage', () => {
    let fixture: any;
    let component: AvailabilityPage;
    let dataService: jasmine.SpyObj<AvailabilityPageDataService>;
    let appToastService: jasmine.SpyObj<AppToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AvailabilityPage],
            providers: [
                provideRouter([]),
                {
                    provide: AvailabilityPageDataService,
                    useValue: jasmine.createSpyObj<AvailabilityPageDataService>(
                        'AvailabilityPageDataService',
                        [
                            'getPageData',
                            'createRule',
                            'updateRule',
                            'deleteRule',
                            'createOverride',
                        ],
                    ),
                },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>(
                        'AppToastService',
                        ['show'],
                    ),
                },
                {
                    provide: AuthService,
                    useValue: {
                        authState$: of(createAuthTokens()),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvailabilityPage);
        component = fixture.componentInstance;
        dataService = TestBed.inject(AvailabilityPageDataService) as jasmine.SpyObj<AvailabilityPageDataService>;
        appToastService = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        appToastService.show.and.returnValue(Promise.resolve());
    });

    it('should emit loading then success', (done) => {
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                effective: [],
                timeZone: null,
            }),
        );

        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if(state.kind === 'success') {
                expect(states).toEqual(['loading', 'success']);
                done();
            }
        });
    });

    it('should emit loading then error when page load fails', (done) => {
        dataService.getPageData.and.returnValue(
            throwError(() => new Error('Load failed'))
        );

        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if(state.kind === 'error') {
                expect(states).toEqual(['loading', 'error']);
                done();
            }
        });
    });

    it('should reload when retry is called', () => {
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                effective: [],
                timeZone: null,
            }),
        );

        const sub = component.vmState$.subscribe();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.retry();
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

        sub.unsubscribe();
    });

    it('should refresh when returning to the tab after first entry', () => {
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                effective: [],
                timeZone: null,
            }),
        );

        const sub = component.vmState$.subscribe();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.ionViewWillEnter();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.ionViewWillEnter();
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

        sub.unsubscribe();
    });

    it('should group the next local day under Tomorrow', () => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date('2026-10-09T12:00:00Z'));

        try {
            dataService.getPageData.and.returnValue(
                of({
                    rules: [],
                    effective: [
                        {
                            startDateTime: '2026-10-10T09:00:00Z',
                            endDateTime: '2026-10-10T10:29:00Z',
                            channelType: 'CALL',
                        },
                    ],
                    timeZone: null,
                }),
            );

            fixture.detectChanges();

            const sections = Array.from(
                (fixture.nativeElement as HTMLElement).querySelectorAll('.preview-group'),
            ) as HTMLElement[];
            const tomorrowSection = sections.find((section) =>
                section.textContent?.includes('Tomorrow'),
            );
            const laterSection = sections.find((section) =>
                section.textContent?.includes('Later this week'),
            );

            expect(tomorrowSection?.querySelectorAll('.preview-slot').length).toBe(1);
            expect(laterSection?.querySelectorAll('.preview-slot').length).toBe(0);
        } finally {
            jasmine.clock().uninstall();
        }
    });

    it('should group and format the week in the profile time zone', () => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date('2026-10-09T12:00:00Z'));

        try {
            const lateEveningUtc = {
                startDateTime: '2026-10-09T22:30:00Z',
                endDateTime: '2026-10-09T23:00:00Z',
                channelType: 'CHAT' as const,
            };
            const states: any[] = [];
            dataService.getPageData.and.returnValues(
                of({ rules: [], effective: [lateEveningUtc], timeZone: 'UTC' }),
                of({ rules: [], effective: [lateEveningUtc], timeZone: 'Asia/Tokyo' }),
            );

            const sub = component.vmState$.subscribe((state) => states.push(state));
            component.retry();
            sub.unsubscribe();

            const [utcGroups, tokyoGroups] = states
                .filter((state) => state.kind === 'success')
                .map((state) => state.data.effectiveGroups);

            expect(utcGroups[0].items.length).toBe(1);
            expect(utcGroups[0].items[0].timeRange).toMatch(/^(22|10):30/);
            expect(tokyoGroups[0].items.length).toBe(0);
            expect(tokyoGroups[1].items.length).toBe(1);
            expect(tokyoGroups[1].items[0].timeRange).toContain('07:30');
        } finally {
            jasmine.clock().uninstall();
        }
    });

    it('should read the override dates as wall-clock time in the profile time zone', () => {
        dataService.getPageData.and.returnValue(
            of({ rules: [], effective: [], timeZone: 'Asia/Tokyo' }),
        );
        dataService.createOverride.and.returnValue(of({} as any));
        const sub = component.vmState$.subscribe();

        component.openCreateOverride();
        component.overrideForm.setValue({
            startDateTime: '2100-01-01T09:00',
            endDateTime: '2100-01-01T11:00',
            type: 'UNAVAILABLE',
        });
        component.submitOverride();

        expect(dataService.createOverride).toHaveBeenCalledWith({
            startDateTime: '2100-01-01T00:00:00.000Z',
            endDateTime: '2100-01-01T02:00:00.000Z',
            type: 'UNAVAILABLE',
        });

        sub.unsubscribe();
    });

    it('should open the create rule panel and fill the form with default data', () => {
        component.openCreateRule();
        expect(component.ruleFormExpanded()).toBeTrue();
        expect(component.editingRuleId()).toBeNull();

        expect(component.ruleForm.getRawValue()).toEqual({
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });
    });

    it('should close the create rule panel', () => {
        component.closeRuleForm();
        expect(component.ruleFormExpanded()).toBeFalse();
        expect(component.editingRuleId()).toBeNull();
    });

    it('should open the rule form in edit mode', () => {
        let mockAvailabilityRuleView: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            dayOfWeek: 'MONDAY',
            startTime: '12:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
            createdAt: '2026-04-26',
            updatedAt: '2026-04-26',
        };

        let rule = {
            id: 1,
            dayLabel: 'MO',
            timeRange: '12:00-17:00',
            channelLabel: 'Chat',
            enabled: true,
            raw: mockAvailabilityRuleView
        };

        component.openEditRule(rule);

        expect(component.editingRuleId()).toEqual(rule.id);
        expect(component.ruleFormExpanded()).toBeTrue();
        expect(component.ruleForm.getRawValue()).toEqual({
            dayOfWeek: 'MONDAY',
            startTime: '12:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });
    });

    it('should delete a rule', () => {
        const response$ = new Subject<void>();
        dataService.deleteRule.and.returnValue(response$);
        spyOn(component, 'retry');

        const mockAvailabilityRuleView: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            dayOfWeek: 'MONDAY',
            startTime: '12:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
            createdAt: '2026-04-26',
            updatedAt: '2026-04-26',
        };

        const rule = {
            id: 1,
            dayLabel: 'MO',
            timeRange: '12:00-17:00',
            channelLabel: 'Chat',
            enabled: true,
            raw: mockAvailabilityRuleView
        };

        component.deleteRule(rule);

        expect(component.rowActionBusyId()).toBe(rule.id);
        expect(dataService.deleteRule).toHaveBeenCalledWith(rule.id);

        response$.next();
        response$.complete();

        expect(component.rowActionBusyId()).toBeNull();
        expect(component.retry).toHaveBeenCalled();
        expect(appToastService.show).toHaveBeenCalledWith('Rule deleted.', 'success');
    });

    it('should trigger delete from the rendered rule remove button', () => {
        dataService.getPageData.and.returnValue(
            of({
                rules: [
                    {
                        id: 1,
                        userId: 2,
                        dayOfWeek: 'MONDAY',
                        startTime: '12:00',
                        endTime: '17:00',
                        channelType: 'CHAT',
                        enabled: true,
                        createdAt: '2026-04-26',
                        updatedAt: '2026-04-26',
                    },
                ],
                effective: [],
                timeZone: null,
            }),
        );
        dataService.deleteRule.and.returnValue(of(void 0));

        fixture.detectChanges();

        const actionButtons = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('.item-action-button'),
        ) as HTMLButtonElement[];

        expect(actionButtons.map((button) => button.textContent?.trim())).toEqual([
            'Change',
            'Remove',
        ]);

        actionButtons[1].click();

        expect(dataService.deleteRule).toHaveBeenCalledWith(1);
    });

    it('should ignore the delete rule if another row action is busy', () => {
        component.rowActionBusyId.set(2);
        spyOn(component, 'retry');

        const mockAvailabilityRuleView: AvailabilityRuleView = {
            id: 1,
            userId: 2,
            dayOfWeek: 'MONDAY',
            startTime: '12:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
            createdAt: '2026-04-26',
            updatedAt: '2026-04-26',
        };

        const rule = {
            id: 1,
            dayLabel: 'MO',
            timeRange: '12:00-17:00',
            channelLabel: 'Chat',
            enabled: true,
            raw: mockAvailabilityRuleView
        };

        component.deleteRule(rule);
        expect(dataService.deleteRule).toHaveBeenCalledTimes(0);
        expect(component.retry).toHaveBeenCalledTimes(0);
    });

    it('should handle rule submit success', fakeAsync(() => {
        dataService.createRule.and.returnValue(of({} as any));
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                effective: [],
                timeZone: null,
            }),
        );

        spyOn(component, 'retry');

        component.ruleFormExpanded.set(true);
        component.ruleForm.setValue({
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });

        component.submitRule();

        expect(component.submittingRule()).toBeFalse();
        expect(component.ruleFormExpanded()).toBeFalse();
        expect(component.retry).toHaveBeenCalled();

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('Rule added.', 'success');
    }));

    it('should open an error toast and not submit rule when startTime >= endTime', fakeAsync(() => {
        dataService.createRule.and.returnValue(of({} as any));
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                effective: [],
                timeZone: null,
            }),
        );

        spyOn(component, 'retry');

        component.ruleFormExpanded.set(true);
        component.ruleForm.setValue({
            dayOfWeek: 'MONDAY',
            startTime: '19:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });

        component.submitRule();

        expect(component.submittingRule()).toBeFalse();
        expect(component.ruleFormExpanded()).toBeTrue();
        expect(component.retry).toHaveBeenCalledTimes(0);

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('Start time must be before end time.', 'danger');
    }));

    it('should show a toast error when creating rule API call fails', fakeAsync(() => {
        dataService.createRule.and.returnValue(
            throwError(() => new Error('Load failed'))
        );

        component.ruleFormExpanded.set(true);
        component.ruleForm.setValue({
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });

        spyOn(component, 'retry');

        component.submitRule();

        expect(component.submittingRule()).toBeFalse();
        expect(component.ruleFormExpanded()).toBeTrue();
        expect(component.retry).toHaveBeenCalledTimes(0);

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('We couldn’t save that rule right now.', 'danger');
    }));

    it('should open the create override panel and fill the form with default data', () => {
        component.openCreateOverride();

        const formValue = component.overrideForm.getRawValue();
        const start = new Date(formValue.startDateTime);
        const end = new Date(formValue.endDateTime);

        expect(component.overrideFormExpanded()).toBeTrue();
        expect(component.overrideMinDateTime()).toBe(formValue.startDateTime);
        expect(formValue.type).toBe('UNAVAILABLE');
        expect(formValue.startDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        expect(formValue.endDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        expect(end.getTime() - start.getTime()).toBe(2 * 60 * 60 * 1000);
    });

    it('should close the override form', () => {
        component.overrideFormExpanded.set(true);

        component.closeOverrideForm();

        expect(component.overrideFormExpanded()).toBeFalse();
    });

    it('should handle override submit success', fakeAsync(() => {
        dataService.createOverride.and.returnValue(of({} as any));
        spyOn(component, 'retry');

        component.overrideFormExpanded.set(true);
        component.overrideForm.setValue({
            startDateTime: '2100-01-01T09:00',
            endDateTime: '2100-01-01T11:00',
            type: 'UNAVAILABLE',
        });

        component.submitOverride();

        expect(dataService.createOverride).toHaveBeenCalledWith({
            startDateTime: new Date('2100-01-01T09:00').toISOString(),
            endDateTime: new Date('2100-01-01T11:00').toISOString(),
            type: 'UNAVAILABLE',
        });
        expect(component.submittingOverride()).toBeFalse();
        expect(component.overrideFormExpanded()).toBeFalse();
        expect(component.retry).toHaveBeenCalled();

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('Exception added', 'success');
    }));

    it('should open an error toast and not submit override when start is in the past', fakeAsync(() => {
        dataService.createOverride.and.returnValue(of({} as any));
        spyOn(component, 'retry');

        component.overrideFormExpanded.set(true);
        component.overrideForm.setValue({
            startDateTime: '2000-01-01T09:00',
            endDateTime: '2000-01-01T11:00',
            type: 'UNAVAILABLE',
        });

        component.submitOverride();

        expect(dataService.createOverride).not.toHaveBeenCalled();
        expect(component.submittingOverride()).toBeFalse();
        expect(component.overrideFormExpanded()).toBeTrue();
        expect(component.retry).not.toHaveBeenCalled();
        expect(component.overrideMinDateTime()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('Start date must be now or in the future.', 'danger');
    }));

    it('should open an error toast and not submit override when start is after end', fakeAsync(() => {
        dataService.createOverride.and.returnValue(of({} as any));
        spyOn(component, 'retry');

        component.overrideFormExpanded.set(true);
        component.overrideForm.setValue({
            startDateTime: '2100-01-01T11:00',
            endDateTime: '2100-01-01T09:00',
            type: 'UNAVAILABLE',
        });

        component.submitOverride();

        expect(dataService.createOverride).not.toHaveBeenCalled();
        expect(component.submittingOverride()).toBeFalse();
        expect(component.overrideFormExpanded()).toBeTrue();
        expect(component.retry).not.toHaveBeenCalled();

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('Start date must be before end date.', 'danger');
    }));

    it('should show an error toast when creating override API call fails', fakeAsync(() => {
        dataService.createOverride.and.returnValue(
            throwError(() => new Error('Create override failed')),
        );
        spyOn(component, 'retry');

        component.overrideFormExpanded.set(true);
        component.overrideForm.setValue({
            startDateTime: '2100-01-01T09:00',
            endDateTime: '2100-01-01T11:00',
            type: 'UNAVAILABLE',
        });

        component.submitOverride();

        expect(dataService.createOverride).toHaveBeenCalledWith({
            startDateTime: new Date('2100-01-01T09:00').toISOString(),
            endDateTime: new Date('2100-01-01T11:00').toISOString(),
            type: 'UNAVAILABLE',
        });
        expect(component.submittingOverride()).toBeFalse();
        expect(component.overrideFormExpanded()).toBeTrue();
        expect(component.retry).not.toHaveBeenCalled();

        flushMicrotasks();

        expect(appToastService.show).toHaveBeenCalledWith('We couldn’t save that exception right now.', 'danger');
    }));
});

function createAuthTokens() {
    return {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
    };
}
