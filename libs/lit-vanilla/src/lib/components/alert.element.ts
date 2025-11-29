import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@golemui/lit';
import { AlertProps } from '@golemui/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('gui-alert')
export class AlertElement extends LitElement implements Core.WithField {
  field!: Core.DisplayField;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.displayFieldContext })
  adapter = new Lit.DisplayFieldAdapter<AlertProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-alert');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="gui-field" id=${this.field.uid}>
        <div
          role="alert"
          class="gui-alert-notification gui-alert-notification--${this.adapter.templateData.level ||
          'default'}"
        >
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
