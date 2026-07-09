import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { addIcon } from '@golemui/gui-components/internals';
import type { TimeInputProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/time-input';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-time-input')
export class TimeElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, TimeInputProps>();

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
    this.classList.add('gui-time', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Icon
    const timeIcon = addIcon('time', this.adapter.templateData);

    return html`
      <gui-time
        class=${classMap(timeIcon.widgetClasses)}
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label as string}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .icon=${this.adapter.templateData.icon}
        .localeId=${this.adapter.templateData.lang}
        .hourFormat=${this.adapter.templateData.hourFormat}
        .minuteStep=${this.adapter.templateData.minuteStep}
        .minTime=${this.adapter.templateData.minTime}
        .maxTime=${this.adapter.templateData.maxTime}
        .minTimeMessage=${this.adapter.templateData.minTimeMessage as string}
        .maxTimeMessage=${this.adapter.templateData.maxTimeMessage as string}
        @inputError=${this.onInputError}
        @blur=${() => this.adapter.onBlur()}
        @change=${this.valueChanged}
      ></gui-time>
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
