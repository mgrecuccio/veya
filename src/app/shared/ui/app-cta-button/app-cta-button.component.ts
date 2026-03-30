import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './app-cta-button.component.html',
  styleUrls: ['./app-cta-button.component.scss']
})
export class AppCtaButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
}