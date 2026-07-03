import type { TimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  AbstractDateTimeInput,
  timeInputPartDescriptors,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './abstract-date-time-input';
import {
  from24Hour,
  getDayPeriodLabels,
  getTimeFormatParts,
  parseISODateTimeString,
  parseISOTimeString,
  resolveHourFormat,
  to24Hour,
  toISOTimeString,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

/**
 * Segmented time input (hh:mm) that emits an ISO time string (HH:mm:ss) on
 * change. Values hydrate from HH:mm[:ss], or from the time part of a local
 * ISO date-time string.
 *
 * The 12h/24h layout comes from the locale's hour cycle, overridable via
 * hour-format. In 12h mode a dayPeriod segment is rendered at the locale's
 * position: ArrowUp/ArrowDown toggle AM/PM (the only way to set it, so the
 * interaction is identical in every locale) and Backspace/Delete clear it.
 * Typed values clamp at their limits (30h -> 23 or
 * 12, 95m -> 59). On arrow increments hours stop at their limits while
 * minutes wrap around (59 -> 00); minute-step controls the minute arrow
 * increment.
 */
@customElement('gui-time')
export class GuiTime extends AbstractDateTimeInput {
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;

  protected override readonly inputBlockClass = 'gui-time-input';
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
    return getTimeFormatParts(this.localeId, this.effectiveHourFormat);
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
        descriptors: timeInputPartDescriptors(
          this.effectiveHourFormat,
          minuteStep,
          this.dayPeriodLabels.am,
        ),
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
    if (changedProperties.has('value') || changedProperties.has('hourFormat')) {
      this.parseValue(this.value ?? '');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & TimeInputProps = {
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
          class="gui-widget-input gui-time-input ${this.icon ? 'gui-calendar--icon' : ''}"
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

    let time = parseISOTimeString(isoValue);
    if (!time) {
      // Lenient fallback: accept the time part of a local ISO date-time
      const date = parseISODateTimeString(isoValue);
      if (isNaN(date.getTime())) return;
      time = { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() };
    }

    const hour24 = time.hours;
    if (this.effectiveHourFormat === '12') {
      const { hour12, period } = from24Hour(hour24);
      this.setPartValue('default', 'hour', hour12.toString().padStart(2, '0'));
      this.setPartValue('default', 'dayPeriod', period);
    } else {
      this.setPartValue('default', 'hour', hour24.toString().padStart(2, '0'));
    }
    this.setPartValue('default', 'minute', time.minutes.toString().padStart(2, '0'));
  }

  protected override commitParts(): void {
    this.validateAndEmit();
  }

  private validateAndEmit() {
    const is12h = this.effectiveHourFormat === '12';
    let hourVal = parseInt(this.getPartValue('default', 'hour'), 10);
    let minuteVal = parseInt(this.getPartValue('default', 'minute'), 10);
    const period = this.getPartValue('default', 'dayPeriod');

    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    if (!isNaN(hourVal)) {
      const clamped = this.clampToDescriptor('hour', hourVal);
      if (clamped !== hourVal) {
        hourVal = clamped;
        this.setPartValue('default', 'hour', hourVal.toString().padStart(2, '0'));
      }
    }
    if (!isNaN(minuteVal)) {
      const clamped = this.clampToDescriptor('minute', minuteVal);
      if (clamped !== minuteVal) {
        minuteVal = clamped;
        this.setPartValue('default', 'minute', minuteVal.toString().padStart(2, '0'));
      }
    }

    const isHourValid = !isNaN(hourVal);
    const isMinuteValid = !isNaN(minuteVal);
    const isPeriodValid = !is12h || period === 'am' || period === 'pm';

    if (isHourValid && isMinuteValid && isPeriodValid) {
      const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
      this.value = toISOTimeString(new Date(1970, 0, 1, hour24, minuteVal, 0));

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
        }),
      );
    }

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-time': GuiTime;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-time')) {
  customElements.define('gui-time', GuiTime);
}
