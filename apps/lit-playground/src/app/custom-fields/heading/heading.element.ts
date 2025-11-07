import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@formforge/lit';
import * as Core from '@formforge/core';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@customElement('app-heading')
export class HeadingElement extends LitElement implements Core.WithField {
  field!: Core.DisplayField;
  adapter: Lit.DisplayFieldAdapter<OwnWidgetProps> = new Lit.DisplayFieldAdapter();

  override connectedCallback() {
    super.connectedCallback();
    console.log('connectedCallback', this.field, this.adapter);
    this.adapter.init(this.field);
  }

  override render() {
    super.render();
    switch (this.adapter.templateData.level) {
      case 6:
        return html`<h6>${this.adapter.templateData.text}</h6>`;
      case 5:
        return html`<h5>${this.adapter.templateData.text}</h5>`;
      case 4:
        return html`<h4>${this.adapter.templateData.text}</h4>`;
      case 3:
        return html`<h3>${this.adapter.templateData.text}</h3>`;
      case 2:
        return html`<h2>${this.adapter.templateData.text}</h2>`;
      case 1:
      default:
        return html`<h1>${this.adapter.templateData.text}</h1>`;
    }
  }

  disconnectedCallback() {
    this.adapter.destroy();
  }
}
