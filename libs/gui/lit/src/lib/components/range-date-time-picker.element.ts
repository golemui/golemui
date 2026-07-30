import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { DateTimeRange, RangeDateTimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-time-picker';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-range-date-time-picker-input')
export class RangeDateTimePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<DateTimeRange[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<DateTimeRange[], RangeDateTimePickerProps>();

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
    this.classList.add('gui-range-date-time-picker', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    const templateData = this.adapter.templateData;

    return html`
      <gui-range-date-time-picker
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .icon=${templateData.icon}
        .errors=${templateData.errors}
        ?touched=${templateData.touched}
        ?required=${templateData.validator?.required}
        ?disabled=${templateData.disabled}
        ?readonly=${templateData.readonly}
        .value=${templateData.value}
        .separator=${templateData.separator as string}
        .removePillAriaLabel=${templateData.removePillAriaLabel}
        .startDateTimeAriaLabel=${templateData.startDateTimeAriaLabel as string}
        .endDateTimeAriaLabel=${templateData.endDateTimeAriaLabel as string}
        .invalidDateMessage=${templateData.invalidDateMessage as string}
        .prevMonthIcon=${templateData.prevMonthIcon}
        .nextMonthIcon=${templateData.nextMonthIcon}
        .prevMonthAriaLabel=${templateData.prevMonthAriaLabel}
        .nextMonthAriaLabel=${templateData.nextMonthAriaLabel}
        .selectYearAriaLabel=${templateData.selectYearAriaLabel}
        .yearGridAriaLabel=${templateData.yearGridAriaLabel}
        .dayFormat=${templateData.dayFormat}
        .weekdayFormat=${templateData.weekdayFormat}
        .monthFormat=${templateData.monthFormat}
        .numberOfMonths=${templateData.numberOfMonths}
        .localeId=${templateData.lang}
        .toggleAriaLabel=${templateData.toggleAriaLabel}
        .dayAriaLabel=${templateData.dayAriaLabel}
        .monthAriaLabel=${templateData.monthAriaLabel}
        .yearAriaLabel=${templateData.yearAriaLabel}
        .hourAriaLabel=${templateData.hourAriaLabel}
        .minuteAriaLabel=${templateData.minuteAriaLabel}
        .dayPeriodAriaLabel=${templateData.dayPeriodAriaLabel}
        .hourFormat=${templateData.hourFormat}
        .minuteStep=${templateData.minuteStep}
        ?allow-custom-time=${templateData.allowCustomTime}
        .startTimeLabel=${templateData.startTimeLabel as string}
        .endTimeLabel=${templateData.endTimeLabel as string}
        .minDateTime=${templateData.minDateTime}
        .maxDateTime=${templateData.maxDateTime}
        .disabledRanges=${templateData.disabledRanges}
        .minDateTimeMessage=${templateData.minDateTimeMessage as string}
        .maxDateTimeMessage=${templateData.maxDateTimeMessage as string}
        .disabledRangeMessage=${templateData.disabledRangeMessage as string}
        .noAvailableTimesMessage=${templateData.noAvailableTimesMessage as string}
        .dayCountAriaLabel=${templateData.dayCountAriaLabel as string}
        .disabledDayCountAriaLabel=${templateData.disabledDayCountAriaLabel as string}
        @change=${this.valueChanged}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
      ></gui-range-date-time-picker>
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
    // Surface the error immediately on a completed selection, without waiting
    // for a click-outside blur.
    this.adapter.onBlur();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
