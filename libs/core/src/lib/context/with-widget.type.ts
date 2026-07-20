import { type FormWidget } from '../form-widget';

/**
 * Contract implemented by every widget component: the component receives the widget
 * definition it renders as its `widget` property. Used by the framework adapters,
 * by custom widgets registered through the form config, and by component libraries
 * built on top of the core runtime.
 */
export interface WithWidget {
  widget: FormWidget<string>;
}
