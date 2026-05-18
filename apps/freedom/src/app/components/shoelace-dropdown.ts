import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

export type FreedomShoelaceDropdownProps = {
  items?: { value: string; label: string; flag?: string }[];
};

@customElement('freedom-shoelace-dropdown')
export class FreedomShoelaceDropdownElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, FreedomShoelaceDropdownProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-shoelace-dropdown');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const items = (td.items ?? []) as { value: string; label: string; flag?: string }[];
    return html`
      <sl-select
        label=${td.label ?? ''}
        .value=${td.value ?? ''}
        @sl-change=${(e: Event) => this.adapter.valueChanged((e.target as HTMLInputElement).value)}
        @sl-blur=${() => this.adapter.onBlur()}
      >
        ${items.map(
          (item) =>
            html`<sl-option value=${item.value}>
              ${item.flag ? html`<span slot="prefix">${item.flag}</span>` : null} ${item.label}
            </sl-option>`,
        )}
      </sl-select>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
