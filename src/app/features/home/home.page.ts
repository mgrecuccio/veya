import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Observable, Subject, from, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { HomeDashboardService } from './data/home-dashboard.service';
import { FreeNowState, HomeDashboardState } from 'src/app/core/api/model/home-dashboard.model';

type HomePageVmState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: HomeDashboardState };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly homeDashboardService = inject(HomeDashboardService);
  private readonly reload$ = new Subject<void>();

  readonly freeNowState: FreeNowState = {
    active: false,
  };

  readonly vmState$: Observable<HomePageVmState> = this.reload$.pipe(
    startWith(void 0),
    switchMap(() =>
      this.homeDashboardService.getDashboardState().pipe(
        map((data): HomePageVmState => ({ kind: 'success', data })),
        startWith<HomePageVmState>({ kind: 'loading' }),
        catchError((error: Error) =>
          of<HomePageVmState>({
            kind: 'error',
            message:
              error.message ||
              'We couldn’t load your dashboard right now. Please try again.',
          }),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  toggleFreeNow(): void {
    this.freeNowState.active = !this.freeNowState.active;
  }

  retry(): void {
    this.reload$.next();
  }
}