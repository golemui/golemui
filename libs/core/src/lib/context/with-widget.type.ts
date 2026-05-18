import { FormWidget } from '../form-widget';

/**
 * @internal Framework adapter contract — not part of the end-user public API.
 */
export interface WithWidget {
  widget: FormWidget<string>;
}
