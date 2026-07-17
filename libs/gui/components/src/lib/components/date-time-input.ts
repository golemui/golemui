import type { DateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AbstractDateTimePartsInput } from './abstract-date-time-parts-input';
import { dateBoundsError } from '../utils/date';
import { compareISOTimes, toISOTimeString } from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

export const INVALID_MIN_TIME_MESSAGE = 'Invalid time: time is before the minimum allowed time.';
export const INVALID_MAX_TIME_MESSAGE = 'Invalid time: time is after the maximum allowed time.';

@customElement('gui-date-time')
export class GuiDateTime extends AbstractDateTimePartsInput {
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;

  protected override readonly inputBlockClass = 'gui-date-time-input';
  protected override readonly groups = ['default'] as const;

  /**
   * Constrains the date and time axes independently: `minDate`/`maxDate` bound
   * the day, `minTime`/`maxTime` bound the time-of-day on every allowed day.
   */
  protected override boundsError(iso: string, instant: Date): string | null {
    return (
      dateBoundsError(iso, this.minDate, this.maxDate, undefined, {
        minDateMessage: this.minDateMessage,
        maxDateMessage: this.maxDateMessage,
      }) ?? this.timeBoundsError(instant)
    );
  }

  private timeBoundsError(instant: Date): string | null {
    const time = toISOTimeString(instant);
    if (this.minTime && compareISOTimes(time, this.minTime) < 0) {
      return this.minTimeMessage ?? INVALID_MIN_TIME_MESSAGE;
    }
    if (this.maxTime && compareISOTimes(time, this.maxTime) > 0) {
      return this.maxTimeMessage ?? INVALID_MAX_TIME_MESSAGE;
    }
    return null;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    // !hasUpdated: parse on first render even when no value was ever set,
    if (
      !this.hasUpdated ||
      changedProperties.has('value') ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this.setGroupDateTime('default', this.value ?? '');
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

  protected override commitParts(): void {
    this.validateAndEmit();
  }

  private validateAndEmit() {
    const parsed = this.parseDateTimeGroup('default');
    if (!parsed) {
      this.requestUpdate();
      return;
    }

    // Impossible date (e.g. Feb 31): surface the error, nothing to advance to.
    if (parsed.error && !parsed.iso) {
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: parsed.error }, bubbles: true }),
      );
      this.requestUpdate();
      return;
    }

    // Out of bounds: advance the value (so a host popover reflects it) then error.
    if (parsed.error && parsed.iso) {
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value: parsed.iso }, bubbles: true }),
      );
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: parsed.error }, bubbles: true }),
      );
      this.requestUpdate();
      return;
    }

    this.value = parsed.iso as string;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true }),
    );
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
