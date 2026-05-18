import type { InputWidget, WithWidget } from '@golemui/core'
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit'
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

@customElement('freedom-shoelace-checkbox')
export class FreedomShoelaceCheckboxElement extends LitElement implements WithWidget {
  widget!: InputWidget<boolean>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<boolean, Record<string, never>>();

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
