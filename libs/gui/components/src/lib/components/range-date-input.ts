import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { completeDateRange, getDateFormatParts, toISODateString } from '../utils/date';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  dateInputPartDescriptors,
  parseDateGroup,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
} from '../utils/parts';
import {
  orderEndpoints,
  resolveRangeEndpoints,
  type RangeEndpoint,
  type RangeEndpointsResult,
} from '../utils/range-commit';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { CompleteDateRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatch,
  dispatchInputError,
  dispatchBlur,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, optionalName } from '../utils/messages';

const DATE_PART_TYPES: readonly DateTimePartType[] = ['day', 'month', 'year'];

type Group = 'start' | 'end';

/** What <gui-range-date> renders besides the control state: its presentation props. */
export type GuiRangeDateInputProps = {
  icon?: string;
  hint?: string;
};

/**
 * A field to type one date range: the start and the end, each part by part (day, month, year) in
 * the locale's order.
 *
 * ```html
 * <gui-range-date label="Stay" locale-id="en-US"></gui-range-date>
 * ```
 *
 * The value is set when both dates are complete, with the earlier one as the start, and cleared
 * when both are empty. A range with one date typed and the other not is reported as incomplete
 * when focus leaves the field.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus - One of the parts of the field received focus.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a range left half typed. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
 */
export class GuiRangeDateInput extends GuiFormControl {
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
  /** Accessible name of the start date field. An empty value removes it. */
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date field. An empty value removes it. */
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of the range. */
  @property({ type: String }) separator: string | undefined = undefined;

  /** The date range, as `{ start, end }` ISO dates. Both ends are set, or the value is empty. */
  @property({ type: Object }) value: CompleteDateRange | undefined = undefined;
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
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

