import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  templateUrl: './app-cta-button.component.html',
  styleUrls: ['./app-cta-button.component.scss']
})
export class AppCtaButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
  @Output() readonly buttonClick = new EventEmitter<MouseEvent>();
}
