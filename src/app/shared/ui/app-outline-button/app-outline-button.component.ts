import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-outline-button',
  standalone: true,
  templateUrl: './app-outline-button.component.html',
  styleUrls: ['./app-outline-button.component.scss']
})
export class AppOutlineButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Output() readonly buttonClick = new EventEmitter<MouseEvent>();
}
