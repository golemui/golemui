import type { RangeTimeInputProps, TimeRange } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { AbstractTimePartsInput } from './abstract-time-parts-input';
import {
  compareISOTimes,
  formatISOTimeForLocale,
  isTimeRangeDisabled,
  mergeTimeRanges,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';

const INVALID_RANGE_ORDER_MESSAGE = 'Invalid range: end time must be after start time.';
const INVALID_DISABLED_RANGE_MESSAGE = 'Invalid time: time is within a disabled range.';

@customElement('gui-range-time')
export class GuiRangeTimeInput extends AbstractTimePartsInput {
  @property({ type: Array }) value: TimeRange[] | undefined = [];
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
    | undefined = undefined;
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) endTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime: boolean | undefined =
    undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;

  protected override readonly inputBlockClass = 'gui-range-time-input';
  protected override readonly groups = ['start', 'end'] as const;

  protected override get partsReadonly(): boolean {
    return !!this.readOnly || this.allowCustomTime === false;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (
      !this.hasUpdated ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this.seedDayPeriods(this.groups);
    }
  }

  protected override commitParts(): void {
    this.tryCreatePill();
  }

  protected override onEnter(): void {
    this.tryCreatePill();
    if (this.value && this.value.length > 0) {
      this.onPillClick(this.value[this.value.length - 1]);
    }
  }

  protected override autoAdvanceFromGroupEnd(group: string): void {
    if (group === 'start') {
      this.getGroupInputs('end')[0]?.focus();
    }
  }

  protected override navigatePastGroupEdge(
    key: 'ArrowLeft' | 'ArrowRight',
    group: string,
    isRTL: boolean,
  ): void {
    if (key === 'ArrowLeft') {
      const otherGroup = isRTL ? 'end' : 'start';
      if (group !== otherGroup) {
        const otherInputs = this.getGroupInputs(otherGroup);
        const target = otherInputs[otherInputs.length - 1];
        if (target) {
          target.focus();
          this.selectPart(target);
        }
      }
    } else {
      const otherGroup = isRTL ? 'start' : 'end';
      if (group !== otherGroup) {
        const otherInputs = this.getGroupInputs(otherGroup);
        if (otherInputs[0]) {
          otherInputs[0].focus();
          this.selectPart(otherInputs[0]);
        }
      }
    }
  }

  protected override onEmptyPartBlur(): void {
    // Unlike gui-time, an empty part never commits a null value
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

    const pills = this.getSortedPills();
    const pillItems: GuiPillItem[] = pills.map((pill) => {
      const endLabel = this.formatTimeForDisplay(pill.end ?? pill.start);
      const pillLabel = `${this.formatTimeForDisplay(pill.start)} - ${endLabel}`;
      return {
        key: `${pill.start}-${pill.end ?? pill.start}`,
        label: pillLabel,
        ariaLabel: `${this.removePillAriaLabel ?? 'Remove time'} ${pillLabel}`,
      };
    });

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
              ${this.renderGroupParts('start')}
            </div>

            <span class="gui-range-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${this.endTimeAriaLabel ?? 'End time'}
            >
              ${this.renderGroupParts('end')}
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
    const removed = this.getSortedPills().find(
      (pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key,
    );
    if (!removed) return;
    const next = (this.value ?? []).filter(
      (pill) => !(pill.start === removed.start && (pill.end ?? null) === (removed.end ?? null)),
    );
    this.value = next;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    if (next.length === 0) {
      requestAnimationFrame(() => {
        this.querySelector<HTMLInputElement>('.gui-range-time-input__field input')?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = this.getSortedPills().find(
      (pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key,
    );
    if (range) this.onPillClick(range);
  };

  private onPillClick(range: TimeRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', { detail: { range }, bubbles: true, composed: true }),
    );
  }

  private formatTimeForDisplay(isoTime: string): string {
    return formatISOTimeForLocale(isoTime, this.localeId, this.effectiveHourFormat);
  }

  private getSortedPills(): TimeRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort((a, b) => compareISOTimes(a.start, b.start));
  }

  /**
   * Parses a group's parts into an ISO time via the shared clamp/bounds
   * pipeline, surfacing a bounds violation as an inputError. Returns null while
   * the group is incomplete or out of bounds.
   */
  private validateTimeParts(group: string): string | null {
    const parsed = this.parseTimeGroup(group);
    if (!parsed) return null;
    if (parsed.boundsError) {
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: parsed.boundsError }, bubbles: true }),
      );
      return null;
    }
    return parsed.iso;
  }

  /**
   * Fills a group's segmented parts from an ISO time. The range time picker
   * calls this so a list pick lands in the visible input (start/end field)
   * before it attempts to commit — see {@link commitFromParts}.
   */
  fillGroup(group: 'start' | 'end', iso: string): void {
    this.setGroupTime(group, iso);
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

    if (!start || !end) return false;

    if (compareISOTimes(end, start) <= 0) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: this.rangeOrderMessage ?? INVALID_RANGE_ORDER_MESSAGE },
          bubbles: true,
        }),
      );
      return false;
    }

    if (isTimeRangeDisabled(start, end, this.disabledRanges)) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: this.disabledRangeMessage ?? INVALID_DISABLED_RANGE_MESSAGE },
          bubbles: true,
        }),
      );
      return false;
    }

    this.value = mergeTimeRanges([...(this.value ?? []), { start, end }]);

    this.clearGroup('start');
    this.clearGroup('end');
    this.seedDayPeriods(this.groups);

    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    requestAnimationFrame(() => {
      this.getGroupInputs('start')[0]?.focus();
    });
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
