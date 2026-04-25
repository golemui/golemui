import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Buffer } from 'buffer';

(window as any).Buffer = Buffer;

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
