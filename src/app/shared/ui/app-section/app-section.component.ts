import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  templateUrl: './app-section.component.html',
  styleUrls: ['./app-section.component.scss']
})
export class AppSectionComponent {
  @Input() centered = false;
}