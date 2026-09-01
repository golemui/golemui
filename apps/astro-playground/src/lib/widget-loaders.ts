import { widgetLoaders } from '@golemui/gui-lit';
import { customWidgetLoaders } from './custom-widget-loaders';

// Everything a page may render: the gui widget set plus the playground's own widgets.
// Preloaded before every server render and before the client resume, so that the form
// resolves each widget synchronously on both sides.
export const allWidgetLoaders = { ...widgetLoaders, ...customWidgetLoaders };
