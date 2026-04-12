import * as Core from '@golemui/core';
import { WidgetLoaders, WithWidget } from '@golemui/core';
import { Dependencies, golemSchemaToFieldMap } from '@golemui/gui-shared';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
  Validator,
} from '@golemui/gui-validators';
import '@golemui/lit';
import { LitItemRenderer, Type } from '@golemui/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetLoaders } from '../widget.loaders';

@customElement('gui-form')
export class FormElement extends LitElement {
  @property({ type: Object }) formDef!: string | Record<string, any>;
  @property({ type: Object }) data: any = {};
  @property({ type: Object }) meta: Record<string, any> = {};
  // TODO: this should be customWidgetLoaders
  @property({ type: Object }) widgetLoaders: WidgetLoaders<Type<WithWidget>> = {};
  @property({ type: Object }) itemRenderers: Record<string, LitItemRenderer<any>> = {};
  @property({ type: Object }) localization?: Core.I18nTranslator;
  @property({ type: Object }) dependencies?: Dependencies;
  @property({ type: Object, attribute: false }) validators: CustomValidatorSchemas = {};
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: String }) validateOn: Core.ValidateOn = 'eager';
  @property({ type: String }) autocomplete: string | undefined = undefined;

  // TODO: this should be widgetLoaders
  protected customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {
    ...widgetLoaders,
    ...this.widgetLoaders,
  };
  protected customValidators: Core.ValidatorFn<Validator> = initValidators({ ...this.validators });
  protected customMiddlewares: Core.Middleware<Core.State, Core.Action>[] = [
    Core.jsonSchemaMiddleware(golemSchemaToFieldMap(jsonSchemaValidators)),
    ...this.middlewares,
  ];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.customWidgetLoaders = {
      ...widgetLoaders,
      ...this.widgetLoaders,
    };
    this.customValidators = initValidators({ ...this.validators });
    this.customMiddlewares = [
      Core.jsonSchemaMiddleware(golemSchemaToFieldMap(jsonSchemaValidators)),
      ...this.middlewares,
    ];
  }

  override render() {
    return html`
      <gui-core-form
        .formDef=${this.formDef}
        .data=${this.data}
        .meta=${this.meta}
        .widgetLoaders=${this.customWidgetLoaders}
        .itemRenderers=${this.itemRenderers}
        .localization=${this.localization}
        .dependencies=${this.dependencies}
        .middlewares=${this.customMiddlewares}
        .validators=${this.customValidators}
        .validateOn=${this.validateOn ?? 'eager'}
        .autocomplete=${this.autocomplete}
      ></gui-core-form>
    `;
  }
}
