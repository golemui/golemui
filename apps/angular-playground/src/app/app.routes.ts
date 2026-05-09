import { Route } from '@angular/router';
import { LandingPage } from './pages/landing/landing.component';
import { AppFormPage } from './pages/form/form.component';
import { DxFormPage } from './pages/dx-form/dx-form.component';
import { ModularDxPage } from './pages/modular-dx/modular-dx.component';

export const appRoutes: Route[] = [
  { path: '', component: LandingPage },
  { path: 'json/kitchen-sink', component: AppFormPage },
  { path: 'dx/kitchen-sink', component: DxFormPage },
  { path: 'dx/modular', component: ModularDxPage },
];
