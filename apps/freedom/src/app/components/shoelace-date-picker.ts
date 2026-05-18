import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/input/input.js';

@customElement('freedom-shoelace-date-picker')
export class FreedomShoelaceDatePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, Record<string, never>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-shoelace-date-picker');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <sl-input
        type="date"
        label=${td.label ?? ''}
        .value=${td.value ?? ''}
        @sl-input=${(e: Event) => this.adapter.valueChanged((e.target as HTMLInputElement).value)}
        @sl-blur=${() => this.adapter.onBlur()}
      ></sl-input>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
