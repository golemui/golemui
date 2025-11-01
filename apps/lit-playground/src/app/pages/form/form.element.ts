import './form.element.scss';
import '@formforge/lit';
import { customElement } from 'lit/decorators.js';
import { LitElement, html } from 'lit';
import * as Core from '@formforge/core';
import { loggerMiddleware } from '../../middlewares/logger.middleware';
import { users, usersData } from '../../mocks';
import * as Vanilla from '@formforge/lit-vanilla';

@customElement('lit-form')
export class FormElement extends LitElement {
  middlewares = [loggerMiddleware];
  formDef = users;
  formData = usersData;
  vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.element')).HeadingElement,
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  protected onFormError(error: Core.FormStoreError) {
    this.error = '';
    if (error.kind === 'validation') {
      this.error = 'Validation errors: ' + error.errors;
    } else if (error.kind === 'fatal') {
      this.error = 'Fatal error: ' + error.error;
    }
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.groupCollapsed(`onFormEvent('${event.name}')`);
    console.log(event.data);
    console.groupEnd();
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <ff-form
          .formDef=${this.formDef}
          .data=${this.formData}
          .fieldLoaders=${this.vanillaFieldLoaders}
          .middlewares=${this.middlewares}
          @formError=${this.onFormError}
          @event=${this.onFormEvent}
        ></ff-form>
      </div>
    `;
  }
}
