import type { InputWidget, WithWidget } from '@golemui/core'
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit'
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@shoelace-style/shoelace/dist/components/range/range.js';

export type FreedomShoelaceSliderProps = {
  min?: number;
  max?: number;
  step?: number;
};

@customElement('freedom-shoelace-slider')
export class FreedomShoelaceSliderElement extends LitElement implements WithWidget {
  widget!: InputWidget<number>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<number, FreedomShoelaceSliderProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-shoelace-slider');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <sl-range
        label=${td.label ?? ''}
        .value=${typeof td.value === 'number' ? td.value : 0}
        min=${td.min ?? 0}
        max=${td.max ?? 10}
        step=${td.step ?? 1}
        @sl-input=${(e: Event) =>
          this.adapter.valueChanged(Number((e.target as HTMLInputElement).value))}
        @sl-blur=${() => this.adapter.onBlur()}
      ></sl-range>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
