import * as Core from '@golemui/core';
import { WidgetLoaders, WithWidget } from '@golemui/core';
import {
  Dependencies,
  DxFormConfig,
  FormInput,
  GslSelectorsInput,
  resolveFormInput,
} from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators, Validator } from '@golemui/gui-validators';
import '@golemui/lit';
import { LitItemRenderer, Type } from '@golemui/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetLoaders } from '../widget.loaders';

@customElement('gui-form')
export class FormElement extends LitElement {
  @property({ type: Object }) formDef!: FormInput;
  @property({ attribute: false }) formSelectors?: GslSelectorsInput;
  @property({ attribute: false }) formConfig?: DxFormConfig;
  @property({ type: Object }) data: any = {};
  @property({ type: Object }) meta: Record<string, any> = {};
  @property({ type: Object }) customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {};
  @property({ type: Object }) itemRenderers: Record<string, LitItemRenderer<any>> = {};
  @property({ type: Object }) localization?: Core.I18nTranslator;
  @property({ type: Object }) dependencies?: Dependencies;
  @property({ type: Object, attribute: false }) customValidators: CustomValidatorSchemas = {};
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: String }) validateOn: Core.ValidateOn = 'eager';
  @property({ type: String }) autocomplete: string | undefined = undefined;

  protected allValidators: Core.ValidatorFn<Validator> = initValidators({
    ...this.customValidators,
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.allValidators = initValidators({ ...this.customValidators });
  }

  override render() {
    const resolved = resolveFormInput(this.formDef, this.formSelectors, this.formConfig);
    const mergedWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {
      ...widgetLoaders,
      ...(resolved.widgetLoaders as WidgetLoaders<Type<WithWidget>>),
      ...this.customWidgetLoaders,
    };
    const mergedDependencies: Dependencies = {
      ...(resolved.dependencies ?? {}),
      ...(this.dependencies ?? {}),
    };
    const mergedValidateOn: Core.ValidateOn = this.validateOn ?? resolved.validateOn ?? 'eager';
    const mergedItemRenderers: Record<string, LitItemRenderer<any>> = {
      ...((resolved.itemRenderers ?? {}) as Record<string, LitItemRenderer<any>>),
      ...this.itemRenderers,
    };

    const onFormEvent = resolved.formEvent;
    const formEventListener = onFormEvent
      ? (e: Event) => onFormEvent((e as CustomEvent<Core.FormEvent>).detail)
      : undefined;

    return html`
      <gui-core-form
        .formDef=${resolved.formDef}
        .data=${this.data}
        .meta=${this.meta}
        .widgetLoaders=${mergedWidgetLoaders}
        .itemRenderers=${mergedItemRenderers}
        .localization=${this.localization}
        .dependencies=${mergedDependencies}
        .middlewares=${this.middlewares}
        .validators=${this.allValidators}
        .validateOn=${mergedValidateOn}
        .autocomplete=${this.autocomplete}
        @formEvent=${formEventListener}
      ></gui-core-form>
    `;
  }
}
