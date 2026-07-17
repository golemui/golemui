import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { AbstractDateTimePartsInput } from './abstract-date-time-parts-input';
import { mergeDateTimeRanges, orderDateTimeRange, parseISODateTimeString } from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';

export const INVALID_MIN_DATE_TIME_MESSAGE =
  'Invalid date-time: date-time is before the minimum allowed date-time.';
export const INVALID_MAX_DATE_TIME_MESSAGE =
  'Invalid date-time: date-time is after the maximum allowed date-time.';

@customElement('gui-range-date-time')
export class GuiRangeDateTimeInput extends AbstractDateTimePartsInput {
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

  protected override readonly inputBlockClass = 'gui-range-date-time-input';
  protected override readonly groups = ['start', 'end'] as const;

  /**
   * Each endpoint is an instant, so it is bounded by instants. A date-only
   * bound could not express this: `maxDate: 2026-02-10` is ambiguous about
   * whether the 10th is allowed until 00:00 or 23:59, and independent date/time
   * axes would wrongly reject Feb 11 08:00 for a `minTime` of 09:00.
   */
  protected override boundsError(_iso: string, instant: Date): string | null {
    const time = instant.getTime();

    const min = this.minDateTime ? parseISODateTimeString(this.minDateTime) : undefined;
    if (min && !isNaN(min.getTime()) && time < min.getTime()) {
      return this.minDateTimeMessage ?? INVALID_MIN_DATE_TIME_MESSAGE;
    }

    const max = this.maxDateTime ? parseISODateTimeString(this.maxDateTime) : undefined;
    if (max && !isNaN(max.getTime()) && time > max.getTime()) {
      return this.maxDateTimeMessage ?? INVALID_MAX_DATE_TIME_MESSAGE;
    }

    return null;
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
    // Unlike gui-date-time, an empty part never commits a null value
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

    const pills = this.getSortedPills();
    const pillItems: GuiPillItem[] = pills.map((pill) => {
      const pillLabel = `${this.formatDateTimeForDisplay(pill.start)} - ${this.formatDateTimeForDisplay(
        pill.end,
      )}`;
      return {
        key: `${pill.start}-${pill.end}`,
        label: pillLabel,
        ariaLabel: `${this.removePillAriaLabel ?? 'Remove date-time'} ${pillLabel}`,
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
              ${this.renderGroupParts('start')}
            </div>

            <span class="gui-range-date-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${this.endDateTimeAriaLabel ?? 'End date-time'}
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
    const removed = this.getSortedPills().find((pill) => `${pill.start}-${pill.end}` === e.detail.key);
    if (!removed) return;
    const next = (this.value ?? []).filter(
      (pill) => !(pill.start === removed.start && pill.end === removed.end),
    );
    this.value = next;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    if (next.length === 0) {
      requestAnimationFrame(() => {
        this.querySelector<HTMLInputElement>('.gui-range-date-time-input__field input')?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = this.getSortedPills().find((pill) => `${pill.start}-${pill.end}` === e.detail.key);
    if (range) this.onPillClick(range);
  };

  private onPillClick(range: DateTimeRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', { detail: { range }, bubbles: true, composed: true }),
    );
  }

  private formatDateTimeForDisplay(iso: string): string {
    const date = parseISODateTimeString(iso);
    if (isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.effectiveHourFormat === '12',
    }).format(date);
  }

  private getSortedPills(): DateTimeRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort(
      (a, b) => parseISODateTimeString(a.start).getTime() - parseISODateTimeString(b.start).getTime(),
    );
  }

  /**
   * Parses a group into an ISO date-time via the shared clamp/bounds pipeline,
   * distinguishing an incomplete group (`null`, nothing to report) from a
   * complete-but-rejected one (`{ error }` — an impossible date or an
   * out-of-bounds date/time). Unlike before it does not emit: the caller
   * decides whether to surface or clear an error, so fixing one group clears
   * its error even while the other is still empty.
   */
  private validateDateTimeParts(group: string): { iso: string } | { error: string } | null {
    const parsed = this.parseDateTimeGroup(group);
    if (!parsed) return null;
    if (parsed.error) return { error: parsed.error };
    return { iso: parsed.iso as string };
  }

  private tryCreatePill() {
    const start = this.validateDateTimeParts('start');
    const end = this.validateDateTimeParts('end');

    // A completed-but-rejected group (impossible date, or out of bounds) is
    // surfaced right away, using its own specific message.
    const errorMessage =
      start && 'error' in start ? start.error : end && 'error' in end ? end.error : null;
    if (errorMessage) {
      this.surfaceInputError(errorMessage);
      return;
    }

    // Not both complete yet: no group is rejected, so clear any error a
    // now-corrected group left behind, then wait for the rest of the range.
    if (!(start && 'iso' in start) || !(end && 'iso' in end)) {
      this.clearSurfacedInputError(this.value ?? []);
      return;
    }

    // Date-time ranges are two instants: a backward selection reorders (swap)
    // rather than erroring — mirroring the range calendar's date swap.
    const ordered = orderDateTimeRange(start.iso, end.iso);

    this.value = mergeDateTimeRanges([...(this.value ?? []), ordered]);

    this.clearGroup('start');
    this.clearGroup('end');
    this.seedDayPeriods(this.groups);

    // The commit's own change clears any injected error downstream.
    this._hasSurfacedInputError = false;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    requestAnimationFrame(() => {
      this.getGroupInputs('start')[0]?.focus();
    });
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
