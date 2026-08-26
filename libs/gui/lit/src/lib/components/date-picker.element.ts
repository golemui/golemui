import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { DatePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/date-picker';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';

export class DatePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, DatePickerProps>();

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
    this.classList.add('gui-date-picker', 'gui-field');
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
      <gui-date-picker
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
        .toggleAriaLabel=${templateData.toggleAriaLabel}
        .dayAriaLabel=${templateData.dayAriaLabel}
        .monthAriaLabel=${templateData.monthAriaLabel}
        .yearAriaLabel=${templateData.yearAriaLabel}
        .prevMonthIcon=${templateData.prevMonthIcon}
        .nextMonthIcon=${templateData.nextMonthIcon}
        .prevMonthAriaLabel=${templateData.prevMonthAriaLabel}
        .nextMonthAriaLabel=${templateData.nextMonthAriaLabel}
        .selectYearAriaLabel=${templateData.selectYearAriaLabel}
        .yearGridAriaLabel=${templateData.yearGridAriaLabel}
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
        .incompleteMessage=${templateData.incompleteMessage as string}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
        @change=${this.valueChanged}
      ></gui-date-picker>
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-date-picker-input', DatePickerElement);
