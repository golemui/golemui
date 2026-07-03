import type { DateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  AbstractDateTimeInput,
  dateInputPartDescriptors,
  type DateTimePartDescriptor,
} from './abstract-date-time-input';
import {
  getDateFormatParts,
  maxValidDayInMonth,
  mergeDateRanges,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { styleMap } from 'lit-html/directives/style-map.js';

@customElement('gui-range-date')
export class GuiRangeDateInput extends AbstractDateTimeInput {
  @property({ type: Array }) value: DateRange[] | undefined = [];

  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;

  protected override readonly inputBlockClass = 'gui-range-date-input';
  protected override readonly groups = ['start', 'end'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

  protected override getFormatParts(): Intl.DateTimeFormatPart[] {
    return getDateFormatParts(this.localeId);
  }

  protected override getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  protected override commitParts(): void {
    this.tryCreatePill();
  }

  protected override onEnter(): void {
    this.tryCreatePill();
    if (this.value && this.value.length > 0) {
      const lastRange = this.value[this.value.length - 1];
      this.onPillClick(lastRange);
    }
  }

  protected override autoAdvanceFromGroupEnd(group: string): void {
    // Last input of start group -> jump to first input of end group;
    // after the end group there is nowhere to advance to
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
        if (otherInputs.length > 0) {
          const target = otherInputs[otherInputs.length - 1];
          target.focus();
          this.selectPart(target);
        }
      }
    } else {
      const otherGroup = isRTL ? 'start' : 'end';
      if (group !== otherGroup) {
        const otherInputs = this.getGroupInputs(otherGroup);
        if (otherInputs.length > 0) {
          otherInputs[0].focus();
          this.selectPart(otherInputs[0]);
        }
      }
    }
  }

  protected override onEmptyPartBlur(): void {
    // Unlike gui-date, an empty part never commits a null value
  }

  override render() {
    const templateData: ControlTemplateData<DateRange[]> & RangeDateInputProps = {
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
      const startFormatted = this.formatDateForDisplay(pill.start);
      const endFormatted = pill.end ? this.formatDateForDisplay(pill.end) : startFormatted;
      const pillLabel = `${startFormatted} - ${endFormatted}`;
      return {
        key: `${pill.start}-${pill.end ?? pill.start}`,
        label: pillLabel,
        ariaLabel: `${this.removePillAriaLabel ?? 'Remove date'} ${pillLabel}`,
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
          class="gui-widget-input gui-range-date-input ${this.icon
            ? 'gui-range-date-input--icon'
            : ''}"
          role="group"
          aria-label=${this.label ?? 'Date range input'}
        >
          ${this.icon
            ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
            : nothing}

          <gui-pills
            class="gui-range-date-input__pills"
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .items=${pillItems}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
            .compactAriaLabel=${`${pillItems.length} date ranges`}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
          ></gui-pills>

          <div class="gui-range-date-input__inputs">
            <div
              class="gui-range-date-input__field"
              role="group"
              aria-label=${this.startDateAriaLabel ?? 'Start date'}
            >
              ${this.renderGroupParts('start')}
            </div>

            <span class="gui-range-date-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-range-date-input__field"
              role="group"
              aria-label=${this.endDateAriaLabel ?? 'End date'}
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
    const sorted = this.getSortedPills();
    const idx = sorted.findIndex(
      (pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key,
    );
    if (idx < 0) return;
    const removed = sorted[idx];
    const next = (this.value ?? []).filter(
      (pill) => !(pill.start === removed.start && (pill.end ?? null) === (removed.end ?? null)),
    );
    this.value = next;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );

    if (next.length === 0) {
      requestAnimationFrame(() => {
        const firstInput = this.querySelector<HTMLInputElement>(
          '.gui-range-date-input__field input',
        );
        firstInput?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const sorted = this.getSortedPills();
    const range = sorted.find((pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key);
    if (range) this.onPillClick(range);
  };

  private formatDateForDisplay(isoDate: string): string {
    const date = parseISODateString(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private getSortedPills(): DateRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort(
      (a, b) => parseISODateString(a.start).getTime() - parseISODateString(b.start).getTime(),
    );
  }

  private onPillClick(range: DateRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', {
        detail: { range },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private validateDateParts(group: string): Date | null {
    let yearVal = parseInt(this.getPartValue(group, 'year'), 10);
    let monthVal = parseInt(this.getPartValue(group, 'month'), 10);
    let dayVal = parseInt(this.getPartValue(group, 'day'), 10);

    if (isNaN(yearVal) || isNaN(monthVal) || isNaN(dayVal)) return null;
    if (String(yearVal).length < 4) return null;

    // Clamp values transiently, without writing back to the inputs
    yearVal = this.clampToDescriptor('year', yearVal);
    monthVal = this.clampToDescriptor('month', monthVal);
    dayVal = this.clampToDescriptor('day', dayVal);

    const maxValidDay = maxValidDayInMonth(monthVal, yearVal);
    if (dayVal > maxValidDay) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: {
            message:
              'Invalid date: day is greater than the maximum valid day for the month and year.',
          },
          bubbles: true,
        }),
      );
      return null;
    }

    return new Date(yearVal, monthVal - 1, dayVal);
  }

  private tryCreatePill() {
    const startDate = this.validateDateParts('start');
    const endDate = this.validateDateParts('end');

    if (!startDate || !endDate) return;

    let rangeStart = startDate;
    let rangeEnd = endDate;

    // Swap if end < start
    if (endDate.getTime() < startDate.getTime()) {
      rangeStart = endDate;
      rangeEnd = startDate;
    }

    const startStr = toISODateString(rangeStart);
    const endStr = toISODateString(rangeEnd);
    const newRange: DateRange =
      startStr === endStr ? { start: startStr } : { start: startStr, end: endStr };

    const currentRanges = this.value ? [...this.value] : [];
    currentRanges.push(newRange);

    this.value = mergeDateRanges(currentRanges);

    // Clear the inputs
    this.clearGroup('start');
    this.clearGroup('end');

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );

    // Focus the first start date input
    requestAnimationFrame(() => {
      const startInputs = this.getGroupInputs('start');
      if (startInputs.length > 0) {
        startInputs[0].focus();
      }
    });

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-input': GuiRangeDateInput;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date')) {
  customElements.define('gui-range-date', GuiRangeDateInput);
}
