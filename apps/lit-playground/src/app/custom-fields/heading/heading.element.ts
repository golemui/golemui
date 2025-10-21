import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@formforge/lit';
import * as Core from '@formforge/core';

@customElement('app-heading')
export class HeadingElement extends LitElement implements Core.WithField {
  field!: Core.Field;
  adapter: Lit.FieldAdapter = new Lit.FieldAdapter();

  override connectedCallback() {
    super.connectedCallback();
    console.log('connectedCallback', this.field, this.adapter);
    this.adapter.init(this.field);
  }

  override render() {
    super.render();
    return html`<h2>${this.field.templateData()}</h2>`;
  }

  disconnectedCallback() {
    this.adapter.destroy();
  }
}
