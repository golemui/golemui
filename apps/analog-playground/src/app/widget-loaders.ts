import { widgetLoaders } from '@golemui/gui-angular';
import { customWidgetLoaders } from './custom-widget-loaders';

// Everything a page may render: the gui widget set plus the playground's own widgets.
// Preloaded before every server render and before the client bootstrap, so that the form
// resolves each widget synchronously on both sides.
export const allWidgetLoaders = { ...widgetLoaders, ...customWidgetLoaders };
