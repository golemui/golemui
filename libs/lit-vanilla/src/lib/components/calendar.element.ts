import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { CalendarProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-calendar-control')
export class CalendarElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

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
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Icon
    const showErrors =
      this.adapter.templateData.touched &&
      this.adapter.templateData.errors &&
      this.adapter.templateData.errors.length > 0;

    return html`
      <gui-calendar
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .touched=${this.adapter.templateData.touched}
        .errors=${this.adapter.templateData.errors}
        .hasError=${showErrors}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .prevMonthIcon=${this.adapter.templateData.prevMonthIcon}
        .nextMonthIcon=${this.adapter.templateData.nextMonthIcon}
        .dayFormat=${this.adapter.templateData.dayFormat}
        .weekdayFormat=${this.adapter.templateData.weekdayFormat}
        .monthFormat=${this.adapter.templateData.monthFormat}
        @change=${() => this.valueChanged(event)}
      ></gui-calendar>
    `;
  }

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
