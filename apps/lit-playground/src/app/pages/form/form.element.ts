import { allowedNames, kitchenSink, loggerMiddleware, signinData } from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/lit';
import * as Vanilla from '@golemui/lit-vanilla';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

@customElement('lit-form')
export class FormElement extends LitElement {
  middlewares = [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(ValidatorsVanilla.jsonSchemaValidators)),
    loggerMiddleware,
  ];
  formDef = kitchenSink;
  formData = signinData;
  vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.element')).HeadingElement,
  };
  validators: Core.ValidatorFn<ValidatorsVanilla.Validator> = ValidatorsVanilla.initValidators({
    allowedNames,
  });

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

  protected onFormEvent(event: CustomEvent<Core.FormEvent>) {
    const eventHandler = eventHandlers[event.detail.name as keyof typeof eventHandlers];
    if (eventHandler) {
      console.log(`✅ onFormEvent('${event.detail.name}')`);
      eventHandler(event.detail);
    } else {
      console.groupCollapsed(`⚠️ Unhandled - onFormEvent('${event.detail.name}')`);
      console.log(event.detail.data);
      console.groupEnd();
    }
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
          validateOn="change"
          @formError=${this.onFormError}
          @event=${this.onFormEvent}
        ></gui-form>
      </div>
    `;
  }
}

const eventHandlers = {
  async getSubregions(event: Core.FormEvent) {
    const response = await fetch('/data/subregions.json');
    const subregions = await response.json();
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: { path: 'subregion', prop: 'options', value: subregions },
    });
  },
  async getCountries(event: Core.FormEvent) {
    const response = await fetch('/data/countries.json');
    const countries = await response.json();
    const subregion = event.data['subregion'] as string;
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: {
        path: 'country',
        prop: 'options',
        value: countries[subregion.toLowerCase()],
      },
    });
  },
};
