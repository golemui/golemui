import type { TimeInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { INCOMPLETE_TIME_MESSAGE } from '../utils/messages';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseTimeGroup,
  PART_DEFAULT_ARIA_LABELS,
  timeBoundsError,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupCompleteness,
  type TimeLocaleData,
} from '../utils/parts';

const TIME_PART_TYPES: readonly DateTimePartType[] = ['hour', 'minute'];
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { getTimeFormatParts, type HourFormat } from '../utils/time';

@customElement('gui-time')
export class GuiTime extends LitElement {
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
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;

  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this input into the picker's popup must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-time-input';
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
    getHourFormat: () => this.timeLocaleData.effectiveHourFormat,
    getDayPeriodLabels: () => this.timeLocaleData.dayPeriodLabels,
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

  private get timeLocaleData(): TimeLocaleData {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.timeLocaleData.descriptors[type as DateTimePartType];
  }

  override willUpdate(changedProperties: PropertyValues): void {
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
      'time',
      this.timeLocaleData.effectiveHourFormat,
    );
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
          class="gui-widget-input gui-parts gui-parts-ring gui-time-input ${this.icon
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
    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const { result, writeBacks } = parseTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: { time: result.kind === 'valid' ? result.iso : null },
        bubbles: true,
        composed: true,
      }),
    );

    if (result.kind !== 'valid') {
      this.requestUpdate();
      return;
    }

    const boundsError = timeBoundsError(result.iso, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });

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

  /** The group's fill state, for host pickers' own focus-leave checks. */
  groupCompleteness(): GroupCompleteness {
    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const { result } = parseTimeGroup(this._parts.values['default'] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
    });
    if (result.kind !== 'incomplete') return 'complete';
    return this._parts.isGroupEmpty('default', TIME_PART_TYPES) ? 'empty' : 'partial';
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
    this._parts.surfaceInputError(this.incompleteMessage ?? INCOMPLETE_TIME_MESSAGE);
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
