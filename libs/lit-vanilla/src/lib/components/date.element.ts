import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { DatePickerProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addErrors, addIcon, addLabel } from '../utils/templates';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date')
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
    const showErrors =
      this.adapter.templateData.touched &&
      this.adapter.templateData.errors &&
      this.adapter.templateData.errors.length > 0;

    console.log('show errors', showErrors, this.adapter.templateData.errors);

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">
        <gui-date-control
          class=${classMap(dateIcon.fieldClasses)}
          .uid=${this.field.uid}
          .hint=${this.adapter.templateData.hint ?? nothing}
          .touched=${this.adapter.templateData.touched}
          .errors=${this.adapter.templateData.errors}
          .hasError=${showErrors}
          .?disabled=${this.adapter.templateData.disabled ?? nothing}
          .?readonly=${this.adapter.templateData.readonly ?? nothing}
          .value=${this.adapter.templateData.value}
          .icon=${this.adapter.templateData.icon ?? nothing}
          @inputError=${() => this.onInputError(event)}
          @blur=${() => this.adapter.onBlur()}
          @change=${() => this.valueChanged(event)}
        ></gui-date-control>
      </div>

      ${addErrors(this.field.uid, this.adapter.templateData)}
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
