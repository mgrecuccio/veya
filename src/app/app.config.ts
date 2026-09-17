import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({
      mode: 'md',
      animated: false,
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};
