import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar,
  ellipsisHorizontal,
  home,
  people,
  settings,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {
  constructor() {
    addIcons({
      home,
      people,
      calendar,
      settings,
      'settings-outline': settingsOutline,
      'ellipsis-horizontal': ellipsisHorizontal,
      'sparkles-outline': sparklesOutline,
    });
  }
}
