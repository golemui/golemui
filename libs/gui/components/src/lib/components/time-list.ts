import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { chunk, gridKeyStep, listPageSize, nextEnabledIndex } from '../utils/grid-nav';
import {
  buildTimeOptions,
  compareISOTimes,
  formatISOTimeForLocale,
  NO_AVAILABLE_TIMES_MESSAGE,
  resolveHourFormat,
  type HourFormat,
  type TimeOption,
  type TimeRange,
} from '../utils/time';

@customElement('gui-time-list')
export class GuiTimeList extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly = false;
  @property({ type: Number }) height: number | undefined = undefined;
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  @property({ type: Number }) columns: number | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;

  // Generating and locale-formatting up to a full day of slots is not free,
  // so the option list is memoized per input change
  private _optionsCache:
    | { key: string; options: (TimeOption & { template: string })[] }
    | undefined;

  override createRenderRoot() {
    return this;
  }

  private get effectiveColumns(): number {
    return this.columns || 1;
  }

  private get timeOptions(): (TimeOption & { template: string })[] {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const key = [
      this.localeId,
      hourFormat,
      this.minTime,
      this.maxTime,
      this.minuteStep,
      JSON.stringify(this.disabledRanges ?? null),
    ].join('|');

    if (this._optionsCache?.key !== key) {
      this._optionsCache = {
        key,
        options: buildTimeOptions({
          minTime: this.minTime,
          maxTime: this.maxTime,
          minuteStep: this.minuteStep,
          disabledRanges: this.disabledRanges,
        }).map((slot) => ({
          ...slot,
          template: formatISOTimeForLocale(slot.value, this.localeId, hourFormat),
        })),
      };
    }
    return this._optionsCache.options;
  }

  private isSelected(option: TimeOption): boolean {
    return this.value != null && compareISOTimes(option.value, this.value) === 0;
  }

  private get rovingIndex(): number {
    const options = this.timeOptions;
    const selected = options.findIndex((option) => this.isSelected(option) && !option.disabled);
    if (selected !== -1) return selected;
    return options.findIndex((option) => !option.disabled);
  }

  scrollToSelectedValue() {
    const viewport = this.querySelector('.gui-time-list__viewport');
    const target = (this.querySelector('.gui-time-list__option--selected') ??
      this.querySelector('.gui-time-list__option')) as HTMLElement | null;
    if (viewport && target) {
      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollTop =
        viewport.scrollTop +
        (targetRect.top - viewportRect.top) -
        viewportRect.height / 2 +
        targetRect.height / 2;
      viewport.scrollTop = Math.max(0, scrollTop);
    }
  }

  focusSelectedOption() {
    const target = this.querySelector<HTMLButtonElement>('.gui-time-list__option[tabindex="0"]');
    target?.focus();
  }

  private selectOption(option: TimeOption, event: Event) {
    event.stopPropagation();
    if (this.disabled || this.readOnly || option.disabled) return;

    this.value = option.value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: option.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLButtonElement;
    if (!target.classList.contains('gui-time-list__option')) return;

    const buttons = Array.from(this.querySelectorAll<HTMLButtonElement>('.gui-time-list__option'));
    const currentIndex = buttons.indexOf(target);
    const columns = this.effectiveColumns;
    const isRTL = window.getComputedStyle(this).direction === 'rtl';
    const isOptionDisabled = (index: number) => this.timeOptions[index].disabled;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = this.timeOptions[currentIndex];
      if (option) this.selectOption(option, event);
      return;
    }

    const intent = gridKeyStep(event.key, {
      columns,
      isRTL,
      pageSize: listPageSize(this.height, this.itemHeight, columns),
    });
    if (intent.kind === 'none') return;

    event.preventDefault();

    if (intent.kind === 'edge') {
      const from = intent.edge === 'first' ? 0 : buttons.length - 1;
      const index = nextEnabledIndex(
        from,
        intent.edge === 'first' ? 1 : -1,
        this.timeOptions.length,
        isOptionDisabled,
        { includeStart: true, outOfBounds: 'none' },
      );
      if (index !== -1) buttons[index].focus();
      return;
    }

    const step = intent.delta;
    const landing = Math.min(Math.max(currentIndex + step, 0), buttons.length - 1);
    if (landing === currentIndex) return;
    const next = nextEnabledIndex(
      landing,
      step > 0 ? 1 : -1,
      this.timeOptions.length,
      isOptionDisabled,
      { includeStart: true, outOfBounds: 'none' },
    );
    if (next !== -1 && next !== currentIndex) buttons[next].focus();
  }

  private renderOption(option: TimeOption & { template: string }, index: number, role: string) {
    const selected = this.isSelected(option);
    const classes = {
      'gui-time-list__option': true,
      'gui-time-list__option--selected': selected,
    };

    return html`
      <button
        type="button"
        role=${role}
        class=${classMap(classes)}
        tabindex=${index === this.rovingIndex ? 0 : -1}
        ?disabled=${option.disabled || this.disabled}
        data-value=${option.value}
        aria-selected=${selected}
        aria-disabled=${option.disabled || this.disabled ? 'true' : 'false'}
        @click=${(e: MouseEvent) => this.selectOption(option, e)}
      >
        ${option.template}
      </button>
    `;
  }

  override render() {
    const options = this.timeOptions;

    if (options.length === 0) {
      return html`<div class="gui-time-list__empty">
        ${this.noAvailableTimesMessage ?? NO_AVAILABLE_TIMES_MESSAGE}
      </div>`;
    }

    const columns = this.effectiveColumns;
    const sizeVars = `--gui-time-list-height: ${this.height ?? 300}px; --gui-time-list-item-height: ${
      this.itemHeight || 40
    }px; --gui-time-list-columns: ${columns};`;

    if (columns === 1) {
      return html`
        <div
          class="gui-time-list__viewport"
          role="listbox"
          style=${sizeVars}
          aria-label=${this.label ?? nothing}
          @keydown=${this.onKeyDown}
        >
          ${options.map((option, index) => this.renderOption(option, index, 'option'))}
        </div>
      `;
    }

    const rows = chunk(options, columns);

    return html`
      <div
        class="gui-time-list__viewport gui-time-list__viewport--grid"
        role="grid"
        style=${sizeVars}
        aria-label=${this.label ?? nothing}
        @keydown=${this.onKeyDown}
      >
        ${rows.map(
          (row, rowIndex) => html`
            <div role="row" class="gui-time-list__row">
              ${row.map((option, cellIndex) =>
                this.renderOption(option, rowIndex * columns + cellIndex, 'gridcell'),
              )}
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-time-list': GuiTimeList;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-time-list')) {
  customElements.define('gui-time-list', GuiTimeList);
}
