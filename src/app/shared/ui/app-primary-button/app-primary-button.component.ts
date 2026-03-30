import { Component, Input } from "@angular/core";
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-primary-button',
    standalone: true,
    imports: [IonicModule],
    templateUrl: './app-primary-button.component.html',
    styleUrls: ['./app-primary-button.component.scss']
})
export class AppPrimaryButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
}