import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-feature-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './app-feature-card.component.html',
  styleUrls: ['./app-feature-card.component.scss']
})
export class AppFeatureCardComponent {
  @Input() icon = 'sparkles-outline';
  @Input() title = '';
  @Input() imageSrc?: string;
  @Input() imageAlt = '';
  @Input() imageFit: 'cover' | 'contain' = 'cover';
  @Input() description = '';
}