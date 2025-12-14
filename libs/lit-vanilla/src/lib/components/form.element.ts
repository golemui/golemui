import * as Core from '@golemui/core';
import { FieldLoaders, WithField } from '@golemui/core';
import '@golemui/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { vanillaFieldLoaders } from '../field.loaders';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
  Validator,
} from '@golemui/validators-vanilla';

interface Type<T> {
  new (...args: any[]): T;
}

@customElement('gui-form')
export class FormElement extends LitElement {
  @property({ type: Object }) formDef!: string | Record<string, any>;
  @property({ type: Object }) data: any = {};
  @property({ type: Array }) fieldLoaders: FieldLoaders<Type<WithField>> = {};
  @property({ attribute: false }) validators: CustomValidatorSchemas = {};
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: Object }) validateOn: Core.ValidateOn = 'eager';

  protected customFieldLoaders: FieldLoaders<Type<WithField>> = {
    ...vanillaFieldLoaders,
    ...this.fieldLoaders,
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

    this.customFieldLoaders = {
      ...vanillaFieldLoaders,
      ...this.fieldLoaders,
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
        .fieldLoaders=${this.customFieldLoaders}
        .middlewares=${this.customMiddlewares}
        .validators=${this.customValidators}
        validateOn="eager"
      ></gui-core-form>
    `;
  }
}
