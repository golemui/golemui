import * as Core from '@golemui/core';
import { WidgetLoaders, WithWidget } from '@golemui/core';
import '@golemui/lit';
import { Dependencies, vanillaSchemaToFieldMap } from '@golemui/gui-shared';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
  Validator,
} from '@golemui/gui-validators';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { vanillaWidgetLoaders } from '../widget.loaders';
import { LitItemRenderer, Type } from '@golemui/lit';

@customElement('gui-form')
export class FormElement extends LitElement {
  @property({ type: Object }) formDef!: string | Record<string, any>;
  @property({ type: Object }) data: any = {};
  // TODO: this should be customWidgetLoaders
  @property({ type: Object }) widgetLoaders: WidgetLoaders<Type<WithWidget>> = {};
  @property({ type: Object }) itemRenderers: Record<string, LitItemRenderer<any>> = {};
  @property({ type: Object }) localization?: Core.I18nTranslator;
  @property({ type: String }) locale?: string;
  @property({ type: Object }) dependencies?: Dependencies;
  @property({ type: Object, attribute: false }) validators: CustomValidatorSchemas = {};
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: String }) validateOn: Core.ValidateOn = 'eager';
  @property({ type: String }) direction?: 'ltr' | 'rtl';

  // TODO: this should be widgetLoaders
  protected customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {
    ...vanillaWidgetLoaders,
    ...this.widgetLoaders,
  };
  protected customValidators: Core.ValidatorFn<Validator> = initValidators({ ...this.validators });
  protected customMiddlewares: Core.Middleware<Core.State, Core.Action>[] = [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
    ...this.middlewares,
  ];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.customWidgetLoaders = {
      ...vanillaWidgetLoaders,
      ...this.widgetLoaders,
    };
    this.customValidators = initValidators({ ...this.validators });
    this.customMiddlewares = [
      Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
      ...this.middlewares,
    ];
  }

  override render() {
    return html`
      <gui-core-form
        .formDef=${this.formDef}
        .data=${this.data}
        .widgetLoaders=${this.customWidgetLoaders}
        .itemRenderers=${this.itemRenderers}
        .localization=${this.localization}
        .locale=${this.locale}
        .dependencies=${this.dependencies}
        .middlewares=${this.customMiddlewares}
        .validators=${this.customValidators}
        .validateOn=${this.validateOn ?? 'eager'}
        .direction=${this.direction}
      ></gui-core-form>
    `;
  }
}
