import type { FormEvent, FormInitConfig, WithWidget } from '@golemui/core';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from '@golemui/dx';
import { html, LitElement, type PropertyValues } from 'lit';
import type { Type } from '../../utils/type';
import type { FormElement as CoreFormElement } from './form.element';
import './form.element';
import type { FormHealthBoundary } from './form-health-boundary';

/**
 * Instance shape of an element built by {@link createFormComponent}, generic
 * over the widget set's form config type.
 */
export interface WidgetSetFormElement<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> extends LitElement {
  config: TConfig;
  autocomplete: string | undefined;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary?: FormHealthBoundary;
  setData(data: Record<string, any>): void;
  setMeta(meta: Record<string, any>): void;
}

/**
 * The element class returned by {@link createFormComponent}. The widget set
 * package registers it under its own tag name (directly or through a
 * subclass).
 */
export type WidgetSetFormElementClass<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> = new () => WidgetSetFormElement<TConfig>;

/**
 * Builds a Lit form element class bound to one widget set.
 *
 * The returned class accepts the widget set's form config, resolves TS
 * builder input through the widget set's `resolveFormInput`, applies the
 * shared merge precedence rules, and renders the core `gui-core-form`
 * element. The class is not registered as a custom element: the widget set
 * package chooses the tag name (the gui set registers a subclass as
 * `gui-form`).
 *
 * @param widgetSet - The widget set's loaders, validator factory, and
 * optional form input resolver.
 *
 * @example
 * @customElement('gui-form')
 * export class FormElement extends createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders,
 *   validators: initValidators,
 *   resolveFormInput,
 * }) {}
 */
export function createFormComponent<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
>(widgetSet: WidgetSetDefinition<Type<WithWidget>, TConfig>): WidgetSetFormElementClass<TConfig> {
  class WidgetSetForm extends LitElement {
    static override properties = {
      config: { attribute: false },
      autocomplete: { type: String },
      formHealthBoundary: { attribute: false },
    };

    // Reactive properties are declared in `static properties` above. These
    // `declare` statements only add the types; a real class field would
    // shadow the reactive accessors Lit generates.
    declare config: TConfig;
    declare autocomplete: string | undefined;
    declare formHealthBoundary: FormHealthBoundary | undefined;

    private get coreForm(): CoreFormElement | null {
      return this.renderRoot.querySelector('gui-core-form');
    }

    setData(data: Record<string, any>): void {
      this.coreForm?.setData(data);
    }

    setMeta(meta: Record<string, any>): void {
      this.coreForm?.setMeta(meta);
    }

    override createRenderRoot() {
      return this;
    }

    // Rebuilt only when the config property changes. Building it in render() would hand
    // the core form a new config identity on every re-render, and each one would
    // reinitialize the store and reset the form data.
    private bundle!: ReturnType<typeof buildWidgetSetForm>;

    override willUpdate(changed: PropertyValues) {
      super.willUpdate(changed);
      if (changed.has('config')) {
        this.bundle = buildWidgetSetForm(widgetSet, this.config);
      }
    }

    override render() {
      const { initConfig, validators, resolved } = this.bundle;

      // The bundle is built with untyped loaders. This widget set's loaders
      // resolve to Lit element classes, so the config is a Lit init config.
      const coreConfig = initConfig as FormInitConfig<Type<WithWidget>>;

      // DX-registered event handlers listen on the core element. User-level
      // listeners receive the same events bubbling from it, so both fire.
      const onFormEvent = resolved.formEvent;
      const formEventListener = onFormEvent
        ? (e: Event) => onFormEvent((e as CustomEvent<FormEvent>).detail)
        : undefined;

      return html`
        <gui-core-form
          .config=${coreConfig}
          .validators=${validators}
          .autocomplete=${this.autocomplete}
          .formHealthBoundary=${this.formHealthBoundary}
          @formEvent=${formEventListener}
        ></gui-core-form>
      `;
    }
  }

  return WidgetSetForm as WidgetSetFormElementClass<TConfig>;
}
