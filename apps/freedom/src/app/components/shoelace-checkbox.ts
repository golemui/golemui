import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

@customElement('freedom-shoelace-checkbox')
export class FreedomShoelaceCheckboxElement extends LitElement implements Core.WithWidget {
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
    this.classList.add('freedom-shoelace-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <sl-checkbox
        ?checked=${td.value === true}
        @sl-change=${(e: Event) =>
          this.adapter.valueChanged((e.target as HTMLInputElement).checked)}
        @sl-blur=${() => this.adapter.onBlur()}
      >
        ${td.label ?? ''}
      </sl-checkbox>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
