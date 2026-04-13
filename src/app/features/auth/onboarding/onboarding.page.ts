import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppPrimaryButtonComponent } from '../../../shared/ui/app-primary-button/app-primary-button.component';
import { AppOutlineButtonComponent } from '../../../shared/ui/app-outline-button/app-outline-button.component';
import { AppCtaButtonComponent } from '../../../shared/ui/app-cta-button/app-cta-button.component';
import { AppFeatureCardComponent } from '../../../shared/ui/app-feature-card/app-feature-card.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    IonicModule,
    AppPrimaryButtonComponent,
    AppOutlineButtonComponent,
    AppCtaButtonComponent,
    AppFeatureCardComponent
  ],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss']
})
export class OnboardingPage {

  private readonly router = inject(Router);

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    void this.router.navigate(['/auth/register']);
  }

}