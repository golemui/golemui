import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import * as Core from '@formforge/core';
import * as Lit from '@formforge/lit';
import { Subscription } from 'rxjs';

@customElement('ff-button')
export class ButtonElement extends LitElement implements Core.WithField {
  field!: Core.InteractiveField;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.interactiveContext })
  adapter = new Lit.InteractiveAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-button');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="ff-field">
        <button
          type="button"
          id=${this.field.uid}
          @click=${() => this.adapter.click()}
          disabled=${this.adapter.templateData.disabled === true ? true : nothing}
        >
          ${this.adapter.templateData.label}
        </button>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
