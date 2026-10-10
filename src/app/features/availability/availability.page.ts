import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, map, merge, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from "rxjs";
import { AvailabilityOverrideType } from "src/app/core/api/model/availability-override-view-model";
import { AvailabilityChannelType, AvailabilityDayOfWeek, AvailabilityRuleView } from "src/app/core/api/model/availability-rule-view.model";
import { EffectiveAvailabilityView } from "src/app/core/api/model/effective-availability-view.model";
import { UpdateAvailabilityRuleRequest } from "src/app/core/api/request/update-availability-rule.request";
import { CreateAvailabilityOverrideRequest } from "src/app/core/api/request/create-availability-override.request";
import { CreateAvailabilityRuleRequest } from "src/app/core/api/request/create-availability-rule.request";
import { AvailabilityPageData, AvailabilityPageDataService } from "./data/availability-page-data.service";
import { getApiErrorMessage } from "src/app/core/api/api-error.util";
import { AuthService } from "src/app/core/auth/auth.service";
import { authenticatedSessionReload } from "src/app/core/auth/authenticated-session-reload.util";
import { AppToastColor, AppToastService } from "src/app/shared/toast/app-toast.service";
import { dayOffsetInTimeZone, fromDateTimeLocalValue, toDateTimeLocalValue } from "src/app/shared/time/zoned-date.util";

type AvailabilityVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: AvailabilityPageVm };

interface AvailabilityPageVm {
  rules: AvailabilityRuleCardVm[];
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
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityPage {
    private readonly fb = inject(FormBuilder);
    private readonly availabilityPageDataService = inject(AvailabilityPageDataService);
    private readonly appToastService = inject(AppToastService);
    private readonly authService = inject(AuthService);
    private readonly reload$ = new Subject<void>();
    private hasEntered = false;
    // the user's profile time zone from the last load; null falls back to the device time zone.
    private timeZone: string | null = null;

    readonly ruleFormExpanded = signal(false);
    readonly overrideFormExpanded = signal(false);
    readonly editingRuleId = signal<number | null>(null);
    readonly submittingRule = signal(false);
    readonly submittingOverride = signal(false);
    readonly rowActionBusyId = signal<number | null>(null);

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

    readonly vmState$: Observable<AvailabilityVmState> = merge(
        this.reload$,
        authenticatedSessionReload(this.authService.authState$),
    ).pipe(
        switchMap(() =>
            this.availabilityPageDataService.getPageData().pipe(
                tap((data) => this.timeZone = data.timeZone),
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

    ionViewWillEnter(): void {
        if (!this.hasEntered) {
            this.hasEntered = true;
            return;
        }

        this.retry();
    }

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
            channelType: rule.raw.channelType,
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
                        getApiErrorMessage(error, 'We couldn’t save that rule right now.'),
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
                    getApiErrorMessage(error, 'We couldn’t delete that rule right now.'),
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

    submitOverride(): void {
        if(this.overrideForm.invalid || this.submittingOverride()) {
            this.overrideForm.markAllAsTouched();
            return;
        }

        const raw = this.overrideForm.getRawValue();
        const start = fromDateTimeLocalValue(raw.startDateTime, this.timeZone);
        const end = fromDateTimeLocalValue(raw.endDateTime, this.timeZone);
        const earliestStart = new Date();
        earliestStart.setSeconds(0, 0);

        if (!start || !end) {
            this.overrideForm.markAllAsTouched();
            return;
        }

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
                        getApiErrorMessage(error, 'We couldn’t save that exception right now.'),
                        'danger',
                );
            },
        });
    }

    // the override inputs show wall-clock time in the user's time zone.
    private toDatetimeLocalValue(date: Date): string {
        return toDateTimeLocalValue(date, this.timeZone);
    }

    private mapToVm(data: AvailabilityPageData): AvailabilityPageVm {
        return {
            rules: data.rules.map((rule) => this.mapRule(rule)),
            effectiveGroups: this.groupEffectiveAvailability(data.effective, data.timeZone),
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

    private formatDateLabel(date: Date, timeZone: string | null): string {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: timeZone ?? undefined,
        }).format(date);
    }

    // rule times are wall-clock strings and need no zone; effective windows are instants shown in `timeZone`.
    private formatTime(value: string | Date, timeZone: string | null = null): string {
        const date =
        value instanceof Date
            ? value
            : new Date(`1970-01-01T${this.normalizeTimeForInput(value)}:00`);

        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timeZone ?? undefined,
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
        timeZone: string | null,
    ): EffectiveAvailabilityGroupVm[] {
        const now = new Date();

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
                dateLabel: this.formatDateLabel(start, timeZone),
                timeRange: `${this.formatTime(start, timeZone)} - ${this.formatTime(end, timeZone)}`,
            };

            const dayOffset = dayOffsetInTimeZone(start, now, timeZone);

            if(dayOffset === 0) {
                groups[0].items.push(item);
            } else if(dayOffset === 1) {
                groups[1].items.push(item);
            } else {
                groups[2].items.push(item);
            }
        }

        return groups;
    }

    private showToast(message: string, color: AppToastColor): void {
        void this.appToastService.show(message, color);
    }
}
