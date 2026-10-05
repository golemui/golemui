import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import './elements';

bootstrapApplication(App, appConfig).catch((error) => console.error(error));
