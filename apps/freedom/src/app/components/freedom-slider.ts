import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

export type FreedomSliderProps = {
  min?: number;
  max?: number;
  step?: number;
};

@customElement('freedom-slider')
export class FreedomSliderElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<number>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<number, FreedomSliderProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-slider');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const value = typeof td.value === 'number' ? td.value : 0;
    return html`
      <label class="freedom-slider__label">${td.label ?? ''}</label>
      <div class="freedom-slider__track-wrap">
        <input
          type="range"
          class="freedom-slider__range"
          .value=${String(value)}
          min=${td.min ?? 0}
          max=${td.max ?? 10}
          step=${td.step ?? 1}
          @input=${(e: Event) =>
            this.adapter.valueChanged(Number((e.target as HTMLInputElement).value))}
          @blur=${() => this.adapter.onBlur()}
        />
        <span class="freedom-slider__value">${value}</span>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
