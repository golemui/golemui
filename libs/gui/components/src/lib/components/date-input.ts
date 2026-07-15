import type { DateinputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  AbstractDateTimeInput,
  INVALID_DATE_MESSAGE,
  dateInputPartDescriptors,
  type DateTimePartDescriptor,
} from './abstract-date-time-input';
import {
  dateBoundsError,
  getDateFormatParts,
  maxValidDayInMonth,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

@customElement('gui-date')
export class GuiDate extends AbstractDateTimeInput {
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;

  protected override readonly inputBlockClass = 'gui-date-input';
  protected override readonly groups = ['default'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

  protected override getFormatParts(): Intl.DateTimeFormatPart[] {
    return getDateFormatParts(this.localeId);
  }

  protected override getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.parseValue(this.value ?? '');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & DateinputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      icon: this.icon,
      hint: this.hint,
    };

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: true,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-parts gui-parts-ring gui-date-input ${this.icon
            ? 'gui-calendar--icon'
            : ''}"
          role="group"
        >
          ${this.renderGroupParts('default')}
        </div>
        ${this.icon
          ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
          : nothing}
      </div>

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
        : nothing}
    `;
  }

  private parseValue(isoValue: string | null) {
    if (!isoValue) {
      this.clearGroup('default');
      return;
    }
    const date = parseISODateString(isoValue);
    if (!isNaN(date.getTime())) {
      this.setPartValue('default', 'day', date.getDate().toString().padStart(2, '0'));
      this.setPartValue('default', 'month', (date.getMonth() + 1).toString().padStart(2, '0'));
      this.setPartValue('default', 'year', date.getFullYear().toString());
    }
  }

  protected override commitParts(): void {
    this.validateAndEmit();
  }

  private validateAndEmit() {
    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    const yearVal = this.clampNumericPart(
      'default',
      'year',
      parseInt(this.getPartValue('default', 'year'), 10),
    );
    const monthVal = this.clampNumericPart(
      'default',
      'month',
      parseInt(this.getPartValue('default', 'month'), 10),
    );
    const dayVal = this.clampNumericPart(
      'default',
      'day',
      parseInt(this.getPartValue('default', 'day'), 10),
    );

    const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
    const isMonthValid = !isNaN(monthVal) && monthVal > 0;
    const isDayValid = !isNaN(dayVal) && dayVal > 0;

    if (isDayValid && isMonthValid && isYearValid) {
      const maxValidDay = maxValidDayInMonth(monthVal, yearVal);
      // Date is complete but invalid
      if (dayVal > maxValidDay) {
        this.dispatchEvent(
          new CustomEvent('inputError', {
            detail: { message: this.invalidDateMessage ?? INVALID_DATE_MESSAGE },
            bubbles: true,
          }),
        );
      } else {
        const candidate = toISODateString(new Date(yearVal, monthVal - 1, dayVal));
        const boundsError = dateBoundsError(candidate, this.minDate, this.maxDate, undefined, {
          minDateMessage: this.minDateMessage,
          maxDateMessage: this.maxDateMessage,
        });

        if (boundsError) {
          this.dispatchEvent(
            new CustomEvent('change', {
              detail: { value: candidate },
              bubbles: true,
            }),
          );
          this.dispatchEvent(
            new CustomEvent('inputError', {
              detail: { message: boundsError },
              bubbles: true,
            }),
          );
          this.requestUpdate();
          return;
        }

        this.value = candidate;

        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
          }),
        );
      }
    }

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date': GuiDate;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date')) {
  customElements.define('gui-date', GuiDate);
}
