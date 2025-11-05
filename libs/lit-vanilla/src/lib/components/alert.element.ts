import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';
import { AlertProps } from '@formforge/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('ff-alert')
export class AlertElement extends LitElement implements Core.WithField {
  field!: Core.Field;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.fieldContext })
  adapter = new Lit.FieldAdapter<AlertProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-alert');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="field" id=${this.field.uid}>
        <div class="ff-alert-notification ${this.adapter.templateData.level || 'default'}">
          ${this.adapter.templateData.text}
        </div>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
