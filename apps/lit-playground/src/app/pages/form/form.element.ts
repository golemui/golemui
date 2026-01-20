import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/lit-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import './form.element.scss';

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = AppsShared.translationsForm;
  formData = AppsShared.translationsFormData;
  customFieldLoaders = {
    heading: async () =>
      (await import('../../custom-fields/heading/heading.element')).HeadingElement,
  };
  itemRenderers = {
    complexListItemRenderer: complexListItemRenderer,
  };
  localization: Core.I18nTranslator = AppsShared.i18nTranslator;
  middlewares = [AppsShared.loggerMiddleware];
  validators: ValidatorsVanilla.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  protected onFormHealth(event: CustomEvent<Core.FormHealth>) {
    const health = event.detail;
    if (health.status === 'errored') {
      this.error = health.message;
    }
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected async onFormEvent(event: CustomEvent<Core.FormEvent>) {
    await AppsShared.onFormEvent(event.detail);
    Promise.resolve().then(() => this.requestUpdate());
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <gui-form
          .formDef=${this.formDef}
          .data=${this.formData}
          .fieldLoaders=${this.customFieldLoaders}
          .itemRenderers=${this.itemRenderers}
          .localization=${this.localization}
          .middlewares=${this.middlewares}
          .validators=${this.validators}
          .validateOn=${'eager'}
          @formHealth=${this.onFormHealth}
          @formEvent=${this.onFormEvent}
        ></gui-form>
      </div>
    `;
  }
}
