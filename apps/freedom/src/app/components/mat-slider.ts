import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/slider/slider.js';

export type FreedomMatSliderProps = {
  min?: number;
  max?: number;
  step?: number;
};

@customElement('freedom-mat-slider')
export class FreedomMatSliderElement extends LitElement implements WithWidget {
  widget!: InputWidget<number>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<number, FreedomMatSliderProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-slider');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <label class="freedom-mat-slider__label">${td.label ?? ''}</label>
      <md-slider
        labeled
        .value=${typeof td.value === 'number' ? td.value : 0}
        min=${td.min ?? 0}
        max=${td.max ?? 10}
        step=${td.step ?? 1}
        @input=${(e: Event) =>
          this.adapter.valueChanged(Number((e.target as HTMLInputElement).value))}
        @blur=${() => this.adapter.onBlur()}
      ></md-slider>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
