import { type Route } from '@angular/router';
import { LandingPage } from './pages/landing/landing.component';

// Each form page loads when its route opens: the kitchen sinks hold every widget and its mocks,
// which the landing page doesn't need.
export const appRoutes: Route[] = [
  { path: '', component: LandingPage },
  {
    path: 'json/kitchen-sink',
    loadComponent: () => import('./pages/form/form.component').then((m) => m.AppFormPage),
  },
  {
    path: 'dx/kitchen-sink',
    loadComponent: () => import('./pages/dx-form/dx-form.component').then((m) => m.DxFormPage),
  },
  {
    path: 'dx/modular',
    loadComponent: () =>
      import('./pages/modular-dx/modular-dx.component').then((m) => m.ModularDxPage),
  },
];