  private readonly inputBlockClass = 'gui-range-date-input';
  private readonly groups = ['start', 'end'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => this.syncParts(),
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: (group, type) => {
      // A raw 0 counts as emptying the part, so clear it in state (the clamp
      // write-back would otherwise leave a phantom value behind). Unlike gui-date, an empty part
      // clears nothing on its own: a range is cleared when both dates are emptied, and a half
      // range when focus leaves the field.
      this._parts.setPart(group, type, '');
    },
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value),
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
   * Marks a value clear that the widget itself reported (an emptied part or
   * an abandoned partial). The surviving segments must not be wiped when the
   * clear — or its null echo from the form — lands back on the value prop.
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
  private get range(): CompleteDateRange | undefined {
    return completeDateRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as CompleteDateRange | undefined;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      const internalNull = this._internalNullReport;
      this._internalNullReport = false;
      const range = this.range;
      const previous = completeDateRange(changedProperties.get('value'));

      if (!range && (internalNull || !previous)) return;

      this.fillParts(range);
    }
  }

  override render() {
    const templateData: ControlTemplateData<CompleteDateRange> & GuiRangeDateInputProps = {
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
      formatParts: getDateFormatParts(this.localeId),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          day: this.dayAriaLabel,
          month: this.monthAriaLabel,
          year: this.yearAriaLabel,
        };
        return message(type, overrides[type]);
      },
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
          class="gui-widget-input gui-parts-ring gui-range-date-input ${this.icon
            ? 'gui-range-date-input--icon'
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

          <div class="gui-range-date-input__inputs">
            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${optionalName('startDate', this.startDateAriaLabel) ?? nothing}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-input__separator" aria-hidden="true"
              >${this.separator ?? '-'}</span
            >

            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${optionalName('endDate', this.endDateAriaLabel) ?? nothing}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>
      </div>

      ${this.showErrors !== false && this.errors?.length ? addErrors(this, templateData) : nothing}
    `;
  }

  /** One group parsed. `clamp` writes corrected parts back, as typing does. */
  private parseGroup(group: Group, clamp: boolean): RangeEndpoint<Date> {
    const { result, writeBacks } = parseDateGroup(this._parts.values[group] ?? {}, {
      descriptors: this.partDescriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    if (clamp) this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };
    if (result.kind === 'valid' && result.instant) return { kind: 'valid', value: result.instant };
    return { kind: 'incomplete' };
  }

  /** Both groups parsed and resolved into a range, the earlier date first. */
  private resolve(clamp: boolean): RangeEndpointsResult<Date> {
    return resolveRangeEndpoints(this.parseGroup('start', clamp), this.parseGroup('end', clamp), {
      order: (start, end) => orderEndpoints(start, end, (a, b) => a.getTime() - b.getTime()),
    });
  }

  private get partsEmpty(): boolean {
    return this.groups.every((group) => this._parts.isGroupEmpty(group, DATE_PART_TYPES));
  }

  /**
   * Runs on every part change: tells a host picker what the parts hold, then sets the value from a
   * complete range, clears it when both dates are emptied, and surfaces an impossible date.
   */
  private syncParts(): void {
    const start = this.parseGroup('start', true);
    const end = this.parseGroup('end', true);
    const iso = (endpoint: RangeEndpoint<Date>) =>
      endpoint.kind === 'valid' ? toISODateString(endpoint.value) : null;
    dispatch(this, 'gui-parts-change', { start: iso(start), end: iso(end) });

    const resolved = resolveRangeEndpoints(start, end, {
      order: (a, b) => orderEndpoints(a, b, (x, y) => x.getTime() - y.getTime()),
    });

    if (resolved.kind === 'invalid') {
      this._parts.surfaceInputError(resolved.message);
    } else if (resolved.kind === 'complete') {
      const range = {
        start: toISODateString(resolved.value.start),
        end: toISODateString(resolved.value.end),
      };
      // A reversed pair is stored in order; willUpdate shows it as stored.
      this.value = range;
      this._parts.resetSurfacedInputError();
      dispatchValue(this, this.value);
    } else if (this.partsEmpty) {
      if (this.range) {
        this.reportCleared();
        this._parts.resetSurfacedInputError();
      } else {
        this._parts.clearSurfacedInputError(null);
      }
    } else {
      // Half typed: an error about a date since corrected goes; the rest waits for focus to leave.
      this._parts.clearSurfacedInputError(this.range ?? null);
    }

    this.requestUpdate();
  }

  /** Clears the value from inside, keeping whatever the parts hold. */
  private reportCleared(): void {
    this._internalNullReport = true;
    this.value = undefined;
    dispatchValue(this, null);
  }

  private fillParts(range: CompleteDateRange | undefined): void {
    this._parts.setGroupFromISO('start', range?.start ?? null, 'date');
    this._parts.setGroupFromISO('end', range?.end ?? null, 'date');
  }

  /** A typed range the element cannot set (see partsBadInput), then `required`. */
  protected override validate(): GuiValidity | null {
    const badInput = this.partsBadInput();
    return (badInput ? { flags: { badInput: true }, message: badInput } : null) ?? super.validate();
  }

  /**
   * The fill state of both dates together, for host pickers' own focus-leave checks.
   *
   * @internal
   */
  groupCompleteness(): GroupCompleteness {
    if (this.partsEmpty) return 'empty';
    return this.resolve(false).kind === 'incomplete' ? 'partial' : 'complete';
  }

  /**
   * The bad input the parts hold now: the error the field shows, or a date that is partly typed or
   * impossible. Read when the validity is written, and by the picker that embeds the element. It
   * parses without clamping, so reading it changes nothing.
   *
   * @internal
   */
  partsBadInput(): string | null {
    if (this.partsEmpty) return null;
    if (this._parts.surfacedInputError) return this._parts.surfacedInputError;
    const resolved = this.resolve(false);
    if (resolved.kind === 'invalid') return resolved.message;
    if (resolved.kind === 'complete') return null;
    return message('incompleteDate', this.incompleteMessage);
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
   * incomplete; an impossible date has already reported itself. Public so a host picker can call
   * it from its own focus-leave check.
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
    this._parts.surfaceInputError(message('incompleteDate', this.incompleteMessage));
  }

  /**
   * Fills one date's parts from an ISO date, or clears them with null, without setting the value.
   * The range date picker calls it so a day picked in the calendar shows in the field.
   *
   * @internal
   */
  fillGroup(group: Group, iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    this.requestUpdate();
  }

  /**
   * Shows a range the host rejected, with its error, without setting the value.
   *
   * @internal
   */
  showRejectedRange(range: CompleteDateRange, error: string): void {
    this.fillParts(range);
    this._parts.surfaceInputError(error);
  }

  /**
   * Shows the error of a range the host rejected after the field set it: the parts stay as typed.
   *
   * @internal
   */
  surfaceHostError(error: string): void {
    this._parts.surfaceInputError(error);
  }

  /**
   * Forgets an error the host surfaced, once the host has replaced what it was about.
   *
   * @internal
   */
  clearHostError(): void {
    this._parts.resetSurfacedInputError();
  }
}

/** The events `gui-range-date` fires, with their types. */
export const GuiRangeDateInputEvents = {
  ...valueEvents<GuiRangeDateInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<CustomEvent<{ start: string | null; end: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date': GuiRangeDateInput;
  }
}

safeDefine('gui-range-date', GuiRangeDateInput);
