import type { FormInitConfig, ValidatorFn, WithWidget } from '@golemui/core';
import type { FormElement } from '../components/form/form.element';
import type { Type } from '../utils/type';

/**
 * Client entry point for a server-rendered GolemUI form.
 *
 * The server markup holds the form inert through the `defer-hydration` attribute.
 * This call replaces the server-rendered children with a live client render: it
 * clears them, assigns `config` and `validators`, and removes the attribute, which
 * runs the held connectedCallback. Lit renders before the browser paints again, so
 * the server markup is not visible in a cleared state.
 *
 * Call it only after the widgets are preloaded (`preloadFormWidgets`) and the form
 * element definitions are imported, so the first client render resolves every
 * widget synchronously. `config.formName` must match the server value, which the
 * server render enforces by requiring an explicit `formName`.
 *
 * @param element - The server-rendered form element (`gui-core-form` or a widget-set
 * form element that extends it).
 * @param options - The same `config` and `validators` the server render used.
 * @example
 * await preloadFormWidgets({ widgetLoaders });
 * const form = document.querySelector('gui-core-form')!;
 * resumeServerRenderedForm(form, { config, validators });
 */
export function resumeServerRenderedForm(
  element: FormElement,
  options: {
    config: FormInitConfig<Type<WithWidget>>;
    validators: ValidatorFn<any>;
  },
): void {
  element.replaceChildren();
  // The element property is typed on widget instances while configs are built with
  // component classes. createFormComponent applies the same cast.
  element.config = options.config as unknown as FormInitConfig<WithWidget>;
  element.validators = options.validators;
  element.removeAttribute('defer-hydration');
}
