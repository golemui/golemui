import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import './elements';

// styles.scss is linked from index.html, so the page is styled with JavaScript disabled.
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection(), provideClientHydration()],
}).catch((error) => console.error(error));
