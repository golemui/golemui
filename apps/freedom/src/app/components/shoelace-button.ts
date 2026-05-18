import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('freedom-shoelace-button')
export class FreedomShoelaceButtonElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-shoelace-button');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <sl-button
        variant="primary"
        size="medium"
        ?disabled=${this.adapter.templateData.disabled === true}
        @click=${() => this.adapter.click()}
      >
        ${this.adapter.templateData.label}
      </sl-button>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
