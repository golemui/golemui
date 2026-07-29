import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import {
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  formatISODateTimeForLocale,
  getDateTimeFormatParts,
  mergeDateTimeRanges,
  orderDateTimeRange,
  parseISODateTimeString,
  type HourFormat,
} from '../utils/time';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseDateTimeGroup,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from '../utils/parts';
import { commitRange, type RangeEndpoint } from '../utils/range-commit';
import {
  buildPillItems,
  findRangeByKey,
  formatRangeLabel,
  removeRangeByKey,
  sortRangesByStart,
} from '../utils/pill-ranges';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { DISABLED_DATE_RANGE_MESSAGE } from '../utils/messages';

@customElement('gui-range-date-time')
export class GuiRangeDateTimeInput extends LitElement {
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

  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'max-date-time-message' }) maxDateTimeMessage:
    | string
    | undefined = undefined;
  /**
   * Disabled instant spans a typed range must not overlap. Not part of the
   * standalone rangeDateTimeInput widget's public API (typed inputs in this
   * family stay hole-unaware, matching rangeTimeInput); this is here just to
   * pass them down to the range date-time picker's calendar
   */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;

  private readonly inputBlockClass = 'gui-range-date-time-input';
  private readonly groups = ['start', 'end'] as const;

  /**
   * Set on the first commit attempt (Enter). While set, every part change
   * re-runs validation so a resolved error clears without another Enter.
   * Cleared once a pill is committed, so the next range starts quiet.
   */
  private _validationTriggered = false;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => {
      if (this._validationTriggered) {
        this.revalidate();
      } else {
        this.syncParts();
      }
    },
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: () => {
      // Unlike gui-date-time, an empty part never commits a null value
    },
    onEnter: () => {
      this.tryCreatePill();
      if (this.value && this.value.length > 0) {
        this.onPillClick(this.value[this.value.length - 1]);
      }
    },
    getHourFormat: () => this.localeData.effectiveHourFormat,
    getDayPeriodLabels: () => this.localeData.dayPeriodLabels,
    onInputErrorSurfaced: (message) =>
      this.dispatchEvent(new CustomEvent('inputError', { detail: { message }, bubbles: true })),
    onSurfacedErrorCleared: (value) =>
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }),
      ),
  });

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

  private get localeData() {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep, true);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.localeData.descriptors[type as DateTimePartType];
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (
      !this.hasUpdated ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this._parts.seedDayPeriods();
    }
  }

  override render() {
    const templateData: ControlTemplateData<DateTimeRange[]> & RangeDateTimeInputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
    };

    const partsData: GUIPartsTemplateData = {
      blockClass: this.inputBlockClass,
      groups: this.groups,
      formatParts: getDateTimeFormatParts(this.localeId, this.localeData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      required: this.required,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
    };

    const pillItems: GuiPillItem[] = buildPillItems(
      this.getSortedPills(),
      (range) => formatRangeLabel(range, (iso) => this.formatDateTimeForDisplay(iso)),
      this.removePillAriaLabel ?? 'Remove date-time',
    );

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-parts-ring gui-range-date-time-input ${this.icon
            ? 'gui-range-date-time-input--icon'
            : ''}"
          role="group"
          aria-label=${this.label ?? 'Date-time range input'}
        >
          ${this.icon
            ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
            : nothing}

          <gui-pills
            class="gui-range-date-time-input__pills"
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .items=${pillItems}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date-time'}
            .compactAriaLabel=${`${pillItems.length} date-time ranges`}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
          ></gui-pills>

          <div class="gui-range-date-time-input__inputs">
            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${this.startDateTimeAriaLabel ?? 'Start date-time'}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${this.endDateTimeAriaLabel ?? 'End date-time'}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>

        ${this.showErrors && this.errors?.length
          ? addErrors(this.uid as string, templateData)
          : nothing}
      </div>
    `;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    if (removal.next.length === 0) {
      requestAnimationFrame(() => {
        this.querySelector<HTMLInputElement>('.gui-range-date-time-input__field input')?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (range) this.onPillClick(range);
  };

  private onPillClick(range: DateTimeRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', { detail: { range }, bubbles: true, composed: true }),
    );
  }

  private formatDateTimeForDisplay(iso: string): string {
    return formatISODateTimeForLocale(iso, this.localeId, this.localeData.effectiveHourFormat);
  }

  private getSortedPills(): DateTimeRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => parseISODateTimeString(a).getTime() - parseISODateTimeString(b).getTime(),
    );
  }

  /**
   * Parses a group into an ISO date-time via the shared clamp/bounds pipeline,
   * distinguishing an incomplete group (nothing to report) from a
   * complete-but-rejected one (an impossible date or an out-of-bounds
   * date-time). It does not emit: the caller decides whether to surface or
   * clear an error, so fixing one group clears its error even while the other
   * is still empty.
   *
   * Each endpoint is an instant, so it is bounded by instants. A date-only
   * bound could not express this: `maxDate: 2026-02-10` is ambiguous about
   * whether the 10th is allowed until 00:00 or 23:59, and independent date/time
   * axes would wrongly reject Feb 11 08:00 for a `minTime` of 09:00.
   */
  private validateDateTimeParts(group: string): RangeEndpoint<string> {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { result, writeBacks } = parseDateTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'incomplete') return { kind: 'incomplete' };
    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };

    const boundsError = dateTimeBoundsError(result.iso, this.minDateTime, this.maxDateTime, {
      minDateTimeMessage: this.minDateTimeMessage,
      maxDateTimeMessage: this.maxDateTimeMessage,
    });
    if (boundsError) return { kind: 'invalid', message: boundsError };

    return { kind: 'valid', value: result.iso };
  }

  /**
   * Re-parses both endpoints so per-endpoint problems (impossible date-time,
   * out of instant bounds) surface while the user types. Runs on every part
   * change.
   */
  private syncParts() {
    return {
      start: this.validateDateTimeParts('start'),
      end: this.validateDateTimeParts('end'),
    };
  }

  /**
   * Parses the range and updates the error state, without ever committing.
   * Shared by the Enter commit and by {@link revalidate}.
   */
  private evaluateRange() {
    const { start, end } = this.syncParts();

    const result = commitRange(start, end, this.value, {
      // Date-time ranges are two instants: a backward selection reorders (swap)
      // rather than erroring — mirroring the range calendar's date swap.
      order: (s, e) => {
        const ordered = orderDateTimeRange(s, e);
        return { start: ordered.start, end: ordered.end };
      },
      validate: (ordered) =>
        dateTimeRangeOverlaps({ start: ordered.start, end: ordered.end }, this.disabledRanges)
          ? (this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE)
          : null,
      toRange: (ordered) => ({ start: ordered.start, end: ordered.end }),
      merge: mergeDateTimeRanges,
    });

    // A completed-but-rejected group (impossible date, or out of bounds) is
    // surfaced right away, using its own specific message.
    if (result.kind === 'invalid') {
      this._parts.surfaceInputError(result.message);
    }

    // Not both complete yet: no group is rejected, so clear any error a
    // now-corrected group left behind, then wait for the rest of the range.
    if (result.kind === 'incomplete') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }

    return result;
  }

  /**
   * Once the user has attempted a commit, every later edit re-runs validation
   * so a corrected range clears its error immediately, otherwise the message
   * would linger until the next Enter and the user could not tell the problem
   * was solved.
   */
  private revalidate() {
    const result = this.evaluateRange();

    if (result.kind === 'commit') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }
  }

  private tryCreatePill() {
    this._validationTriggered = true;

    const result = this.evaluateRange();
    if (result.kind !== 'commit') return;

    this.value = result.value;
    this._validationTriggered = false;

    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
    this._parts.seedDayPeriods();

    // The commit's own change clears any injected error downstream.
    this._parts.resetSurfacedInputError();
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    this._parts.focusFirst('start');
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time': GuiRangeDateTimeInput;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date-time')) {
  customElements.define('gui-range-date-time', GuiRangeDateTimeInput);
}
