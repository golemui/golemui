import { cloneObject, type FormHealth, type FormInitConfig, type WithWidget } from '@golemui/core';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from '@golemui/core/internals';
import { html, LitElement, notEqual, type PropertyDeclaration, type PropertyValues } from 'lit';
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
  /**
   * Returns a copy of the form data, as a form event would carry it now: without the values of
   * hidden inputs. Before the form has started, it returns the data the form will start with.
   */
  getData(): Record<string, any>;
  setData(data: Record<string, any>): void;
  setMeta(meta: Record<string, any>): void;
  /** Sets the form health. An errored health shows the boundary and freezes the form until `{ status: 'ok' }`. */
  setHealth(health: FormHealth): void;
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
 * The returned class accepts the widget set's form config, applies the
 * shared merge precedence rules, and renders the core `gui-core-form`
 * element. The class is not registered as a custom element: the widget set
 * package chooses the tag name (the gui set registers a subclass as
 * `gui-form`).
 *
 * @param widgetSet - The widget set's loaders, validator factory and default dependencies.
 *
 * @example
 * @customElement('gui-form')
 * export class FormElement extends createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders,
 *   validators: initValidators,
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

    // The core form gets a config only in a render: the first one, or the next one after a new
    // config. A call before that render waits in these fields, so it reaches the core form after
    // the core form got the config.
    private dataBeforeRender: Record<string, any> | undefined;
    private metaBeforeRender: Record<string, any> | undefined;
    private healthBeforeRender: FormHealth | undefined;
    // True from a new config until the next update.
    private newConfigWaitsForRender = false;

    private get coreForm(): CoreFormElement | null {
      return this.renderRoot.querySelector('gui-core-form');
    }

    getData(): Record<string, any> {
      if (!this.hasUpdated || this.newConfigWaitsForRender) {
        return cloneObject(this.dataBeforeRender ?? this.config?.data ?? {});
      }
      return this.coreForm?.getData() ?? cloneObject(this.config?.data ?? {});
    }

    setData(data: Record<string, any>): void {
      if (!this.hasUpdated || this.newConfigWaitsForRender) {
        this.dataBeforeRender = data;
        return;
      }
      this.coreForm?.setData(data);
    }

    setMeta(meta: Record<string, any>): void {
      if (!this.hasUpdated || this.newConfigWaitsForRender) {
        this.metaBeforeRender = meta;
        return;
      }
      this.coreForm?.setMeta(meta);
    }

    setHealth(health: FormHealth): void {
      if (!this.hasUpdated || this.newConfigWaitsForRender) {
        this.healthBeforeRender = health;
        return;
      }
      this.coreForm?.setHealth(health);
    }

    override requestUpdate(
      name?: PropertyKey,
      oldValue?: unknown,
      options?: PropertyDeclaration,
      useNewValue?: boolean,
      newValue?: unknown,
    ): void {
      super.requestUpdate(name, oldValue, options, useNewValue, newValue);
      if (name !== 'config') {
        return;
      }
      const value = useNewValue ? newValue : this.config;
      if (!(options?.hasChanged ?? notEqual)(value, oldValue)) {
        return;
      }
      if (!value) {
        // An undefined config starts nothing. The core form keeps its config, so the kept calls
        // belong to it.
        this.newConfigWaitsForRender = false;
        if (this.hasUpdated) {
          this.passCallsBeforeRender();
        }
        return;
      }
      // After a first render, the config of the kept calls is replaced before the next render, so
      // it never starts. Before the first render every call is kept for the first start.
      if (this.newConfigWaitsForRender && this.hasUpdated) {
        this.dropCallsBeforeRender();
      }
      this.newConfigWaitsForRender = true;
    }

    private dropCallsBeforeRender() {
      this.dataBeforeRender = undefined;
      this.metaBeforeRender = undefined;
      this.healthBeforeRender = undefined;
    }

    // Not in firstUpdated(): a subclass can override that hook without calling super.
    protected override update(changed: PropertyValues) {
      super.update(changed);
      // A config assigned during this update starts no new update in Lit.
      this.newConfigWaitsForRender = false;
      this.passCallsBeforeRender();
    }

    private passCallsBeforeRender() {
      if (this.dataBeforeRender) {
        this.coreForm?.setData(this.dataBeforeRender);
        this.dataBeforeRender = undefined;
      }
      if (this.metaBeforeRender) {
        this.coreForm?.setMeta(this.metaBeforeRender);
        this.metaBeforeRender = undefined;
      }
      if (this.healthBeforeRender) {
        this.coreForm?.setHealth(this.healthBeforeRender);
        this.healthBeforeRender = undefined;
      }
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
      // Before the build: a build that throws must not leave the field true.
      this.newConfigWaitsForRender = false;
      if (changed.has('config')) {
        try {
          this.bundle = buildWidgetSetForm(widgetSet, this.config);
        } catch (error) {
          // The core form never gets this config, so the calls kept for it are dropped. Before the
          // first render they are kept for the first start.
          if (this.hasUpdated) {
            this.dropCallsBeforeRender();
          }
          throw error;
        }
      }
    }

    override render() {
      const { initConfig, validators } = this.bundle;

      // The bundle is built with untyped loaders. This widget set's loaders
      // resolve to Lit element classes, so the config is a Lit init config.
      const coreConfig = initConfig as FormInitConfig<Type<WithWidget>>;

      return html`
        <gui-core-form
          .config=${coreConfig}
          .validators=${validators}
          .autocomplete=${this.autocomplete}
          .formHealthBoundary=${this.formHealthBoundary}
        ></gui-core-form>
      `;
    }
  }

  return WidgetSetForm as WidgetSetFormElementClass<TConfig>;
}
