import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AppPrimaryButtonComponent } from '../../../shared/ui/app-primary-button/app-primary-button.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    IonicModule,
    AppPrimaryButtonComponent
  ],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss']
})
export class OnboardingPage {

  private readonly navController = inject(NavController);

  goToLogin(): void {
    void this.navController.navigateForward('/auth/login');
  }

  goToRegister(): void {
    void this.navController.navigateForward('/auth/register');
  }

}
