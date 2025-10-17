import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';

@customElement('ff-stack')
export class StackElement extends LitElement implements Core.WithField {
  field!: Core.Field;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutAdapter();

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);
  }

  override render() {
    super.render();
    return html`<div class="ff-stack"></div>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
  }
}
