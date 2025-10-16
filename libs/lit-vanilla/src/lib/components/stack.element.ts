import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Core from '@formforge/core';

@customElement('ff-stack')
export class StackElement extends LitElement implements Core.WithField {
  field!: Core.Field;

  override render() {
    super.render();
    return html`<div class="ff-stack"></div>`;
  }
}
