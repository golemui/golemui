import { type Route } from '@angular/router';
import { LandingPage } from './pages/landing/landing.component';

// Each form page loads when its route opens: the kitchen sink holds every widget and its mocks,
// which the landing page doesn't need.
export const appRoutes: Route[] = [
  { path: '', component: LandingPage },
  {
    path: 'json/kitchen-sink',
    loadComponent: () => import('./pages/form/form.component').then((m) => m.AppFormPage),
  },
  {
    path: 'json/signup',
    loadComponent: () => import('./pages/signup/signup.component').then((m) => m.SignupPage),
  },
];
