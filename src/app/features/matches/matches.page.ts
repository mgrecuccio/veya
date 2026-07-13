import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface MatchPreview {
  id: number;
  name: string;
  initials: string;
}

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchesPage {
  readonly matches: MatchPreview[] = [
    { id: 1, name: 'Alex Morgan', initials: 'AM' },
    { id: 2, name: 'Sam Rivera', initials: 'SR' },
    { id: 3, name: 'Jordan Lee', initials: 'JL' },
  ];

  readonly toastOpen = signal(false);

  previewChat(): void {
    this.toastOpen.set(true);
  }

  closeToast(): void {
    this.toastOpen.set(false);
  }
}
