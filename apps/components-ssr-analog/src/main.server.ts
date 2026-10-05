import '@angular/platform-server/init';
import { render } from '@analogjs/router/server';
import { App } from './app/app';
import { config } from './app/app.config.server';
import './elements';

// Zoneless, like the Analog playground (see its main.server.ts). The elements load before any
// document stub exists, so lit takes its Node code path.
export default render(App, config);
