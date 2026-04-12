import * as Core from '@golemui/core';
import { WidgetLoaders, WithWidget } from '@golemui/core';
import { Dependencies } from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators, Validator } from '@golemui/gui-validators';
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
  @property({ type: Object }) customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {};
  @property({ type: Object }) itemRenderers: Record<string, LitItemRenderer<any>> = {};
  @property({ type: Object }) localization?: Core.I18nTranslator;
  @property({ type: Object }) dependencies?: Dependencies;
  @property({ type: Object, attribute: false }) customValidators: CustomValidatorSchemas = {};
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: String }) validateOn: Core.ValidateOn = 'eager';
  @property({ type: String }) autocomplete: string | undefined = undefined;

  protected allWidgetLoaders: WidgetLoaders<Type<WithWidget>> = {
    ...widgetLoaders,
    ...this.customWidgetLoaders,
  };
  protected allValidators: Core.ValidatorFn<Validator> = initValidators({
    ...this.customValidators,
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.allWidgetLoaders = {
      ...widgetLoaders,
      ...this.customWidgetLoaders,
    };
    this.allValidators = initValidators({ ...this.customValidators });
  }

  override render() {
    return html`
      <gui-core-form
        .formDef=${this.formDef}
        .data=${this.data}
        .meta=${this.meta}
        .widgetLoaders=${this.allWidgetLoaders}
        .itemRenderers=${this.itemRenderers}
        .localization=${this.localization}
        .dependencies=${this.dependencies}
        .middlewares=${this.middlewares}
        .validators=${this.allValidators}
        .validateOn=${this.validateOn ?? 'eager'}
        .autocomplete=${this.autocomplete}
      ></gui-core-form>
    `;
  }
}
