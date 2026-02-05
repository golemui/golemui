import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { CalendarProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-calendar-control')
export class CalendarElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, CalendarProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-calendar');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-calendar
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
        .dayFormat=${this.adapter.templateData.dayFormat}
        .weekdayFormat=${this.adapter.templateData.weekdayFormat}
        .monthFormat=${this.adapter.templateData.monthFormat}
        .minDate=${this.adapter.templateData.minDate}
        .maxDate=${this.adapter.templateData.maxDate}
        .disabledRanges=${this.adapter.templateData.disabledRanges}
        .numberOfMonths=${this.adapter.templateData.numberOfMonths}
        .localeId=${this.adapter.templateData.lang}
        @change=${this.valueChanged}
      ></gui-calendar>
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
