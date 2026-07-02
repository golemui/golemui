import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { addErrors, addIcon, addLabel } from '@golemui/gui-components/internals';
import type { DatePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/date-input';
import '@golemui/gui-components/calendar';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date-picker-input')
export class DatePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, DatePickerProps>();

  @query('#date-input') dateInput?: HTMLElement;
  @query('#calendar-input') calendarInput?: HTMLElement;

  @state() isCalendarOpen = false;

  subscriptions: Subscription[] = [];

  onFocusOut = (event: FocusEvent) => {
    if (!this.isCalendarOpen) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    this.closeCalendar();
  };

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
    document.addEventListener('click', this.onDocumentClick);
    this.addEventListener('focusout', this.onFocusOut);
    this.classList.add('gui-date-picker', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
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
          .prevMonthAriaLabel=${this.adapter.templateData.prevMonthAriaLabel}
          .nextMonthAriaLabel=${this.adapter.templateData.nextMonthAriaLabel}
          .dayFormat=${this.adapter.templateData.dayFormat}
          .weekdayFormat=${this.adapter.templateData.weekdayFormat}
          .monthFormat=${this.adapter.templateData.monthFormat}
          .minDate=${this.adapter.templateData.minDate}
          .maxDate=${this.adapter.templateData.maxDate}
          .disabledRanges=${this.adapter.templateData.disabledRanges}
          .numberOfMonths=${this.adapter.templateData.numberOfMonths}
          .localeId=${this.adapter.templateData.lang}
          @blur=${this.onBlurCalendar}
          @change=${this.onCalendarChange}
        ></gui-calendar>`
      : nothing;

    return html`
      ${addLabel(this.widget.uid, {
        ...this.adapter.templateData,
        required: this.adapter.templateData.validator?.required,
      })}

      <div
        role="button"
        tabindex="-1"
        class="gui-widget"
        aria-expanded=${this.isCalendarOpen}
        @keyup=${(e: Event) => this.onKeyUp(e)}
        @click=${(e: Event) => this.toggleCalendar(e)}
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
        <span class="gui-date-picker__arrow"
          ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        ${calendar}
      </div>

      ${addErrors(this.widget.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  // Selecting a day in the calendar commits a single date, so close the
  // calendar afterwards. The range picker intentionally stays open so the user
  // can select multiple ranges and closes it themselves.
  onCalendarChange(event: CustomEvent) {
    this.valueChanged(event);
    this.closeCalendar();
  }

  onBlurCalendar() {
    this.adapter.onBlur();
    this.closeCalendar();
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
  }

  onKeyUp(event: Event) {
    const evt = event as KeyboardEvent;
    if (evt.target !== evt.currentTarget) return;
    if (evt?.key === 'Enter' || evt?.key === ' ') {
      this.isCalendarOpen = !this.isCalendarOpen;
      this.requestUpdate();
    }
  }

  toggleCalendar(event: Event) {
    const target = event.target as HTMLElement;

    if (target.closest('.gui-calendar__day-button')) return;

    const isInputClick = target.closest('.gui-date-input__part');
    const isCalendarClick = target.closest('gui-calendar');
    if (isInputClick || isCalendarClick) {
      this.openCalendar();
    } else {
      this.isCalendarOpen = !this.isCalendarOpen;
      this.requestUpdate();
    }
  }

  openCalendar() {
    if (!this.isCalendarOpen) {
      this.isCalendarOpen = true;
      this.requestUpdate();
    }
  }

  closeCalendar() {
    this.isCalendarOpen = false;
    this.requestUpdate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.removeEventListener('focusout', this.onFocusOut);
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
