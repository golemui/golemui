import './form.element.scss';
import '@golemui/lit';
import { customElement } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import * as Core from '@golemui/core';
import { loggerMiddleware } from '../../middlewares/logger.middleware';
import * as Vanilla from '@golemui/lit-vanilla';
import { kitchenSink } from '@golemui/shared-vanilla';

@customElement('lit-form')
export class FormElement extends LitElement {
  middlewares = [loggerMiddleware];
  formDef = kitchenSink;
  formData = {};
  vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.element')).HeadingElement,
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  protected onFormError(event: CustomEvent<Core.FormStoreError>) {
    const error = event.detail;
    this.error = '';
    if (error.kind === 'validation') {
      this.error = 'Validation errors: ' + error.errors;
    } else if (error.kind === 'fatal') {
      this.error = 'Fatal error: ' + error.error;
    }
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected onFormEvent(event: CustomEvent<Core.FormEvent>) {
    const evt = event.detail;
    console.groupCollapsed(`onFormEvent('${evt.name}')`);
    console.log(evt.data);
    console.groupEnd();
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
          @formError=${this.onFormError}
          @event=${this.onFormEvent}
        ></gui-form>
      </div>
    `;
  }
}
