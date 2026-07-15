import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { TimeRange, RangeTimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-time-picker';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-range-time-picker-input')
export class RangeTimePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<TimeRange[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<TimeRange[], RangeTimePickerProps>();

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
    this.classList.add('gui-range-time-picker', 'gui-field');
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
      <gui-range-time-picker
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
        .startTimeAriaLabel=${templateData.startTimeAriaLabel}
        .endTimeAriaLabel=${templateData.endTimeAriaLabel}
        .startTimeLabel=${templateData.startTimeLabel}
        .endTimeLabel=${templateData.endTimeLabel}
        .hourFormat=${templateData.hourFormat}
        .minuteStep=${templateData.minuteStep}
        .minTime=${templateData.minTime}
        .maxTime=${templateData.maxTime}
        .disabledRanges=${templateData.disabledRanges}
        ?allow-custom-time=${templateData.allowCustomTime}
        .height=${templateData.height}
        .itemHeight=${templateData.itemHeight}
        .minTimeMessage=${templateData.minTimeMessage as string}
        .maxTimeMessage=${templateData.maxTimeMessage as string}
        .rangeOrderMessage=${templateData.rangeOrderMessage as string}
        .disabledRangeMessage=${templateData.disabledRangeMessage as string}
        .noAvailableTimesMessage=${templateData.noAvailableTimesMessage as string}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
        @change=${this.valueChanged}
      ></gui-range-time-picker>
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
