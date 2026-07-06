import type { DateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  AbstractDateTimeInput,
  dateInputPartDescriptors,
  timeInputPartDescriptors,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './abstract-date-time-input';
import { maxValidDayInMonth } from '../utils/date';
import {
  from24Hour,
  getDateTimeFormatParts,
  getDayPeriodLabels,
  parseISODateTimeString,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

@customElement('gui-date-time')
export class GuiDateTime extends AbstractDateTimeInput {
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;

  protected override readonly inputBlockClass = 'gui-date-time-input';
  protected override readonly groups = ['default'] as const;

  // Intl.DateTimeFormat construction is expensive and these are consulted on
  // every keystroke, so the derived locale data is memoized per input change
  private _hourFormatCache: { key: string; format: HourFormat } | undefined;
  private _labelsCache: { key: string; labels: { am: string; pm: string } } | undefined;
  private _descriptorsCache:
    | { key: string; descriptors: Partial<Record<DateTimePartType, DateTimePartDescriptor>> }
    | undefined;

  private get effectiveHourFormat(): HourFormat {
    const key = `${this.localeId ?? ''}|${this.hourFormat ?? ''}`;
    if (this._hourFormatCache?.key !== key) {
      this._hourFormatCache = { key, format: resolveHourFormat(this.localeId, this.hourFormat) };
    }
    return this._hourFormatCache.format;
  }

  private get dayPeriodLabels(): { am: string; pm: string } {
    const key = this.localeId ?? '';
    if (this._labelsCache?.key !== key) {
      this._labelsCache = { key, labels: getDayPeriodLabels(this.localeId) };
    }
    return this._labelsCache.labels;
  }

  protected override getFormatParts(): Intl.DateTimeFormatPart[] {
    return getDateTimeFormatParts(this.localeId, this.effectiveHourFormat);
  }

  protected override getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    // `|| 1` (not ??): some framework bindings coerce an absent number prop
    // to 0 (e.g. Vue's patchDOMProp), and a 0 step would freeze the arrows
    const minuteStep = this.minuteStep || 1;
    const key = `${this.localeId ?? ''}|${this.effectiveHourFormat}|${minuteStep}`;
    let cache = this._descriptorsCache;
    if (cache?.key !== key) {
      cache = {
        key,
        descriptors: {
          ...dateInputPartDescriptors(),
          ...timeInputPartDescriptors(
            this.effectiveHourFormat,
            minuteStep,
            this.dayPeriodLabels.am,
          ),
        },
      };
      this._descriptorsCache = cache;
    }
    return cache.descriptors[type as keyof typeof cache.descriptors];
  }

  protected override getPartDisplayValue(group: string, type: DateTimePartType): string {
    const value = this.getPartValue(group, type);
    if (type === 'dayPeriod' && (value === 'am' || value === 'pm')) {
      return this.dayPeriodLabels[value];
    }
    return value;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    // !hasUpdated: parse on first render even when no value was ever set,
    if (
      !this.hasUpdated ||
      changedProperties.has('value') ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this.parseValue(this.value ?? '');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & DateTimeInputProps = {
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
          class="gui-widget-input gui-parts gui-parts-ring gui-date-time-input ${this.icon
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
      // The AM/PM toggle is a switch and always has a state
      if (this.effectiveHourFormat === '12') {
        this.setPartValue('default', 'dayPeriod', 'am');
      }
      return;
    }

    const date = parseISODateTimeString(isoValue);
    if (isNaN(date.getTime())) return;

    this.setPartValue('default', 'day', date.getDate().toString().padStart(2, '0'));
    this.setPartValue('default', 'month', (date.getMonth() + 1).toString().padStart(2, '0'));
    this.setPartValue('default', 'year', date.getFullYear().toString());

    const hour24 = date.getHours();
    if (this.effectiveHourFormat === '12') {
      const { hour12, period } = from24Hour(hour24);
      this.setPartValue('default', 'hour', hour12.toString().padStart(2, '0'));
      this.setPartValue('default', 'dayPeriod', period);
    } else {
      this.setPartValue('default', 'hour', hour24.toString().padStart(2, '0'));
    }
    this.setPartValue('default', 'minute', date.getMinutes().toString().padStart(2, '0'));
  }

  protected override commitParts(): void {
    this.validateAndEmit();
  }

  /** Clamps a part to its descriptor bounds, writing the correction back. */
  private clampPart(type: DateTimePartType, value: number): number {
    if (isNaN(value)) return value;
    const clamped = this.clampToDescriptor(type, value);
    if (clamped !== value) {
      const width = this.getPartDescriptor(type)?.maxLength ?? 2;
      this.setPartValue('default', type, clamped.toString().padStart(width, '0'));
    }
    return clamped;
  }

  private validateAndEmit() {
    const is12h = this.effectiveHourFormat === '12';

    const yearVal = this.clampPart('year', parseInt(this.getPartValue('default', 'year'), 10));
    const monthVal = this.clampPart('month', parseInt(this.getPartValue('default', 'month'), 10));
    const dayVal = this.clampPart('day', parseInt(this.getPartValue('default', 'day'), 10));
    const hourVal = this.clampPart('hour', parseInt(this.getPartValue('default', 'hour'), 10));
    const minuteVal = this.clampPart(
      'minute',
      parseInt(this.getPartValue('default', 'minute'), 10),
    );
    const period = this.getPartValue('default', 'dayPeriod');

    const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
    const isMonthValid = !isNaN(monthVal) && monthVal > 0;
    const isDayValid = !isNaN(dayVal) && dayVal > 0;
    const isHourValid = !isNaN(hourVal);
    const isMinuteValid = !isNaN(minuteVal);
    const isPeriodValid = !is12h || period === 'am' || period === 'pm';

    if (
      isYearValid &&
      isMonthValid &&
      isDayValid &&
      isHourValid &&
      isMinuteValid &&
      isPeriodValid
    ) {
      const maxValidDay = maxValidDayInMonth(monthVal, yearVal);
      // Date is complete but invalid
      if (dayVal > maxValidDay) {
        // TODO: add property for i18n error messages
        this.dispatchEvent(
          new CustomEvent('inputError', {
            detail: {
              message:
                'Invalid date: day is greater than the maximum valid day for the month and year.',
            },
            bubbles: true,
          }),
        );
      } else {
        const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
        this.value = toISODateTimeString(
          new Date(yearVal, monthVal - 1, dayVal, hour24, minuteVal, 0),
        );

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
    'gui-date-time': GuiDateTime;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date-time')) {
  customElements.define('gui-date-time', GuiDateTime);
}
