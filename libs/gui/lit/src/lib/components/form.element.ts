import type * as Core from '@golemui/core';
import { type FormInitConfig } from '@golemui/core';
import type { WidgetLoaders, WithWidget } from '@golemui/core/internals';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { type CustomValidatorSchemas, initValidators, type Validator } from '@golemui/gui-validators';
import '@golemui/lit';
import type { FormElement as CoreFormElement } from '@golemui/lit';
import { type LitItemRenderer, type Type } from '@golemui/lit';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { widgetLoaders } from '../widget.loaders';

@customElement('gui-form')
export class FormElement extends LitElement {
  @property({ attribute: false }) config!: GuiFormInitConfig;
  @property({ type: String }) autocomplete: string | undefined = undefined;

  @query('gui-core-form') private coreForm?: CoreFormElement;

  setData(data: Record<string, any>): void {
    this.coreForm?.setData(data);
  }

  setMeta(meta: Record<string, any>): void {
    this.coreForm?.setMeta(meta);
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    const c = this.config;
    const resolved = resolveFormInput(c.formDef, c.formSelectors, c.formConfig);

    const coreConfig: FormInitConfig<Type<WithWidget>> = {
      formDef: resolved.formDef as string | Record<string, any>,
      widgetLoaders: {
        ...widgetLoaders,
        ...(resolved.widgetLoaders as WidgetLoaders<Type<WithWidget>>),
        ...((c.customWidgetLoaders ?? {}) as WidgetLoaders<Type<WithWidget>>),
      },
      dependencies: { ...(resolved.dependencies ?? {}), ...(c.dependencies ?? {}) },
      validateOn: c.validateOn ?? resolved.validateOn ?? 'eager',
      itemRenderers: {
        ...((resolved.itemRenderers ?? {}) as Record<string, LitItemRenderer<any>>),
        ...((c.itemRenderers ?? {}) as Record<string, LitItemRenderer<any>>),
      },
      localization: c.localization,
      middlewares: c.middlewares ?? [],
      data: c.data,
      meta: c.meta,
      formName: c.formName,
    };

    const allValidators: Core.ValidatorFn<Validator> = initValidators({
      ...((c.customValidators ?? {}) as CustomValidatorSchemas),
    });

    const onFormEvent = resolved.formEvent;
    const formEventListener = onFormEvent
      ? (e: Event) => onFormEvent((e as CustomEvent<Core.FormEvent>).detail)
      : undefined;

    return html`
      <gui-core-form
        .config=${coreConfig}
        .validators=${allValidators}
        .autocomplete=${this.autocomplete}
        @formEvent=${formEventListener}
      ></gui-core-form>
    `;
  }
}
