import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
    selector: 'app-primary-button',
    standalone: true,
    templateUrl: './app-primary-button.component.html',
    styleUrls: ['./app-primary-button.component.scss']
})
export class AppPrimaryButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Output() readonly buttonClick = new EventEmitter<MouseEvent>();
}
