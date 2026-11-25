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
  parseTimeGroup,
  timeBoundsError,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
  type TimeLocaleData,
} from '../utils/parts';
import {
  completeRange,
  resolveRangeEndpoints,
  type RangeEndpoint,
  type RangeEndpointsResult,
} from '../utils/range-commit';
import {
  compareISOTimes,
  getTimeFormatParts,
  isTimeRangeDisabled,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { TimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { timeRangesValidity } from '../utils/range-validity';
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

const TIME_PART_TYPES: readonly DateTimePartType[] = ['hour', 'minute'];

type Group = 'start' | 'end';

/** What <gui-range-time> renders besides the control state: its presentation props. */
export type GuiRangeTimeInputProps = {
  icon?: string;
  hint?: string;
};

/**
 * A field to type one time range: the start and the end, each part by part (hour, minute, AM/PM).
 *
 * ```html
 * <gui-range-time label="Opening hours" locale-id="en-US"></gui-range-time>
 * ```
 *
 * The value is set when both times are complete and the end is after the start, and cleared when
 * both are empty. An end that is not after the start is rejected with `rangeOrderMessage`: a range
 * never runs past midnight. A range with one time typed and the other not is reported as
 * incomplete when focus leaves the field.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus - One of the parts of the field received focus.
 * @fires gui-input-error - The element rejected what the user entered, such as a time out of bounds
 *   or an end before the start. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
 */
export class GuiRangeTimeInput extends GuiFormControl {
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
  /** Accessible name of the start time field. An empty value removes it. */
  @property({ type: String, attribute: 'start-time-aria-label' }) startTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end time field. An empty value removes it. */
  @property({ type: String, attribute: 'end-time-aria-label' }) endTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of the range. */
  @property({ type: String }) separator: string | undefined = undefined;

  /** The time range, as `{ start, end }` ISO times. Both ends are set, or the value is empty. */
  @property({ type: Object }) value: TimeRange | undefined = undefined;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in a list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  /** Earliest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  /** Latest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  /** Times that cannot be picked, as `{ start, end }` ISO time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  /** Error for a time before `minTime`. */
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  /** Error for a time after `maxTime`. */
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  /** Error when the end time is not after the start time. */
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
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
   * Whether the times can be typed. A range time picker sets it to `false` and leaves the times to
   * its lists.
   *
   * @internal
   */
  @property({ attribute: 'allow-custom-time', converter: booleanAttribute }) allowCustomTime:
    | boolean
    | undefined = undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this input into the picker's popup must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   *
   * @internal
   */
  @property({ attribute: 'defer-focus-leave', converter: booleanAttribute }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-range-time-input';
  private readonly groups = ['start', 'end'] as const;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => this.syncParts(),
    isReadonly: () => this.partsReadonly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: (group, type) => {
      // A raw 0 counts as emptying the part, so clear it in state (the clamp
      // write-back would otherwise leave a phantom value behind). An empty part clears nothing on
      // its own: a range is cleared when both times are emptied, and a half range when focus
      // leaves the field.
      this._parts.setPart(group, type, '');
    },
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value),
    getHourFormat: () => this.timeLocaleData.effectiveHourFormat,
    getDayPeriodLabels: () => this.timeLocaleData.dayPeriodLabels,
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
        // The parts' own state: read-only too when only the lists pick the times.
        readonly: this.partsReadonly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  /** The value, when both ends are set. */
  private get range(): TimeRange | undefined {
    return completeRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as TimeRange | undefined;
  }

  /** Whether the time parts take no typing: read-only, or the times come from a picker's lists. */
  private get partsReadonly(): boolean {
    return !!this.readOnly || this.allowCustomTime === false;
  }

  private get timeLocaleData(): TimeLocaleData {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.timeLocaleData.descriptors[type as DateTimePartType];
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
    const templateData: ControlTemplateData<TimeRange> & GuiRangeTimeInputProps = {
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
      formatParts: getTimeFormatParts(this.localeId, this.timeLocaleData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          hour: this.hourAriaLabel,
          minute: this.minuteAriaLabel,
        };
        return message(type, overrides[type]);
      },
      dayPeriodAriaLabel: this.dayPeriodAriaLabel,
      disabled: this.disabled,
      partsReadonly: this.partsReadonly,
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
          class="gui-widget-input gui-parts-ring gui-range-time-input ${this.icon
            ? 'gui-range-time-input--icon'
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

          <div class="gui-range-time-input__inputs">
            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${optionalName('startTime', this.startTimeAriaLabel) ?? nothing}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-time-input__separator" aria-hidden="true"
              >${this.separator ?? '-'}</span
            >

            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${optionalName('endTime', this.endTimeAriaLabel) ?? nothing}
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
   * One group parsed. `clamp` writes corrected parts back, as typing does. A time outside
   * `minTime`/`maxTime` is invalid with its message.
   */
  private parseGroup(group: Group, clamp: boolean): RangeEndpoint<string> {
    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const { result, writeBacks } = parseTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
    });
    if (clamp) this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };
    if (result.kind !== 'valid') return { kind: 'incomplete' };

    const boundsError = timeBoundsError(result.iso, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });
    return boundsError
      ? { kind: 'invalid', message: boundsError }
      : { kind: 'valid', value: result.iso };
  }

  /** Both groups parsed and resolved into a range, rejecting an end not after the start. */
  private resolve(
    start: RangeEndpoint<string>,
    end: RangeEndpoint<string>,
  ): RangeEndpointsResult<string> {
    return resolveRangeEndpoints(start, end, {
      validate: (ordered) =>
        compareISOTimes(ordered.end, ordered.start) <= 0
          ? message('timeRangeOrder', this.rangeOrderMessage)
          : isTimeRangeDisabled(ordered.start, ordered.end, this.disabledRanges)
            ? message('disabledTimeRange', this.disabledRangeMessage)
            : null,
    });
  }

  private get partsEmpty(): boolean {
    return this.groups.every((group) => this._parts.isGroupEmpty(group, TIME_PART_TYPES));
  }

  /**
   * Runs on every part change: tells a host picker what the parts hold, then sets the value from a
   * complete range, clears it when both times are emptied, and surfaces a rejected range. Returns
   * whether the parts now hold the value.
   */
  private syncParts(): boolean {
    const start = this.parseGroup('start', true);
    const end = this.parseGroup('end', true);
    const iso = (endpoint: RangeEndpoint<string>) =>
      endpoint.kind === 'valid' ? endpoint.value : null;
    dispatch(this, 'gui-parts-change', { start: iso(start), end: iso(end) });

    const resolved = this.resolve(start, end);
    let set = false;

    if (resolved.kind === 'invalid') {
      this._parts.surfaceInputError(resolved.message);
    } else if (resolved.kind === 'complete') {
      this.value = { start: resolved.value.start, end: resolved.value.end };
      this._parts.resetSurfacedInputError();
      dispatchValue(this, this.value);
      set = true;
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
      // Half typed: an error about a time since corrected goes; the rest waits for focus to leave.
      this._parts.clearSurfacedInputError(this.range ?? null);
    }

    this.requestUpdate();
    return set;
  }

  private fillParts(range: TimeRange | undefined): void {
    const format = this.timeLocaleData.effectiveHourFormat;
    this._parts.setGroupFromISO('start', range?.start ?? null, 'time', format);
    this._parts.setGroupFromISO('end', range?.end ?? null, 'time', format);
  }

  /**
   * A range outside `minTime`/`maxTime` or over a disabled range, then a typed range the element
   * cannot set (see partsBadInput), then `required`.
   */
  protected override validate(): GuiValidity | null {
    const range = this.range;
    const badInput = this.partsBadInput();
    return (
      timeRangesValidity(range ? [range] : [], this) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  /**
   * The fill state of both times together, for host pickers' own focus-leave checks.
   *
   * @internal
   */
  groupCompleteness(): GroupCompleteness {
    if (this.partsEmpty) return 'empty';
    const resolved = this.resolve(this.parseGroup('start', false), this.parseGroup('end', false));
    return resolved.kind === 'incomplete' ? 'partial' : 'complete';
  }

  /**
   * The bad input the parts hold now: the error the field shows, or a time that is partly typed or
   * out of bounds, or a range the element rejects. Read when the validity is written, and by the
   * picker that embeds the element. It parses without clamping, so reading it changes nothing.
   *
   * @internal
   */
  partsBadInput(): string | null {
    if (this.partsEmpty) return null;
    if (this._parts.surfacedInputError) return this._parts.surfacedInputError;
    const resolved = this.resolve(this.parseGroup('start', false), this.parseGroup('end', false));
    if (resolved.kind === 'invalid') return resolved.message;
    if (resolved.kind === 'complete') return null;
    return message('incompleteTime', this.incompleteMessage);
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
    this._parts.surfaceInputError(message('incompleteTime', this.incompleteMessage));
  }

  /**
   * Fills one time's parts from an ISO time, or clears them with null, without setting the value.
   * The range time picker calls it so a time picked in a list shows in the field.
   *
   * @internal
   */
  fillGroup(group: Group, iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.timeLocaleData.effectiveHourFormat);
    this.requestUpdate();
  }

  /**
   * Sets the value from what the parts hold, as a typed change does: the range time picker's
   * commit once both times are picked. Returns whether the value was set; a rejected range shows
   * its error.
   *
   * @internal
   */
  commitFromParts(): boolean {
    return this.syncParts();
  }
}

/** The events `gui-range-time` fires, with their types. */
export const GuiRangeTimeInputEvents = {
  ...valueEvents<GuiRangeTimeInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<CustomEvent<{ start: string | null; end: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-time': GuiRangeTimeInput;
  }
}

safeDefine('gui-range-time', GuiRangeTimeInput);
