import { html, nothing, type TemplateResult } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { getMonthYearParts, getWeekdayLabels } from './date';
import { chunk } from './grid-nav';
import { addErrors, addLabel } from './templates';

/**
 * Pure lit-html templates for the calendar components, extracted from the
 * render layer of `AbstractCalendar` (render / renderMonthPanel / renderHeader
 * / renderDaysGrid / renderYearGrid and the two month-nav buttons). The
 * emitted DOM is byte-identical to the abstract's: same classes, roles, aria
 * wiring, data attributes, tabindex policy and inline SVGs. Everything
 * host-specific (state, callbacks) arrives through the data parameters; the
 * subclass hooks (`renderAboveCalendar`, `renderBelowHeader`,
 * `renderPanelBody`'s year-grid/time-grid switching, `renderDay`) stay in the
 * components and are passed in as closures.
 */

/** The month/year label formats the calendar header supports. */
export type CalendarMonthFormat = 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';

export interface CalendarChromeData {
  uid: string | undefined;
  label: string | undefined;
  hint: string | undefined;
  errors: string[] | undefined;
  touched: boolean | undefined;
  required: boolean | undefined;
  disabled: boolean | undefined;
  /** Months rendered side by side (`numberOfMonths ?? 1`). */
  numberOfMonths: number | undefined;
  prevMonthIcon: string | undefined;
  nextMonthIcon: string | undefined;
  prevMonthAriaLabel: string | undefined;
  nextMonthAriaLabel: string | undefined;
  canGoPrev: boolean;
  canGoNext: boolean;
  /** Nav clicks — bind the keyboard controller's onPrevMonthClick/onNextMonthClick. */
  onPrevMonthClick(): void;
  onNextMonthClick(): void;
  /** The wrapper div's focusout (blur-leave detection stays host-side). */
  onFocusOut(event: FocusEvent): void;
  /** The `renderAboveCalendar` hook (pills row); `nothing` by default. */
  renderAboveCalendar(): TemplateResult | typeof nothing;
  /** One month panel (see {@link renderMonthPanel}). */
  renderMonthPanel(offset: number): TemplateResult;
}

/**
 * The full calendar skeleton (the abstract's `render`): optional label, the
 * `.gui-widget` wrapper with its focusout binding, the `.gui-calendar-input`
 * group with aria wiring, the above-calendar hook, prev/next month-nav
 * buttons around the months grid, and the trailing errors block.
 *
 * @param {CalendarChromeData} data - Host state and hooks.
 * @return {TemplateResult} The calendar chrome.
 */
export function renderCalendarChrome(data: CalendarChromeData): TemplateResult {
  const templateData: any = {
    uid: data.uid,
    label: data.label,
    hint: data.hint,
    errors: data.errors,
    touched: data.touched,
    required: data.required,
  };

  const monthsToRender = Array.from({ length: data.numberOfMonths ?? 1 }, (_, i) => i);

  return html`
    ${data.label ? addLabel(data.uid as string, templateData, false, 'calendar') : nothing}

    <div class="gui-widget" @focusout=${data.onFocusOut}>
      <div
        id=${data.uid}
        class="gui-calendar-input"
        role="group"
        aria-labelledby=${data.label ? `${data.uid}_calendar_label` : nothing}
        ?aria-disabled=${data.disabled}
      >
        ${data.renderAboveCalendar()}
        <div class="gui-calendar__container">
          ${renderMonthNavButton('prev', {
            icon: data.prevMonthIcon,
            ariaLabel: data.prevMonthAriaLabel,
            disabled: !data.canGoPrev,
            onClick: data.onPrevMonthClick,
          })}

          <div class="gui-calendar__months-grid">
            ${monthsToRender.map((offset) => data.renderMonthPanel(offset))}
          </div>

          ${renderMonthNavButton('next', {
            icon: data.nextMonthIcon,
            ariaLabel: data.nextMonthAriaLabel,
            disabled: !data.canGoNext,
            onClick: data.onNextMonthClick,
          })}
        </div>
      </div>
    </div>

    ${data.errors?.length ? addErrors(data.uid as string, templateData) : nothing}
  `;
}

