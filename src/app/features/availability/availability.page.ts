import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, startWith, switchMap } from "rxjs";
import { AvailabilityOverrideType, AvailabilityOverrideView } from "src/app/core/api/model/availability-override-view-model";
import { AvailabilityChannelType, AvailabilityDayOfWeek, AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "src/app/core/api/model/effective-availability-view.model";
import { UpdateAvailabilityRuleRequest } from "src/app/core/api/request/update-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "src/app/core/api/request/create-availability-override.request";
import { CreateAvailabilityRuleRequest } from "src/app/core/api/request/create-availability-rule.request";
import { AvailabilityPageData, AvailabilityPageDataService } from "./data/availability-page-data.service";

type AvailabilityVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: AvailabilityPageVm };

interface AvailabilityPageVm {
  rules: AvailabilityRuleCardVm[];
  overrides: AvailabilityOverrideCardVm[];
  effectiveGroups: EffectiveAvailabilityGroupVm[];
}

interface AvailabilityRuleCardVm {
  id: number;
  dayLabel: string;
  timeRange: string;
  channelLabel: string;
  enabled: boolean;
  raw: AvailabilityRuleView;
}

interface AvailabilityOverrideCardVm {
  id: number;
  dateLabel: string;
  timeRange: string;
  type: AvailabilityOverrideType;
  typeLabel: string;
  raw: AvailabilityOverrideView;
}

interface EffectiveAvailabilityGroupVm {
  title: string;
  items: EffectiveAvailabilityItemVm[];
}

