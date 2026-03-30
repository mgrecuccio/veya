import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-outline-button',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './app-outline-button.component.html',
  styleUrls: ['./app-outline-button.component.scss']
})
export class AppOutlineButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
}