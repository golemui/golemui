import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { DatePickerProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addErrors, addIcon, addLabel } from '../utils/templates';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date-picker-control')
export class DatePickerElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, DatePickerProps>();

  @query('#date-control') dateControl?: HTMLElement;
  @query('#calendar-control') calendarControl?: HTMLElement;

  @state() isCalendarOpen = false;

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.classList.add('gui-date-picker');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onDocumentClick = (event: MouseEvent) => {
    if (!this.isCalendarOpen) return;

    const path = event.composedPath();
    const clickedInsideDate = this.dateControl && path.includes(this.dateControl);
    const clickedInsideCalendar = this.calendarControl && path.includes(this.calendarControl);

    if (!clickedInsideDate && !clickedInsideCalendar) {
      this.closeCalendar();
    }
  };

  override render() {
    super.render();

    // Icon
    const datePickerIcon = addIcon('datePicker', this.adapter.templateData);
    const showErrors =
      this.adapter.templateData.touched &&
      this.adapter.templateData.errors &&
      this.adapter.templateData.errors.length > 0;

    const calendar = this.isCalendarOpen
      ? html`<gui-calendar
          id="calendar-control"
          .uid=${this.field.uid}
          .hint=${this.adapter.templateData.hint}
          .touched=${this.adapter.templateData.touched}
          .errors=${this.adapter.templateData.errors}
          .hasError=${showErrors}
          .disabled=${this.adapter.templateData.disabled}
          .readonly=${this.adapter.templateData.readonly}
          .value=${this.adapter.templateData.value}
          .prevMonthIcon=${this.adapter.templateData.prevMonthIcon}
          .nextMonthIcon=${this.adapter.templateData.nextMonthIcon}
          .dayFormat=${this.adapter.templateData.dayFormat}
          .weekdayFormat=${this.adapter.templateData.weekdayFormat}
          .monthFormat=${this.adapter.templateData.monthFormat}
          @change=${() => this.valueChanged(event)}
        ></gui-calendar>`
      : nothing;

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div
        role="button"
        tabindex="0"
        class="gui-field"
        aria-expanded=${this.isCalendarOpen}
        @keyup=${() => this.onKeyUp(event)}
        @click=${() => this.openCalendar()}
      >
        <gui-date
          id="date-control"
          class=${classMap(datePickerIcon.fieldClasses)}
          .uid=${this.field.uid}
          .hint=${this.adapter.templateData.hint ?? nothing}
          .touched=${this.adapter.templateData.touched}
          .errors=${this.adapter.templateData.errors}
          .hasError=${showErrors}
          ?disabled=${this.adapter.templateData.disabled ?? nothing}
          ?readonly=${this.adapter.templateData.readonly ?? nothing}
          .value=${this.adapter.templateData.value}
          .icon=${this.adapter.templateData.icon ?? nothing}
          @inputError=${() => this.onInputError(event)}
          @blur=${() => this.adapter.onBlur()}
          @focus=${() => this.openCalendar()}
          @change=${() => this.valueChanged(event)}
        ></gui-date>

        ${calendar}
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

  onKeyUp(event: Event | undefined) {
    const evt = event as KeyboardEvent;
    if (evt?.key === 'Enter' || evt?.key === ' ') {
      this.openCalendar();
    }
  }

  openCalendar() {
    this.isCalendarOpen = true;
    this.requestUpdate();
  }

  closeCalendar() {
    this.isCalendarOpen = false;
    this.requestUpdate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