interface EffectiveAvailabilityItemVm {
  id: string;
  timeRange: string;
  dateLabel: string;
}

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityPage {
    private readonly fb = inject(FormBuilder);
    private readonly availabilityPageDataService = inject(AvailabilityPageDataService);
    private readonly reload$ = new BehaviorSubject<void>(void 0);

    readonly ruleFormExpanded = signal(false);
    readonly overrideFormExpanded = signal(false);
    readonly editingRuleId = signal<number | null>(null);
    readonly submittingRule = signal(false);
    readonly submittingOverride = signal(false);
    readonly rowActionBusyId = signal<number | null>(null);

    readonly toastState = signal<{
        isOpen: boolean;
        message: string;
        color: 'success' | 'danger';
    }>({
        isOpen: false,
        message: '',
        color: 'success',
    });

    readonly days: AvailabilityDayOfWeek[] = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
    ];

    readonly channels: AvailabilityChannelType[] = ['CHAT', 'CALL'];
    readonly overrideTypes: AvailabilityOverrideType[] = ['AVAILABLE', 'UNAVAILABLE'];
    readonly overridePreviewLimit = 3;
    readonly showAllOverrides = signal(false);

    readonly ruleForm = this.fb.nonNullable.group({
        dayOfWeek: ['MONDAY' as AvailabilityDayOfWeek, [Validators.required]],
        startTime: ['09:00', [Validators.required]],
        endTime: ['17:00', [Validators.required]],
        channelType: ['CHAT' as AvailabilityChannelType, [Validators.required]],
        enabled: [true],
    });

    readonly overrideForm = this.fb.nonNullable.group({
        startDateTime: ['', [Validators.required]],
        endDateTime: ['', [Validators.required]],
        type: ['UNAVAILABLE' as AvailabilityOverrideType, [Validators.required]],
    });

    readonly overrideMinDateTime = signal(this.toDatetimeLocalValue(new Date()));
    readonly overrideStartDateTime = toSignal(
        this.overrideForm.controls.startDateTime.valueChanges.pipe(
            startWith(this.overrideForm.controls.startDateTime.value),
        ),
        { initialValue: this.overrideForm.controls.startDateTime.value },
    );

    readonly overrideEndMinDateTime = computed(() => {
        const minDateTime = this.overrideMinDateTime();
        const startDateTime = this.overrideStartDateTime();

        if (!startDateTime) {
            return minDateTime;
        }

        return new Date(startDateTime).getTime() > new Date(minDateTime).getTime()
            ? startDateTime
            : minDateTime;
    });

    readonly vmState$: Observable<AvailabilityVmState> = this.reload$.pipe(
        switchMap(() =>
            this.availabilityPageDataService.getPageData().pipe(
                map((data): AvailabilityVmState => ({
                    kind: 'success',
                    data: this.mapToVm(data),
                })),
                startWith<AvailabilityVmState>({ kind: 'loading' }),
                catchError((error: Error) =>
                    of<AvailabilityVmState>({
                        kind: 'error',
                        message:
                        error.message ||
                        'We couldn’t load your availability right now. Please try again.',
                    }),
                ),
            ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    retry(): void {
        this.reload$.next();
    }

    openCreateRule(): void {
        this.editingRuleId.set(null);
        this.ruleForm.reset({
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '17:00',
            channelType: 'CHAT',
            enabled: true,
        });
        this.ruleFormExpanded.set(true);
    }

    openEditRule(rule: AvailabilityRuleCardVm): void {
        this.editingRuleId.set(rule.id);
        this.ruleForm.reset({
            dayOfWeek: rule.raw.dayOfWeek,
            startTime: this.normalizeTimeForInput(rule.raw.startTime),
            endTime: this.normalizeTimeForInput(rule.raw.endTime),
            enabled: rule.raw.enabled,
        });
        this.ruleFormExpanded.set(true);
    }

    closeRuleForm(): void {
        this.ruleFormExpanded.set(false);
        this.editingRuleId.set(null);
    }

    submitRule(): void {
        if(this.ruleForm.invalid || this.submittingRule()) {
            this.ruleForm.markAllAsTouched();
            return;
        }

        const raw = this.ruleForm.getRawValue();

        const startTime = this.normalizeTimeForInput(raw.startTime);
        const endTime = this.normalizeTimeForInput(raw.endTime);

        if (startTime >= endTime) {
            this.showToast('Start time must be before end time.', 'danger');
            return;
        }

        this.submittingRule.set(true);

        const createRequest: CreateAvailabilityRuleRequest = {
            dayOfWeek: raw.dayOfWeek,
            startTime: this.toBackendTime(startTime),
            endTime: this.toBackendTime(endTime),
            channelType: raw.channelType,
        };

        const editingId = this.editingRuleId();
        const request$ = 
            editingId === null
                ? this.availabilityPageDataService.createRule(createRequest)
                : this.availabilityPageDataService.updateRule(editingId, {
                    ...createRequest,
                    enabled: raw.enabled
                } satisfies UpdateAvailabilityRuleRequest);

        request$
            .pipe(finalize(() => this.submittingRule.set(false)))
            .subscribe({
                next: () => {
                    this.closeRuleForm();
                    this.retry();
                    this.showToast(editingId === null ? 'Rule added.' : 'Rule updated.', 'success');
                },
                error: (error: any) => {
                    this.showToast(
                        error?.error?.detail || 'We couldn’t save that rule right now.',
                        'danger',
                );
            },
        });
    }

    deleteRule(rule: AvailabilityRuleCardVm): void {
        if(this.rowActionBusyId() !== null) {
            return;
        }

        this.rowActionBusyId.set(rule.id);

        this.availabilityPageDataService
            .deleteRule(rule.id)
            .pipe(finalize(() => this.rowActionBusyId.set(null)))
            .subscribe({
                next: () => {
                    this.retry();
                    this.showToast('Rule deleted.', 'success');
                },
            error: (error: any) => {
                this.showToast(
                    error?.error?.detail || 'We couldn’t delete that rule right now.',
                    'danger',
                );
            },
        });
    }

    openCreateOverride(): void {
        const now = new Date();
        const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        this.overrideMinDateTime.set(this.toDatetimeLocalValue(now));

        this.overrideForm.reset({
            startDateTime: this.toDatetimeLocalValue(now),
            endDateTime: this.toDatetimeLocalValue(later),
            type: 'UNAVAILABLE',
        });

        this.overrideFormExpanded.set(true);
    }

    closeOverrideForm(): void {
        this.overrideFormExpanded.set(false);
    }

    toggleOverridesExpanded(): void {
        this.showAllOverrides.update((showAll) => !showAll);
    }

    submitOverride(): void {
        if(this.overrideForm.invalid || this.submittingOverride()) {
            this.overrideForm.markAllAsTouched();
            return;
        }

        const raw = this.overrideForm.getRawValue();
        const start = new Date(raw.startDateTime);
        const end = new Date(raw.endDateTime);
        const earliestStart = new Date();
        earliestStart.setSeconds(0, 0);

        if (start < earliestStart) {
            this.showToast('Start date must be now or in the future.', 'danger');
            this.overrideMinDateTime.set(this.toDatetimeLocalValue(earliestStart));
            return;
        }

        if (start >= end) {
            this.showToast('Start date must be before end date.', 'danger');
            return;
        }

        const request: CreateAvailabilityOverrideRequest = {
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            type: raw.type,
        };

        this.submittingOverride.set(true);

        this.availabilityPageDataService.createOverride(request)
            .pipe(finalize(() => this.submittingOverride.set(false)))
            .subscribe({
                next: () => {
                    this.closeOverrideForm();
                    this.retry();
                    this.showToast('Exception added', 'success');
                },
                error: (error: any) => {
                    this.showToast(
                        error?.error?.detail || 'We couldn’t save that exception right now.',
                        'danger',
                );
            },
        });
    }

    onToastDismiss(): void {
        this.toastState.update((state) => ({ ...state, isOpen: false }));
    }

    private toDatetimeLocalValue(date: Date): string {
        const offsetMs = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    }

    private mapToVm(data: AvailabilityPageData): AvailabilityPageVm {
        return {
            rules: data.rules.map((rule) => this.mapRule(rule)),
            overrides: data.overrides
                .filter((override) => this.isOngoingOrFutureOverride(override, data.overrideEndsAfter))
                .map((override) => this.mapOverride(override))
                .sort((left, right) =>
                    new Date(left.raw.startDateTime).getTime() -
                    new Date(right.raw.startDateTime).getTime()
                ),
            effectiveGroups: this.groupEffectiveAvailability(data.effective),
        };
    }

    private mapRule(rule: AvailabilityRuleView): AvailabilityRuleCardVm {
        return {
            id: rule.id,
            dayLabel: this.formatDay(rule.dayOfWeek),
            timeRange: `${this.formatTime(rule.startTime)} – ${this.formatTime(rule.endTime)}`,
            channelLabel: this.formatChannel(rule.channelType),
            enabled: rule.enabled,
            raw: rule,
        };
    }

    formatDay(day: AvailabilityDayOfWeek): string {
        return day.charAt(0) + day.slice(1).toLowerCase();
    }

    formatChannel(channel: AvailabilityChannelType): string {
        return channel === 'CHAT' ? 'Chat' : 'Call';
    }

    private toBackendTime(value: string): string {
        const match = this.getTimeMatch(value);
        return match ? `${match[1]}:${match[2]}:${match[3] ?? '00'}` : value;
    }


    private mapOverride(override: AvailabilityOverrideView): AvailabilityOverrideCardVm {
        const start = new Date(override.startDateTime);
        const end = new Date(override.endDateTime);

        return {
            id: override.id,
            dateLabel: this.formatDateLabel(start),
            timeRange: `${this.formatTime(start)} – ${this.formatTime(end)}`,
            type: override.type,
            typeLabel: override.type === 'AVAILABLE' ? 'Available' : 'Unavailable',
            raw: override,
        }
    }

    private isOngoingOrFutureOverride(
        override: AvailabilityOverrideView,
        endsAfter: string,
    ): boolean {
        return new Date(override.endDateTime).getTime() > new Date(endsAfter).getTime();
    }

    private formatDateLabel(date: Date): string {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        }).format(date);
    }

    private formatTime(value: string | Date): string {
        const date =
        value instanceof Date
            ? value
            : new Date(`1970-01-01T${this.normalizeTimeForInput(value)}:00`);

        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    private normalizeTimeForInput(value: string): string {
        const match = this.getTimeMatch(value);
        return match ? `${match[1]}:${match[2]}` : value.slice(0, 5);
    }

    private getTimeMatch(value: string): RegExpMatchArray | null {
        return value.match(/(?:T|^)(\d{2}):(\d{2})(?::(\d{2}))?/);
    }

    private groupEffectiveAvailability(
        windows: EffectiveAvailabilityView[],
    ): EffectiveAvailabilityGroupVm[] {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate());

        const groups: EffectiveAvailabilityGroupVm[] = [
            { title: 'Today', items: [] },
            { title: 'Tomorrow', items: []},
            { title: 'Later this week', items: []},
        ];

        for(const window of windows) {
            const start = new Date(window.startDateTime);
            const end = new Date(window.endDateTime);

            const item: EffectiveAvailabilityItemVm = {
                id: `${window.startDateTime}-${window.endDateTime}`,
                dateLabel: this.formatDateLabel(start),
                timeRange: `${this.formatTime(start)} - ${this.formatTime(end)}`,
            };

            if(this.isSameLocalDate(start,today)) {
                groups[0].items.push(item);
            } else if(this.isSameLocalDate(start, tomorrow)) {
                groups[1].items.push(item);
            } else {
                groups[2].items.push(item);
            }
        }

        return groups;
    }

    private isSameLocalDate(left: Date, right: Date): boolean {
        return left.toDateString() === right.toDateString();
    }

    private showToast(message: string, color: 'success' | 'danger'): void {
        this.toastState.set({
            isOpen: true,
            message,
            color,
        });
    }
}
