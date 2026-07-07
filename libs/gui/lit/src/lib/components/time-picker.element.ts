import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { TimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/time-picker';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-time-picker-input')
export class TimePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, TimePickerProps>();

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
    this.classList.add('gui-time-picker', 'gui-field');
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
      <gui-time-picker
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
        .hourFormat=${templateData.hourFormat}
        .minuteStep=${templateData.minuteStep}
        .minTime=${templateData.minTime}
        .maxTime=${templateData.maxTime}
        .disabledRanges=${templateData.disabledRanges}
        ?allow-custom-time=${templateData.allowCustomTime}
        .height=${templateData.height}
        .itemHeight=${templateData.itemHeight}
        .minTimeMessage=${templateData.minTimeMessage}
        .maxTimeMessage=${templateData.maxTimeMessage}
        .disabledRangeMessage=${templateData.disabledRangeMessage}
        .noAvailableTimesMessage=${templateData.noAvailableTimesMessage}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
        @change=${this.valueChanged}
      ></gui-time-picker>
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
