import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/lit';
import '@golemui/lit-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = AppsShared.kitchenSink;
  formData = AppsShared.kitchenSinkData;
  vanillaFieldLoaders = {
    heading: async () =>
      (await import('../../custom-fields/heading/heading.element')).HeadingElement,
  };
  middlewares = [AppsShared.loggerMiddleware];
  validators: ValidatorsVanilla.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  protected onFormError(event: CustomEvent<Core.FormStoreError>) {
    const error = event.detail;
    if (error.kind === 'validation') {
      this.error = 'Validation errors: ' + error.errors;
    } else if (error.kind === 'fatal') {
      this.error = 'Fatal error: ' + error.error;
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
          .fieldLoaders=${this.vanillaFieldLoaders}
          .middlewares=${this.middlewares}
          .validators=${this.validators}
          validateOn="eager"
          @formError=${this.onFormError}
          @formEvent=${this.onFormEvent}
        ></gui-form>
      </div>
    `;
  }
}
