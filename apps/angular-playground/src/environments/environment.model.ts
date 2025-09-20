import { InjectionToken } from '@angular/core';

export interface Environment {
  env: 'dev' | 'prod';
}

export const APP_CONFIG = new InjectionToken<Environment>('Application config');
