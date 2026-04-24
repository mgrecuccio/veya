import { fakeAsync, flushMicrotasks, TestBed } from "@angular/core/testing";
import { AvailabilityPage } from "./availability.page";
import { AvailabilityPageDataService } from "./data/availability-page-data.service";
import { of, Subject, throwError } from "rxjs";
import { AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";

describe('AbailabilityPage', () => {
    let fixture: any;
    let component: AvailabilityPage;
    let dataService: jasmine.SpyObj<AvailabilityPageDataService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AvailabilityPage],
            providers: [
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
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvailabilityPage);
        component = fixture.componentInstance;
        dataService = TestBed.inject(AvailabilityPageDataService) as jasmine.SpyObj<AvailabilityPageDataService>;
    });

    it('should emit loading then success', (done) => {
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                overrides: [],
                effective: [],
                overrideEndsAfter: ''
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
                overrides: [],
                effective: [],
                overrideEndsAfter: ''
            }),
        );

        const sub = component.vmState$.subscribe();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.retry();
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

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
        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Rule deleted.',
            color: 'success',
        });
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
                overrides: [],
                effective: [],
                overrideEndsAfter: ''
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Rule added.',
            color: 'success',
        });
    }));

    it('should open an error toast and not submit rule when startTime >= endTime', fakeAsync(() => {
        dataService.createRule.and.returnValue(of({} as any));
        dataService.getPageData.and.returnValue(
            of({
                rules: [],
                overrides: [],
                effective: [],
                overrideEndsAfter: ''
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Start time must be before end time.',
            color: 'danger',
        });
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'We couldn’t save that rule right now.',
            color: 'danger',
        });
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

    it('should toggle the overrides expanded state', () => {
        expect(component.showAllOverrides()).toBeFalse();

        component.toggleOverridesExpanded();
        expect(component.showAllOverrides()).toBeTrue();

        component.toggleOverridesExpanded();
        expect(component.showAllOverrides()).toBeFalse();
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Exception added',
            color: 'success',
        });
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Start date must be now or in the future.',
            color: 'danger',
        });
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Start date must be before end date.',
            color: 'danger',
        });
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

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'We couldn’t save that exception right now.',
            color: 'danger',
        });
    }));
});
