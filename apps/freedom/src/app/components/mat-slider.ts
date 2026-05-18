import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
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
export class FreedomMatSliderElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<number>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<number, FreedomMatSliderProps>();

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
