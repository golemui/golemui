import type { DateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { dateBoundsError } from '../utils/date';
import { INCOMPLETE_DATE_TIME_MESSAGE } from '../utils/messages';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseDateTimeGroup,
  parseDateTimeSubGroups,
  PART_DEFAULT_ARIA_LABELS,
  timeBoundsError,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
  type TimeLocaleData,
} from '../utils/parts';

const DATE_TIME_PART_TYPES: readonly DateTimePartType[] = [
  'day',
  'month',
  'year',
  'hour',
  'minute',
];
import { getDateTimeFormatParts, toISOTimeString, type HourFormat } from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

export class GuiDateTime extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;

  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;

  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

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
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this input into the picker's popover must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-date-time-input';
  private readonly groups = ['default'] as const;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: (group) => this.validateAndEmit(group),
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: (group, type) => {
      // A raw 0 counts as emptying the part, so clear it in state (the clamp
      // write-back would otherwise leave a phantom value behind).
      this._parts.setPart(group, type, '');

      if (!this.value) return;

      this._internalNullReport = true;
      this.value = undefined;
      this.dispatchEvent(new CustomEvent('change', { detail: { value: null }, bubbles: true }));
      this._parts.resetSurfacedInputError();
    },
    onInputErrorSurfaced: (message) =>
      this.dispatchEvent(new CustomEvent('inputError', { detail: { message }, bubbles: true })),
    onSurfacedErrorCleared: (value) =>
      this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true })),
    getHourFormat: () => this.localeData.effectiveHourFormat,
    getDayPeriodLabels: () => this.localeData.dayPeriodLabels,
  });

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => this.onFocusLeave(),
  });

  /**
   * Marks a value clear that the widget itself reported (an emptied part or
   * an abandoned partial). The surviving segments must not be wiped when the
   * clear — or its null echo from the form — lands back on the value prop.
   */
  private _internalNullReport = false;

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.${this.inputBlockClass}`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  private get localeData(): TimeLocaleData {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep, true);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.localeData.descriptors[type as DateTimePartType];
  }

  /**
   * Constrains the date and time axes independently: `minDate`/`maxDate` bound
   * the day, `minTime`/`maxTime` bound the time-of-day on every allowed day.
   */
  private boundsError(iso: string, instant: Date): string | null {
    return (
      dateBoundsError(iso, this.minDate, this.maxDate, undefined, {
        minDateMessage: this.minDateMessage,
        maxDateMessage: this.maxDateMessage,
      }) ??
      timeBoundsError(toISOTimeString(instant), {
        minTime: this.minTime,
        maxTime: this.maxTime,
        minTimeMessage: this.minTimeMessage,
        maxTimeMessage: this.maxTimeMessage,
      })
    );
  }

  override willUpdate(changedProperties: PropertyValues): void {
    // !hasUpdated: parse on first render even when no value was ever set,
    const localeChanged =
      !this.hasUpdated || changedProperties.has('hourFormat') || changedProperties.has('localeId');
    if (!localeChanged && !changedProperties.has('value')) return;

    const internalNull = this._internalNullReport;
    this._internalNullReport = false;
    const prev = changedProperties.get('value') as string | null | undefined;

    if (!localeChanged && !this.value && (internalNull || !prev)) return;

    this._parts.setGroupFromISO(
      'default',
      this.value ?? '',
      'dateTime',
      this.localeData.effectiveHourFormat,
    );
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

    const partsData: GUIPartsTemplateData = {
      blockClass: this.inputBlockClass,
      groups: this.groups,
      formatParts: getDateTimeFormatParts(this.localeId, this.localeData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          day: this.dayAriaLabel,
          month: this.monthAriaLabel,
          year: this.yearAriaLabel,
          hour: this.hourAriaLabel,
          minute: this.minuteAriaLabel,
        };
        return overrides[type] ?? PART_DEFAULT_ARIA_LABELS[type];
      },
      dayPeriodAriaLabel: this.dayPeriodAriaLabel,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
    };

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: true,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget" @focusout=${this.onWidgetFocusOut}>
        <div
          id=${this.uid}
          class="gui-widget-input gui-parts gui-parts-ring gui-date-time-input ${this.icon
            ? 'gui-calendar--icon'
            : ''}"
          role="group"
          aria-labelledby=${`${this.uid}_label`}
        >
          ${renderGroupParts('default', partsData, this._parts)}
        </div>
        ${this.icon
          ? html`<span
              class=${classMap(iconClassMap)}
              data-icon=${this.icon}
              aria-hidden="true"
            ></span>`
          : nothing}
      </div>

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
        : nothing}
    `;
  }

  private validateAndEmit(group: string): void {
    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { result, writeBacks } = parseDateTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    this.emitPartsChange();

    if (result.kind === 'incomplete') {
      this.requestUpdate();
      return;
    }

    // Impossible date (e.g. Feb 31): surface the error, nothing to advance to.
    if (result.kind === 'invalid') {
      this._parts.surfaceInputError(result.message);
      this.requestUpdate();
      return;
    }

    const boundsError = this.boundsError(result.iso, result.instant as Date);

    // Out of bounds: advance the value (so a host popover reflects it) then error.
    if (boundsError) {
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value: result.iso }, bubbles: true }),
      );
      this._parts.surfaceInputError(boundsError);
      this.requestUpdate();
      return;
    }

    this.value = result.iso;
    this._parts.resetSurfacedInputError();
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, bubbles: true }));
    this.requestUpdate();
  }

  /**
   * Live-syncs the date and time halves to a host picker: each half carries
   * its ISO value once structurally complete, else null.
   */
  private emitPartsChange(): void {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { date, time } = parseDateTimeSubGroups(this._parts.values['default'] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: {
          date: date.kind === 'valid' ? date.iso : null,
          time: time.kind === 'valid' ? time.iso : null,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Paints only the date parts from an ISO date (null clears them), leaving
   * the time parts untouched. Host pickers call this when their calendar's
   * working date changes, so a picked day lands in the visible segments
   * without committing anything.
   */
  fillDate(iso: string | null): void {
    this._parts.setGroupFromISO('default', iso, 'date');
    this.requestUpdate();
  }

  /**
   * Paints only the time parts from an ISO time (null clears them), leaving
   * the date parts untouched. The counterpart of {@link fillDate} for the
   * picker's working time.
   */
  fillTime(iso: string | null): void {
    this._parts.setGroupFromISO('default', iso, 'time', this.localeData.effectiveHourFormat);
    this.requestUpdate();
  }

  /** The group's fill state, for host pickers' own focus-leave checks. */
  groupCompleteness(): GroupCompleteness {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { result } = parseDateTimeGroup(this._parts.values['default'] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    if (result.kind !== 'incomplete') return 'complete';
    return this._parts.isGroupEmpty('default', DATE_TIME_PART_TYPES) ? 'empty' : 'partial';
  }

  private onWidgetFocusOut = (event: FocusEvent): void => {
    if (this.deferFocusLeave) return;
    this._focusLeave.handleFocusOut(event);
  };

  /**
   * The single point where the input reports focus leaving the control: it
   * blurs (which the form layer reads as "validate now"), so hopping between
   * segments never validates a half-typed entry.
   */
  private onFocusLeave(): void {
    this.dispatchEvent(new CustomEvent('blur'));
    this.settleOnFocusLeave();
  }

  settleOnFocusLeave(): void {
    const completeness = this.groupCompleteness();
    if (completeness === 'complete') return;

    if (completeness === 'empty') {
      this._parts.clearSurfacedInputError(null);
      return;
    }

    if (this.value) {
      this._internalNullReport = true;
      this.value = undefined;
    }
    this.dispatchEvent(new CustomEvent('change', { detail: { value: null }, bubbles: true }));
    this._parts.surfaceInputError(this.incompleteMessage ?? INCOMPLETE_DATE_TIME_MESSAGE);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time': GuiDateTime;
  }
}

safeDefine('gui-date-time', GuiDateTime);
