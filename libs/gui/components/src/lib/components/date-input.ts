import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { dateBoundsError, getDateFormatParts } from '../utils/date';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  dateInputPartDescriptors,
  parseDateGroup,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
  type GroupParseResult,
} from '../utils/parts';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { boundsValidity, GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatch,
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message } from '../utils/messages';

const DATE_PART_TYPES: readonly DateTimePartType[] = ['day', 'month', 'year'];

/** What <gui-date-input> renders besides the control state: its presentation props. */
export type GuiDateProps = {
  icon?: string;
  hint?: string;
};

/**
 * A date field typed part by part (day, month, year) in the locale's order.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus - One of the parts of the field received focus.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
 */
export class GuiDate extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ type: Boolean, attribute: 'show-hint' }) showHint: boolean | undefined = true;

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

  /** The date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String }) value: string | undefined = undefined;
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
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;
  /** Earliest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  /** Latest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  /** Error for a date before `minDate`. */
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  /** Error for a date after `maxDate`. */
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;

  private readonly inputBlockClass = 'gui-date-input';
  private readonly groups = ['default'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

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
      dispatchValue(this, null);
      this._parts.resetSurfacedInputError();
    },
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value),
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
    requiresLabel: true,
    getTargets: () => this.querySelectorAll(`.${this.inputBlockClass}`),
    getState: () => ({
      uid: this.uid,
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

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      const internalNull = this._internalNullReport;
      this._internalNullReport = false;
      const prev = changedProperties.get('value') as string | null | undefined;

      if (!this.value && (internalNull || !prev)) return;

      this._parts.setGroupFromISO('default', this.value ?? '', 'date');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & GuiDateProps = {
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
      [this.icon as string]: true,
    };

    return html`
      ${addLabel(
        this.uid,
        this.showHint ? templateData : { ...templateData, hint: undefined },
        false,
        undefined,
        false,
      )}

      <div class="gui-widget" @focusout=${this.onWidgetFocusOut}>
        <div
          id=${this.uid}
          class="gui-widget-input gui-parts gui-parts-ring gui-date-input ${this.icon
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

      ${this.showErrors && this.errors?.length ? addErrors(this.uid, templateData) : nothing}
    `;
  }

  private validateAndEmit(group: string): void {
    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    const { result, writeBacks } = parseDateGroup(this._parts.values[group] ?? {}, {
      descriptors: this.partDescriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    dispatch(this, 'gui-parts-change', { date: result.kind === 'valid' ? result.iso : null });

    if (result.kind === 'invalid') {
      // Date is complete but invalid
      this._parts.surfaceInputError(result.message);
    } else if (result.kind === 'valid') {
      const boundsError = dateBoundsError(result.iso, this.minDate, this.maxDate, undefined, {
        minDateMessage: this.minDateMessage,
        maxDateMessage: this.maxDateMessage,
      });

      if (boundsError) {
        this.value = result.iso;
        dispatchValue(this, this.value);
        this._parts.surfaceInputError(boundsError);
        this.requestUpdate();
        return;
      }

      this.value = result.iso;
      this._parts.resetSurfacedInputError();

      dispatchValue(this, this.value);
    }

    this.requestUpdate();
  }

  /** An out-of-bounds date, then a typed date the element rejected, then `required`. */
  protected override validate(): GuiValidity | null {
    const boundsError = this.value
      ? dateBoundsError(this.value, this.minDate, this.maxDate, undefined, {
          minDateMessage: this.minDateMessage,
          maxDateMessage: this.maxDateMessage,
        })
      : null;
    const badInput = this.partsBadInput();
    return (
      boundsValidity(boundsError, this.value, this.minDate, this.maxDate) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  /**
   * The group's fill state, for host pickers' own focus-leave checks.
   *
   * @internal
   */
  groupCompleteness(): GroupCompleteness {
    if (this.parseParts().kind !== 'incomplete') return 'complete';
    return this._parts.isGroupEmpty('default', DATE_PART_TYPES) ? 'empty' : 'partial';
  }

  /** The parts as they are now, parsed. */
  private parseParts(): GroupParseResult {
    return parseDateGroup(this._parts.values['default'] ?? {}, {
      descriptors: this.partDescriptors,
      invalidDateMessage: this.invalidDateMessage,
    }).result;
  }

  /**
   * The bad input the parts hold now: a partly typed date, or a complete one that is no date.
   * Read when the validity is written, so it never lags behind the error last shown.
   */
  private partsBadInput(): string | null {
    const result = this.parseParts();
    if (result.kind === 'invalid') return result.message;
    return this.groupCompleteness() === 'partial'
      ? message('incompleteDate', this.incompleteMessage)
      : null;
  }

  /** Also refills the parts, which the reset emptied, and drops the error they showed. */
  override formResetCallback(): void {
    super.formResetCallback();
    this._parts.setGroupFromISO('default', this.value ?? '', 'date');
    this._parts.resetSurfacedInputError();
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
    dispatchBlur(this);
    this.settleOnFocusLeave();
  }

  /** @internal */
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
    dispatchValue(this, null);
    this._parts.surfaceInputError(message('incompleteDate', this.incompleteMessage));
  }
}

/** The events `gui-date` fires, with their types. */
export const GuiDateEvents = {
  ...valueEvents<GuiDate['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<CustomEvent<{ date: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-date': GuiDate;
  }
}

safeDefine('gui-date', GuiDate);
