import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/button/filled-button.js';

@customElement('freedom-mat-button')
export class FreedomMatButtonElement extends LitElement implements Core.WithWidget {
  widget!: Core.ActionWidget;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.actionContext })
  adapter = new Lit.ActionWidgetAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-button');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <md-filled-button
        @click=${() => this.adapter.click()}
        ?disabled=${this.adapter.templateData.disabled === true}
      >
        ${this.adapter.templateData.label}
      </md-filled-button>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
