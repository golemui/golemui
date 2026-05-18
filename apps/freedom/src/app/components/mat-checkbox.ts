import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/checkbox/checkbox.js';

@customElement('freedom-mat-checkbox')
export class FreedomMatCheckboxElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<boolean>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<boolean, Record<string, never>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <label class="freedom-mat-checkbox__row">
        <md-checkbox
          ?checked=${td.value === true}
          @change=${(e: Event) => this.adapter.valueChanged((e.target as HTMLInputElement).checked)}
          @blur=${() => this.adapter.onBlur()}
        ></md-checkbox>
        <span class="freedom-mat-checkbox__label">${td.label ?? ''}</span>
      </label>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
