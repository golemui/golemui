import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Core from '@formforge/core';

@customElement('ff-textinput')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.Field;

  override render() {
    super.render();
    return html`
      <div class="field">
        <input type="text" />
      </div>
    `;
  }
}
