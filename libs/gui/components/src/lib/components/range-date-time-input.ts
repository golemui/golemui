import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseDateTimeGroup,
  parseDateTimeSubGroups,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
} from '../utils/parts';
import {
  completeRange,
  resolveRangeEndpoints,
  type RangeEndpoint,
  type RangeEndpointsResult,
} from '../utils/range-commit';
import {
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  getDateTimeFormatParts,
  orderDateTimeRange,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { DateTimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dateTimeRangesValidity } from '../utils/range-validity';
import {
  dispatch,
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, optionalName } from '../utils/messages';

const DATE_TIME_PART_TYPES: readonly DateTimePartType[] = [
  'day',
  'month',
  'year',
  'hour',
  'minute',
];

type Group = 'start' | 'end';

/** What <gui-range-date-time> renders besides the control state: its presentation props. */
export type GuiRangeDateTimeInputProps = {
  icon?: string;
  hint?: string;
};

/**
 * A field to type one date-time range: the start and the end, each part by part (day, month,
 * year, hour, minute, AM/PM) in the locale's order.
 *
 * ```html
 * <gui-range-date-time label="Rental" locale-id="en-US"></gui-range-date-time>
 * ```
 *
 * The value is set when both date-times are complete, with the earlier one as the start, and
 * cleared when both are empty. A range with one date-time typed and the other not is reported as
 * incomplete when focus leaves the field.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus - One of the parts of the field received focus.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a range over a disabled span. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them. Each end has its `date` and `time`, each null until it is complete.
 */
export class GuiRangeDateTimeInput extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ attribute: 'show-errors', converter: booleanAttribute }) showErrors:
    | boolean
    | undefined = true;
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ attribute: 'show-hint', converter: booleanAttribute }) showHint: boolean | undefined =
    true;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the day part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-aria-label' }) dayAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the month part. An empty value keeps the default. */
  @property({ type: String, attribute: 'month-aria-label' }) monthAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the year part. An empty value keeps the default. */
  @property({ type: String, attribute: 'year-aria-label' }) yearAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the hour part. An empty value keeps the default. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. An empty value keeps the default. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start date-time field. An empty value removes it. */
  @property({ type: String, attribute: 'start-date-time-aria-label' }) startDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date-time field. An empty value removes it. */
  @property({ type: String, attribute: 'end-date-time-aria-label' }) endDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of the range. */
  @property({ type: String }) separator: string | undefined = undefined;

  /**
   * The date-time range, as `{ start, end }` local ISO date-times. Both ends are set, or the value
   * is empty.
   */
  @property({ type: Object }) value: DateTimeRange | undefined = undefined;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in a list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  /** Earliest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  /** Latest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  /** Error for a date-time before `minDateTime`. */
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
  /** Error for a date-time after `maxDateTime`. */
  @property({ type: String, attribute: 'max-date-time-message' }) maxDateTimeMessage:
    | string
    | undefined = undefined;
  /** Date-times that cannot be picked, as `{ start, end }` ISO date-time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  /** Error for a range over `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  /** Error when focus leaves a partly filled value. */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this input into the picker's popover must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   *
   * @internal
   */
  @property({ attribute: 'defer-focus-leave', converter: booleanAttribute }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-range-date-time-input';
  private readonly groups = ['start', 'end'] as const;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => this.syncParts(),
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: (group, type) => {
      // A raw 0 counts as emptying the part, so clear it in state (the clamp
      // write-back would otherwise leave a phantom value behind). An empty part clears nothing on
      // its own: a range is cleared when both date-times are emptied, and a half range when focus
      // leaves the field.
      this._parts.setPart(group, type, '');
    },
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value),
    getHourFormat: () => this.localeData.effectiveHourFormat,
    getDayPeriodLabels: () => this.localeData.dayPeriodLabels,
  });

  /**
   * The single point where the input reports focus leaving the control. It settles what is in the
   * fields first, then blurs: the form layer reads a blur as "validate now", and blurring first
   * would validate the range that a half-typed entry is about to clear.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      this.settleOnFocusLeave();
      dispatchBlur(this);
    },
  });

  /**
   * Marks a value clear that the widget itself reported (an abandoned partial). The surviving
   * segments must not be wiped when the clear — or its null echo from the form — lands back on the
   * value prop.
   */
  private _internalNullReport = false;

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    requiresLabel: true,
    getTargets: () => this.querySelectorAll(`.${this.inputBlockClass}`),
    getState: () => ({
      domId: this.domId,
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

  /** The value, when both ends are set. */
  private get range(): DateTimeRange | undefined {
    return completeRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as DateTimeRange | undefined;
  }

  private get localeData() {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep, true);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.localeData.descriptors[type as DateTimePartType];
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override willUpdate(changedProperties: PropertyValues): void {
    const localeChanged =
      !this.hasUpdated || changedProperties.has('hourFormat') || changedProperties.has('localeId');
    if (!localeChanged && !changedProperties.has('value')) return;

    const internalNull = this._internalNullReport;
    this._internalNullReport = false;
    const range = this.range;
    const previous = completeRange(changedProperties.get('value'));

    if (!localeChanged && !range && (internalNull || !previous)) return;

    this.fillParts(range);
  }

  override render() {
    const templateData: ControlTemplateData<DateTimeRange> & GuiRangeDateTimeInputProps = {
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
        return message(type, overrides[type]);
      },
      dayPeriodAriaLabel: this.dayPeriodAriaLabel,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
    };

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${addLabel(
        this,
        this.showHint !== false ? templateData : { ...templateData, hint: undefined },
        false,
        undefined,
        false,
      )}

      <div class="gui-widget" @focusout=${this.onWidgetFocusOut}>
        <div
          id=${this.domId}
          class="gui-widget-input gui-parts-ring gui-range-date-time-input ${this.icon
            ? 'gui-range-date-time-input--icon'
            : ''}"
          role="group"
          aria-labelledby=${`${this.domId}_label`}
        >
          ${this.icon
            ? html`<span
                class=${classMap(iconClassMap)}
                data-icon=${this.icon}
                aria-hidden="true"
              ></span>`
            : nothing}

          <div class="gui-range-date-time-input__inputs">
            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${optionalName('startDateTime', this.startDateTimeAriaLabel) ?? nothing}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-time-input__separator" aria-hidden="true"
              >${this.separator ?? '-'}</span
            >

            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${optionalName('endDateTime', this.endDateTimeAriaLabel) ?? nothing}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>
      </div>

      ${this.showErrors !== false && this.errors?.length ? addErrors(this, templateData) : nothing}
    `;
  }

  /**
   * One group parsed. `clamp` writes corrected parts back, as typing does. Each end is an instant,
   * bounded by `minDateTime` and `maxDateTime`.
   */
  private parseGroup(group: Group, clamp: boolean): RangeEndpoint<string> {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { result, writeBacks } = parseDateTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    if (clamp) this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'incomplete') return { kind: 'incomplete' };
    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };

    const boundsError = dateTimeBoundsError(result.iso, this.minDateTime, this.maxDateTime, {
      minDateTimeMessage: this.minDateTimeMessage,
      maxDateTimeMessage: this.maxDateTimeMessage,
    });
    return boundsError
      ? { kind: 'invalid', message: boundsError }
      : { kind: 'valid', value: result.iso };
  }

  /** Both ends resolved into a range: a reversed pair swaps, and a disabled span rejects it. */
  private resolve(
    start: RangeEndpoint<string>,
    end: RangeEndpoint<string>,
  ): RangeEndpointsResult<string> {
    return resolveRangeEndpoints(start, end, {
      order: (a, b) => orderDateTimeRange(a, b),
      validate: (ordered) =>
        dateTimeRangeOverlaps({ start: ordered.start, end: ordered.end }, this.disabledRanges)
          ? message('disabledDateRange', this.disabledRangeMessage)
          : null,
    });
  }

  private get partsEmpty(): boolean {
    return this.groups.every((group) => this._parts.isGroupEmpty(group, DATE_TIME_PART_TYPES));
  }

  /** One end's date and time halves, each null until it parses complete. */
  private subGroupISO(group: Group): { date: string | null; time: string | null } {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { date, time } = parseDateTimeSubGroups(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    return {
      date: date.kind === 'valid' ? date.iso : null,
      time: time.kind === 'valid' ? time.iso : null,
    };
  }

  /**
   * Runs on every part change: tells a host picker what each end's date and time hold, then sets
   * the value from a complete range, clears it when both date-times are emptied, and surfaces a
   * rejected range.
   */
  private syncParts(): void {
    const start = this.parseGroup('start', true);
    const end = this.parseGroup('end', true);
    dispatch(this, 'gui-parts-change', {
      start: this.subGroupISO('start'),
      end: this.subGroupISO('end'),
    });

    const resolved = this.resolve(start, end);

    if (resolved.kind === 'invalid') {
      this._parts.surfaceInputError(resolved.message);
    } else if (resolved.kind === 'complete') {
      // A reversed pair is stored in order; willUpdate shows it as stored.
      this.value = { start: resolved.value.start, end: resolved.value.end };
      this._parts.resetSurfacedInputError();
      dispatchValue(this, this.value);
    } else if (this.partsEmpty) {
      if (this.range) {
        this._internalNullReport = true;
        this.value = undefined;
        this._parts.resetSurfacedInputError();
        dispatchValue(this, null);
      } else {
        this._parts.clearSurfacedInputError(null);
      }
    } else {
      // Half typed: an error about a date-time since corrected goes; the rest waits for focus to
      // leave.
      this._parts.clearSurfacedInputError(this.range ?? null);
    }

    this.requestUpdate();
  }

  private fillParts(range: DateTimeRange | undefined): void {
    const format = this.localeData.effectiveHourFormat;
    this._parts.setGroupFromISO('start', range?.start ?? null, 'dateTime', format);
    this._parts.setGroupFromISO('end', range?.end ?? null, 'dateTime', format);
  }

  /**
   * A range outside `minDateTime`/`maxDateTime` or over a disabled span, then a typed range the
   * element cannot set (see partsBadInput), then `required`.
   */
  protected override validate(): GuiValidity | null {
    const range = this.range;
    const badInput = this.partsBadInput();
    return (
      dateTimeRangesValidity(range ? [range] : [], this) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  /**
   * The fill state of both date-times together, for host pickers' own focus-leave checks.
   *
   * @internal
   */
  groupCompleteness(): GroupCompleteness {
    if (this.partsEmpty) return 'empty';
    const resolved = this.resolve(this.parseGroup('start', false), this.parseGroup('end', false));
    return resolved.kind === 'incomplete' ? 'partial' : 'complete';
  }

  /**
   * The bad input the parts hold now: the error the field shows, or a date-time that is partly
   * typed, impossible or out of bounds, or a range the element rejects. Read when the validity is
   * written, and by the picker that embeds the element. It parses without clamping, so reading it
   * changes nothing.
   *
   * @internal
   */
  partsBadInput(): string | null {
    if (this.partsEmpty) return null;
    if (this._parts.surfacedInputError) return this._parts.surfacedInputError;
    const resolved = this.resolve(this.parseGroup('start', false), this.parseGroup('end', false));
    if (resolved.kind === 'invalid') return resolved.message;
    if (resolved.kind === 'complete') return null;
    return message('incompleteDateTime', this.incompleteMessage);
  }

  /** Also refills the parts, which the reset emptied, and drops the error they showed. */
  override formResetCallback(): void {
    super.formResetCallback();
    this.fillParts(this.range);
    this._parts.resetSurfacedInputError();
  }

  private onWidgetFocusOut = (event: FocusEvent): void => {
    if (this.deferFocusLeave) return;
    this._focusLeave.handleFocusOut(event);
  };

  /**
   * What leaving does with the parts. A half-typed range clears the value and is reported as
   * incomplete; a rejected range has already reported itself. Public so a host picker can call it
   * from its own focus-leave check.
   *
   * @internal
   */
  settleOnFocusLeave(): void {
    const completeness = this.groupCompleteness();
    if (completeness === 'complete') return;

    if (completeness === 'empty') {
      this._parts.clearSurfacedInputError(null);
      return;
    }

    if (this.range) {
      this._internalNullReport = true;
      this.value = undefined;
    }
    dispatchValue(this, null);
    this._parts.surfaceInputError(message('incompleteDateTime', this.incompleteMessage));
  }

  /**
   * Fills one end's date parts from an ISO date, or clears them with null, without setting the
   * value. The range date-time picker calls it so a day picked in the calendar shows in the field.
   *
   * @internal
   */
  fillDate(group: Group, iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    this.requestUpdate();
  }

  /**
   * The counterpart of {@link fillDate} for an end's time parts.
   *
   * @internal
   */
  fillTime(group: Group, iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.localeData.effectiveHourFormat);
    this.requestUpdate();
  }
}

/** The events `gui-range-date-time` fires, with their types. */
export const GuiRangeDateTimeInputEvents = {
  ...valueEvents<GuiRangeDateTimeInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<
    CustomEvent<{
      start: { date: string | null; time: string | null };
      end: { date: string | null; time: string | null };
    }>
  >(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time': GuiRangeDateTimeInput;
  }
}

safeDefine('gui-range-date-time', GuiRangeDateTimeInput);
