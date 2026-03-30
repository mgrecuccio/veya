export const routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/onboarding/onboarding.page').then(m => m.OnboardingPage),
  },
];
