import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { RangeSliderProps, SliderRange } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-slider';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { live } from 'lit/directives/live.js';

export class RangeSliderElement extends LitElement implements WithWidget {
  widget!: InputWidget<SliderRange>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<SliderRange, RangeSliderProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-range-slider', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-range-slider
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        .touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${live(this.adapter.templateData.value)}
        .minimum=${this.adapter.templateData.minimum}
        .maximum=${this.adapter.templateData.maximum}
        .step=${this.adapter.templateData.step}
        .marks=${this.adapter.templateData.marks}
        .format=${this.adapter.templateData.format}
        .valuePlacement=${this.adapter.templateData.valuePlacement}
        .startLabel=${this.adapter.templateData.startLabel}
        .endLabel=${this.adapter.templateData.endLabel}
        .localeId=${this.adapter.templateData.lang}
        @gui-input=${this.valueChanged}
        @gui-blur=${() => this.adapter.onBlur()}
      ></gui-range-slider>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-range-slider-input', RangeSliderElement);
