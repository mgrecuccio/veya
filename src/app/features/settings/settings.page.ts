import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';


@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [IonicModule],
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {

}
