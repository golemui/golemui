import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';

@customElement('ff-textinput')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlAdapter();

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);
  }

  override render() {
    super.render();
    return html`
      <div class="field">
        <label [for]="field.uid"
          >${this.adapter.templateData['label'] +
          (this.adapter.templateData['required'] ? ' *' : '')}</label
        >
        <input
          type="text"
          id=${this.field.uid}
          value=${this.adapter.templateData['value'] ?? ''}
          disabled=${this.adapter.templateData['disabled'] || nothing}
          @input="${this.valueChanged}"
        />
      </div>
    `;
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
  }
}
