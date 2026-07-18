import type { RangeTimeInputProps, TimeRange } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseTimeGroup,
  timeBoundsError,
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
import {
  compareISOTimes,
  formatISOTimeForLocale,
  getTimeFormatParts,
  isTimeRangeDisabled,
  mergeTimeRanges,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import {
  INVALID_DISABLED_TIME_RANGE_MESSAGE,
  INVALID_TIME_RANGE_ORDER_MESSAGE,
} from '../utils/messages';

@customElement('gui-range-time')
export class GuiRangeTimeInput extends LitElement {
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
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;

  @property({ type: Array }) value: TimeRange[] | undefined = [];
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
    | undefined = undefined;
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) endTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;

  private readonly inputBlockClass = 'gui-range-time-input';
  private readonly groups = ['start', 'end'] as const;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => {
      this.tryCreatePill();
    },
    isReadonly: () => !!this.readOnly || this.allowCustomTime === false,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: () => {
      // Unlike gui-time, an empty part never commits a null value
    },
    onEnter: () => {
      this.tryCreatePill();
      if (this.value && this.value.length > 0) {
        this.onPillClick(this.value[this.value.length - 1]);
      }
    },
    getHourFormat: () => this.timeLocaleData.effectiveHourFormat,
    getDayPeriodLabels: () => this.timeLocaleData.dayPeriodLabels,
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

  private get timeLocaleData() {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.timeLocaleData.descriptors[type as DateTimePartType];
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
    const templateData: ControlTemplateData<TimeRange[]> & RangeTimeInputProps = {
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
      formatParts: getTimeFormatParts(this.localeId, this.timeLocaleData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      required: this.required,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly || this.allowCustomTime === false,
    };

    const pillItems: GuiPillItem[] = buildPillItems(
      this.getSortedPills(),
      (pill) => formatRangeLabel(pill, (iso) => this.formatTimeForDisplay(iso)),
      this.removePillAriaLabel ?? 'Remove time',
    );

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-parts-ring gui-range-time-input ${this.icon
            ? 'gui-range-time-input--icon'
            : ''}"
          role="group"
          aria-label=${this.label ?? 'Time range input'}
        >
          ${this.icon
            ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
            : nothing}

          <gui-pills
            class="gui-range-time-input__pills"
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .items=${pillItems}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove time'}
            .compactAriaLabel=${`${pillItems.length} time ranges`}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
          ></gui-pills>

          <div class="gui-range-time-input__inputs">
            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${this.startTimeAriaLabel ?? 'Start time'}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${this.endTimeAriaLabel ?? 'End time'}
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
        this.querySelector<HTMLInputElement>('.gui-range-time-input__field input')?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (range) this.onPillClick(range);
  };

  private onPillClick(range: TimeRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', { detail: { range }, bubbles: true, composed: true }),
    );
  }

  private formatTimeForDisplay(isoTime: string): string {
    return formatISOTimeForLocale(isoTime, this.localeId, this.timeLocaleData.effectiveHourFormat);
  }

  private getSortedPills(): TimeRange[] {
    return sortRangesByStart(this.value, compareISOTimes);
  }

  /**
   * Parses a group's parts into an ISO time via the shared clamp/bounds
   * pipeline, surfacing a bounds violation as an inputError. Returns null while
   * the group is incomplete or out of bounds.
   */
  private validateTimeParts(group: string): string | null {
    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const { result, writeBacks } = parseTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind !== 'valid') return null;

    const boundsError = timeBoundsError(result.iso, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });
    if (boundsError) {
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: boundsError }, bubbles: true }),
      );
      return null;
    }
    return result.iso;
  }

  /**
   * Fills a group's segmented parts from an ISO time. The range time picker
   * calls this so a list pick lands in the visible input (start/end field)
   * before it attempts to commit — see {@link commitFromParts}.
   */
  fillGroup(group: 'start' | 'end', iso: string): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.timeLocaleData.effectiveHourFormat);
    this.requestUpdate();
  }

  /**
   * Attempts to commit the currently-entered parts as a pill, returning whether
   * one was created. A public entry point onto the same {@link tryCreatePill}
   * pipeline typed entry uses, so the picker's list-driven commits validate
   * (order + bounds + disabled ranges) through one path.
   */
  commitFromParts(): boolean {
    return this.tryCreatePill();
  }

  /**
   * @return true when a pill was created; false when the parts are incomplete
   * or the range is rejected (reversed order, out of bounds, or overlapping a
   * disabled range)
   */
  private tryCreatePill(): boolean {
    const start = this.validateTimeParts('start');
    const end = this.validateTimeParts('end');

    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: { start, end },
        bubbles: true,
        composed: true,
      }),
    );

    // A bounds-violating endpoint was surfaced above and behaves as incomplete
    // (no swap, no error clear), matching the original null return.
    const toEndpoint = (iso: string | null): RangeEndpoint<string> =>
      iso ? { kind: 'valid', value: iso } : { kind: 'incomplete' };

    const outcome = commitRange(toEndpoint(start), toEndpoint(end), this.value, {
      validate: (ordered) =>
        compareISOTimes(ordered.end, ordered.start) <= 0
          ? (this.rangeOrderMessage ?? INVALID_TIME_RANGE_ORDER_MESSAGE)
          : isTimeRangeDisabled(ordered.start, ordered.end, this.disabledRanges)
            ? (this.disabledRangeMessage ?? INVALID_DISABLED_TIME_RANGE_MESSAGE)
            : null,
      toRange: (ordered) => ({ start: ordered.start, end: ordered.end }),
      merge: mergeTimeRanges,
    });

    if (outcome.kind === 'incomplete') return false;

    if (outcome.kind === 'invalid') {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: outcome.message },
          bubbles: true,
        }),
      );
      return false;
    }

    this.value = outcome.value;

    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
    this._parts.seedDayPeriods();

    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    this._parts.focusFirst('start');
    this.requestUpdate();
    return true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-time': GuiRangeTimeInput;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-time')) {
  customElements.define('gui-range-time', GuiRangeTimeInput);
}
