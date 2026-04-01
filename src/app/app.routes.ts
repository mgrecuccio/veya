import { Routes } from '@angular/router';

export const routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/onboarding/onboarding.page').then(m => m.OnboardingPage),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.page').then(m => m.RegisterPage),
  },
];
