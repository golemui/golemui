import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { DateRange, RangeCalendarProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-calendar';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-range-calendar-input')
export class RangeCalendarElement extends LitElement implements WithWidget {
  widget!: InputWidget<DateRange[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<DateRange[], RangeCalendarProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: any) {
    super.updated(changedProperties);

    const size = this.adapter.templateData.size;

    if (size) {
      this.style.flex = String(size);
    } else {
      this.style.removeProperty('flex');
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-calendar', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-range-calendar
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .prevMonthIcon=${this.adapter.templateData.prevMonthIcon}
        .nextMonthIcon=${this.adapter.templateData.nextMonthIcon}
        .prevMonthAriaLabel=${this.adapter.templateData.prevMonthAriaLabel}
        .nextMonthAriaLabel=${this.adapter.templateData.nextMonthAriaLabel}
        .dayFormat=${this.adapter.templateData.dayFormat}
        .weekdayFormat=${this.adapter.templateData.weekdayFormat}
        .monthFormat=${this.adapter.templateData.monthFormat}
        .minDate=${this.adapter.templateData.minDate}
        .maxDate=${this.adapter.templateData.maxDate}
        .disabledRanges=${this.adapter.templateData.disabledRanges}
        .numberOfMonths=${this.adapter.templateData.numberOfMonths}
        .hidePills=${false}
        .removePillAriaLabel=${this.adapter.templateData.removePillAriaLabel}
        .localeId=${this.adapter.templateData.lang}
        @change=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-range-calendar>
    `;
  }

  valueChanged(event: InputEvent) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
