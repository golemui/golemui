import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { addErrors, addIcon, addLabel, DatePickerProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date-picker-input')
export class DatePickerElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, DatePickerProps>();

  @query('#date-input') dateInput?: HTMLElement;
  @query('#calendar-input') calendarInput?: HTMLElement;

  @state() isCalendarOpen = false;

  subscriptions: Subscription[] = [];

  onDocumentClick = (event: MouseEvent) => {
    if (!this.isCalendarOpen) return;

    const path = event.composedPath();
    const clickedInsideDate = this.dateInput && path.includes(this.dateInput);
    const clickedInsideCalendar = this.calendarInput && path.includes(this.calendarInput);

    if (!clickedInsideDate && !clickedInsideCalendar) {
      this.closeCalendar();
    }
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.classList.add('gui-date-picker');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
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

  override render() {
    super.render();

    // Icon
    const datePickerIcon = addIcon('datePicker', this.adapter.templateData);

    const calendar = this.isCalendarOpen
      ? html`<gui-calendar
          id="calendar-input"
          .uid=${this.widget.uid}
          .hint=${this.adapter.templateData.hint}
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
          .localeId=${this.adapter.templateData.lang}
          @blur=${this.onBlurCalendar}
          @change=${this.valueChanged}
        ></gui-calendar>`
      : nothing;

    return html`
      ${addLabel(this.widget.uid, this.adapter.templateData)}

      <div
        role="button"
        tabindex="0"
        class="gui-widget"
        aria-expanded=${this.isCalendarOpen}
        @keyup=${() => this.onKeyUp(event)}
        @click=${() => this.openCalendar()}
      >
        <gui-date
          id="date-input"
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.widget.uid}
          .hint=${this.adapter.templateData.hint}
          .showErrors=${false}
          .errors=${this.adapter.templateData.errors}
          ?touched=${this.adapter.templateData.touched}
          ?required=${this.adapter.templateData.validator?.required}
          ?disabled=${this.adapter.templateData.disabled}
          ?readonly=${this.adapter.templateData.readonly}
          .value=${this.adapter.templateData.value}
          .icon=${this.adapter.templateData.icon}
          .localeId=${this.adapter.templateData.lang}
          @inputError=${this.onInputError}
          @blur=${() => this.adapter.onBlur()}
          @focus=${this.openCalendar}
          @change=${this.valueChanged}
        ></gui-date>

        ${calendar}
      </div>

      ${addErrors(this.widget.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  onBlurCalendar() {
    this.adapter.onBlur();
    this.closeCalendar();
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
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
