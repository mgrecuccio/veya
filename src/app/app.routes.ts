import { authGuard } from './core/auth/auth.guard';

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
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.page').then(m => m.HomePage),
    canActivate: [authGuard],
  },
];
