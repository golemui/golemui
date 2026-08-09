import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-time-input';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-range-date-time-input')
export class RangeDateTimeInputElement extends LitElement implements WithWidget {
  widget!: InputWidget<DateTimeRange[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<DateTimeRange[], RangeDateTimeInputProps>();

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
    this.classList.add('gui-range-date-time', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-range-date-time
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .icon=${this.adapter.templateData.icon}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .localeId=${this.adapter.templateData.lang}
        .dayAriaLabel=${this.adapter.templateData.dayAriaLabel}
        .monthAriaLabel=${this.adapter.templateData.monthAriaLabel}
        .yearAriaLabel=${this.adapter.templateData.yearAriaLabel}
        .hourAriaLabel=${this.adapter.templateData.hourAriaLabel}
        .minuteAriaLabel=${this.adapter.templateData.minuteAriaLabel}
        .dayPeriodAriaLabel=${this.adapter.templateData.dayPeriodAriaLabel}
        .separator=${this.adapter.templateData.separator}
        .removePillAriaLabel=${this.adapter.templateData.removePillAriaLabel}
        .startDateTimeAriaLabel=${this.adapter.templateData.startDateTimeAriaLabel}
        .endDateTimeAriaLabel=${this.adapter.templateData.endDateTimeAriaLabel}
        .hourFormat=${this.adapter.templateData.hourFormat}
        .minuteStep=${this.adapter.templateData.minuteStep}
        .minDateTime=${this.adapter.templateData.minDateTime}
        .maxDateTime=${this.adapter.templateData.maxDateTime}
        .invalidDateMessage=${this.adapter.templateData.invalidDateMessage as string}
        .minDateTimeMessage=${this.adapter.templateData.minDateTimeMessage as string}
        .maxDateTimeMessage=${this.adapter.templateData.maxDateTimeMessage as string}
        .incompleteMessage=${this.adapter.templateData.incompleteMessage as string}
        @change=${this.valueChanged}
        @inputError=${this.onInputError}
      ></gui-range-date-time>
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
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