export interface MonthNavButtonData {
  /** Icon class (`prevMonthIcon`/`nextMonthIcon`); falsy renders the inline SVG chevron. */
  icon: string | undefined;
  /**
   * `prevMonthAriaLabel`/`nextMonthAriaLabel`. The `?? 'Previous month'` /
   * `?? 'Next month'` fallback only fires for undefined — the components
   * default these properties to '', exactly as before.
   */
  ariaLabel: string | undefined;
  /** `!canGoPrev()` / `!canGoNext()`. */
  disabled: boolean;
  onClick(): void;
}

/**
 * A month navigation button (the two inline button templates of the
 * abstract's `render`), including the direction's inline SVG chevron.
 *
 * @param {'prev' | 'next'} direction - Which nav button.
 * @param {MonthNavButtonData} data - Icon, label, disabled state and click.
 * @return {TemplateResult} The nav button.
 */
export function renderMonthNavButton(
  direction: 'prev' | 'next',
  data: MonthNavButtonData,
): TemplateResult {
  if (direction === 'prev') {
    return html`
      <button
        type="button"
        tabindex="0"
        class="gui-button gui-calendar__month-button gui-calendar__month-button--prev"
        ?disabled=${data.disabled}
        @click=${data.onClick}
        aria-label=${data.ariaLabel ?? 'Previous month'}
      >
        ${data.icon
          ? html`<span
              class=${`gui-widget-icon ${data.icon}`}
              data-icon=${data.icon}
            ></span>`
          : html`<svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 256 256"
            >
              <path
                d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"
              ></path>
            </svg>`}
      </button>
    `;
  }

  return html`
    <button
      type="button"
      tabindex="0"
      class="gui-button gui-calendar__month-button gui-calendar__month-button--next"
      ?disabled=${data.disabled}
      @click=${data.onClick}
      aria-label=${data.ariaLabel ?? 'Next month'}
    >
      ${data.icon
        ? html`<span
            class=${`gui-widget-icon ${data.icon}`}
            data-icon=${data.icon}
          ></span>`
        : html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
          >
            <path
              d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
            ></path>
          </svg>`}
    </button>
  `;
}

export interface MonthPanelData {
  /** The host's `_currentDate` (any day-of-month; normalized to day 1 here). */
  currentDate: Date;
  /** Panel offset in months. */
  offset: number;
  /** The panel header for the derived panel date (see {@link renderMonthHeader}). */
  renderHeader(panelDate: Date): TemplateResult;
  /** The `renderBelowHeader` hook (time-picker rows); `nothing` by default. */
  renderBelowHeader(offset: number): TemplateResult | typeof nothing;
  /** The `renderPanelBody` hook (days grid / year grid / time-grid takeover). */
  renderPanelBody(offset: number): TemplateResult;
}

/**
 * A month panel (the abstract's `renderMonthPanel`): derives the panel date —
 * day-1 normalization before the month offset — and composes header, the
 * below-header hook and the panel body.
 *
 * @param {MonthPanelData} data - Panel inputs and hooks.
 * @return {TemplateResult} The panel.
 */
export function renderMonthPanel(data: MonthPanelData): TemplateResult {
  const panelDate = new Date(data.currentDate);
  panelDate.setDate(1);
  panelDate.setMonth(panelDate.getMonth() + data.offset);

  return html`
    <div class="gui-calendar__panel">
      ${data.renderHeader(panelDate)} ${data.renderBelowHeader(data.offset)}
      ${data.renderPanelBody(data.offset)}
    </div>
  `;
}

export interface CalendarMonthPanelData {
  /** The nav controller's `currentDate` (any day-of-month; normalized to day 1 by {@link renderMonthPanel}). */
  currentDate: Date;
  /** Panel offset in months. */
  offset: number;
  localeId: string | undefined;
  monthFormat: CalendarMonthFormat | undefined;
  /** The nav controller's `yearSelectorOpen`, for the header's aria-expanded. */
  yearSelectorOpen: boolean;
  /** The year-button click — the host's `toggleYearSelector` (subclasses close time pickers first). */
  onToggleYearSelector(): void;
  /** The `renderBelowHeader` hook (the date-time subclasses' time-picker rows); defaults to nothing. */
  renderBelowHeader?(offset: number): TemplateResult | typeof nothing;
  /** The `renderPanelBody` hook (year-grid/days switch, or a subclass takeover). */
  renderPanelBody(offset: number): TemplateResult;
}

/**
 * The standard month panel both calendar hosts previously composed inline:
 * {@link renderMonthPanel} with a {@link renderMonthHeader} header wired to
 * the year-selector toggle, the below-header hook (nothing unless supplied)
 * and the panel-body hook. DOM byte-identical to the former per-host wiring.
 *
 * @param {CalendarMonthPanelData} data - Panel state and hooks.
 * @return {TemplateResult} The panel.
 */
export function renderCalendarMonthPanel(data: CalendarMonthPanelData): TemplateResult {
  return renderMonthPanel({
    currentDate: data.currentDate,
    offset: data.offset,
    renderHeader: (panelDate) =>
      renderMonthHeader(panelDate, {
        localeId: data.localeId,
        monthFormat: data.monthFormat,
        yearSelectorOpen: data.yearSelectorOpen,
        onToggleYearSelector: data.onToggleYearSelector,
      }),
    renderBelowHeader: data.renderBelowHeader ?? (() => nothing),
    renderPanelBody: data.renderPanelBody,
  });
}

export interface CalendarPanelBodyData<D extends { date: Date }> {
  /** Panel offset in months — only the first panel swaps in the year grid. */
  offset: number;
  /** The nav controller's `yearSelectorOpen`. */
  yearSelectorOpen: boolean;
  /** The nav controller's `yearList`. */
  years: number[];
  /** The nav controller's `currentDate.getFullYear()`. */
  currentYear: number;
  /** Year pick — bind the keyboard controller's `selectYear`. */
  onSelectYear(year: number): void;
  /** Year-grid keydown — bind the keyboard controller's `handleYearKeydown`. */
  onYearKeydown(event: KeyboardEvent): void;
  localeId: string | undefined;
  /** The host's `getDaysInMonth`. */
  getDays(offset: number): D[];
  /** The host's `renderDay`. */
  renderDay(day: D): TemplateResult;
}

/**
 * The default panel body both calendar hosts previously duplicated as
 * `renderPanelBody`/`renderDays`: the year grid replaces the days grid of the
 * first panel while the year selector is open; otherwise the days grid
 * renders the host's days chunked into weeks of 7 with the locale's weekday
 * labels. DOM byte-identical to the former host members.
 *
 * @param {CalendarPanelBodyData<D>} data - Panel state, year-grid callbacks and day rendering.
 * @return {TemplateResult} The panel body.
 */
export function renderCalendarPanelBody<D extends { date: Date }>(
  data: CalendarPanelBodyData<D>,
): TemplateResult {
  return data.yearSelectorOpen && data.offset === 0
    ? renderYearGrid({
        years: data.years,
        currentYear: data.currentYear,
        onSelectYear: data.onSelectYear,
        onKeydown: data.onYearKeydown,
      })
    : renderDaysGrid(chunk(data.getDays(data.offset), 7), getWeekdayLabels(data.localeId), (day) =>
        data.renderDay(day),
      );
}

export interface MonthHeaderData {
  localeId: string | undefined;
  /** The header's month format (`monthFormat ?? 'long'` via the util default). */
  monthFormat: CalendarMonthFormat | undefined;
  /** Whether the year grid is open (`_yearSelectorOpen`), for aria-expanded. */
  yearSelectorOpen: boolean;
  /** The year-button click — the host's `toggleYearSelector` (subclasses close time pickers first). */
  onToggleYearSelector(): void;
}

/**
 * A panel header (the abstract's `renderHeader`): the locale-ordered
 * month/year parts, with the year rendered as the year-selector toggle button
 * (chevron SVG included) and the month as a plain span.
 *
 * @param {Date} panelDate - The panel's month (from {@link renderMonthPanel}).
 * @param {MonthHeaderData} data - Locale, format and the toggle callback.
 * @return {TemplateResult} The header.
 */
export function renderMonthHeader(panelDate: Date, data: MonthHeaderData): TemplateResult {
  const parts = getMonthYearParts(data.localeId, panelDate, data.monthFormat);

  return html`
    <header class="gui-calendar__header">
      <h2>
        ${parts.map((part) =>
          part.type === 'year'
            ? html`<button
                type="button"
                tabindex="0"
                class="gui-calendar__year-selector"
                @click=${data.onToggleYearSelector}
                aria-expanded=${data.yearSelectorOpen}
                aria-label="Select year"
              >
                <span class="gui-calendar__year-value">${part.value}</span>
                <span class="gui-calendar__year-arrow" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 256 256"
                  >
                    <path
                      d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
                    ></path>
                  </svg>
                </span>
              </button>`
            : html`<span class="gui-calendar__month-name">${part.value}</span>`,
        )}
      </h2>
    </header>
  `;
}

/**
 * The days grid of one panel (the abstract's `renderDaysGrid`, minus the day
 * generation): a weekday header row plus the given weeks, each day rendered
 * through the component's `renderDay`. Keys are preserved exactly — weekdays
 * by index, days by `date.toISOString()`.
 *
 * @param {D[][]} weeks - The panel's days chunked into weeks of 7
 *   (`chunk(getDaysInMonth(offset), 7)`).
 * @param {string[]} weekdayLabels - `getWeekdayLabels(localeId)`.
 * @param {(day: D) => TemplateResult} renderDay - The component's day renderer.
 * @return {TemplateResult} The days grid.
 */
export function renderDaysGrid<D extends { date: Date }>(
  weeks: D[][],
  weekdayLabels: string[],
  renderDay: (day: D) => TemplateResult,
): TemplateResult {
  return html`
    <div class="gui-calendar__days-grid" role="grid">
      <div role="row" class="gui-calendar__rows">
        ${repeat(
          weekdayLabels,
          (weekday, i) => i,
          (weekday) => html`<span class="gui-calendar__weekday" role="gridcell">${weekday}</span>`,
        )}
      </div>

      ${repeat(
        weeks,
        (week) => html`
          <div role="row" class="gui-calendar__rows">
            ${repeat(
              week,
              (day) => day.date.toISOString(),
              (day) => renderDay(day),
            )}
          </div>
        `,
      )}
    </div>
  `;
}

export interface YearGridData {
  /** `_yearList` (min..max year, inclusive). */
  years: number[];
  /** `_currentDate.getFullYear()` — gets the roving tabindex 0 and `.current`. */
  currentYear: number;
  /** Year pick — bind the keyboard controller's `selectYear`. */
  onSelectYear(year: number): void;
  /** Grid keydown — bind the keyboard controller's `handleYearKeydown`. */
  onKeydown(event: KeyboardEvent): void;
}

/**
 * The year-selector grid (the abstract's `renderYearGrid` + `chunkYears`):
 * rows of 4 year buttons with the roving tabindex on the current year,
 * `data-year` attributes and click-to-select (with the original's
 * stopPropagation).
 *
 * @param {YearGridData} data - Years, current year and callbacks.
 * @return {TemplateResult} The year grid.
 */
export function renderYearGrid(data: YearGridData): TemplateResult {
  const currentYear = data.currentYear;

  return html`
    <div
      class="gui-calendar__year-grid"
      role="grid"
      aria-label="Year selection"
      @keydown=${data.onKeydown}
    >
      ${chunk(data.years, 4).map(
        (row) => html`
          <div role="row" class="gui-calendar__year-row">
            ${row.map(
              (year) => html`
                <button
                  type="button"
                  role="gridcell"
                  class="gui-calendar__year-button ${year === currentYear ? 'current' : ''}"
                  tabindex=${year === currentYear ? 0 : -1}
                  data-year=${year}
                  @click=${(e: MouseEvent) => {
                    e.stopPropagation();
                    data.onSelectYear(year);
                  }}
                  aria-selected=${year === currentYear}
                >
                  ${year}
                </button>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `;
}
