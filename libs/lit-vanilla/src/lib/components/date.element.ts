import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { addIcon, DatePickerProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date-control')
export class DateElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, DatePickerProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-date');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Icon
    const dateIcon = addIcon('date', this.adapter.templateData);

    return html`
      <gui-date
        class=${classMap(dateIcon.fieldClasses)}
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label as string}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .icon=${this.adapter.templateData.icon}
        @inputError=${() => this.onInputError(event)}
        @blur=${() => this.adapter.onBlur()}
        @change=${() => this.valueChanged(event)}
      ></gui-date>
    `;
  }

  valueChanged(event: Event | undefined) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event | undefined) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
