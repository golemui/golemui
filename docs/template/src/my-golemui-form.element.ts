import '@golemui/lit';
import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import * as Vanilla from '@golemui/lit-vanilla';
import * as Core from '@golemui/core';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';

@customElement('my-golemui-form')
export class MyGolemUIFormElement extends LitElement {
  @property() declare formDef: Record<string, any>;
  @property() declare formData: Record<string, any>;

  vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
  };

  validators: Core.ValidatorFn<ValidatorsVanilla.Validator> = ValidatorsVanilla.initValidators();

  override createRenderRoot() {
    return this;
  }

  async connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);

    if (params.has('form')) {
      const formDefResponse = await fetch(params.get('form')!);
      this.formDef = await formDefResponse.json();
    }

    if (params.has('data')) {
      const formDataResponse = await fetch(params.get('data')!);
      this.formData = await formDataResponse.json();
    } else {
      this.formData = {};
    }
  }

  render() {
    if (!this.formDef || !this.formData) {
      return html`<div>loading...</div>`;
    } else {
      return html`
        <div>
          <gui-form
            .formDef=${this.formDef}
            .data=${this.formData}
            .fieldLoaders=${this.vanillaFieldLoaders}
            .validators=${this.validators}
          ></gui-form>
        </div>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-golemui-form': MyGolemUIFormElement;
  }
}
