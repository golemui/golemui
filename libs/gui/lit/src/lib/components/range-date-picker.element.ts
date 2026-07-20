import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { DateRange, RangeDatePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-picker';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-range-date-picker-input')
export class RangeDatePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<DateRange[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<DateRange[], RangeDatePickerProps>();

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
    this.classList.add('gui-range-date-picker', 'gui-field');
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
      <gui-range-date-picker
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        ?touched=${templateData.touched}
        ?required=${templateData.validator?.required}
        ?disabled=${templateData.disabled}
        ?readonly=${templateData.readonly}
        .value=${templateData.value}
        .icon=${templateData.icon}
        .localeId=${templateData.lang}
        .separator=${templateData.separator}
        .removePillAriaLabel=${templateData.removePillAriaLabel}
        .startDateAriaLabel=${templateData.startDateAriaLabel}
        .endDateAriaLabel=${templateData.endDateAriaLabel}
        .prevMonthIcon=${templateData.prevMonthIcon}
        .nextMonthIcon=${templateData.nextMonthIcon}
        .prevMonthAriaLabel=${templateData.prevMonthAriaLabel}
        .nextMonthAriaLabel=${templateData.nextMonthAriaLabel}
        .dayFormat=${templateData.dayFormat}
        .weekdayFormat=${templateData.weekdayFormat}
        .monthFormat=${templateData.monthFormat}
        .minDate=${templateData.minDate}
        .maxDate=${templateData.maxDate}
        .disabledRanges=${templateData.disabledRanges}
        .numberOfMonths=${templateData.numberOfMonths}
        .invalidDateMessage=${templateData.invalidDateMessage as string}
        .minDateMessage=${templateData.minDateMessage as string}
        .maxDateMessage=${templateData.maxDateMessage as string}
        .disabledDateRangeMessage=${templateData.disabledDateRangeMessage as string}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
        @change=${this.valueChanged}
      ></gui-range-date-picker>
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
    this.adapter.onBlur();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
