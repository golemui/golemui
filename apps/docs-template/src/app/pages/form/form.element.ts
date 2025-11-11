import './form.element.scss';
import '@golemui/lit';
import { customElement, property } from 'lit/decorators.js';
import { LitElement, html } from 'lit';
import * as Vanilla from '@golemui/lit-vanilla';

@customElement('lit-form')
export class FormElement extends LitElement {
  @property() declare formDef: Record<string, any>;
  @property() declare formData: Record<string, any>;

  vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
  };

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
    }
  }

  render() {
    if (!this.formDef) {
      return html`<div>loading...</div>`;
    } else {
      return html`
        <div>
          <gui-form
            .formDef=${this.formDef}
            .data=${this.formData}
            .fieldLoaders=${this.vanillaFieldLoaders}
          ></gui-form>
        </div>
      `;
    }
  }
}
