import { Routes } from '@angular/router';
import { anonymousGuard, authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/onboarding',
    pathMatch: 'full',
  },

  {
    path: 'auth/onboarding',
    loadComponent: () =>
      import('./features/auth/onboarding/onboarding.page').then((m) => m.OnboardingPage),
    canActivate: [anonymousGuard],
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [anonymousGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.page').then((m) => m.RegisterPage),
    canActivate: [anonymousGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.page').then((m) => m.SettingsPage),
    canActivate: [authGuard],
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./features/contacts/contacts.page').then((m) => m.ContactsPage),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./features/matches/matches.page').then((m) => m.MatchesPage),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./features/availability/availability.page').then((m) => m.AvailabilityPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
