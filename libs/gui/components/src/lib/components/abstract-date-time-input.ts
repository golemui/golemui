import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { GUIAriaController } from '../controllers/aria.controller';

export type DateTimePartType =
  | 'day'
  | 'month'
  | 'year'
  | 'hour'
  | 'minute'
  | 'second'
  | 'dayPeriod';

export interface DateTimePartDescriptor {
  type: DateTimePartType;
  kind: 'numeric' | 'dayPeriod';
  maxLength: number;
  min: number;
  max: number;
  placeholder: string;
  step?: number;
  incrementFallback?: number;
  wrap?: boolean;
}

/**
 * Descriptors for day/month/year parts as used by the date inputs.
 *
 * The incrementFallback stays 1 (not the year minimum) so incrementing an
 * empty year still produces the historical '0001' intermediate value in
 * widgets that clamp transiently.
 */
export function dateInputPartDescriptors(): Partial<
  Record<DateTimePartType, DateTimePartDescriptor>
> {
  return {
    day: { type: 'day', kind: 'numeric', maxLength: 2, min: 1, max: 31, placeholder: 'dd' },
    month: { type: 'month', kind: 'numeric', maxLength: 2, min: 1, max: 12, placeholder: 'mm' },
    year: {
      type: 'year',
      kind: 'numeric',
      maxLength: 4,
      min: 1000, // TODO: Add a prop to set the default minimum year, like 1979 or 2000
      max: 9999,
      placeholder: 'yyyy',
    },
  };
}

/**
 * Descriptors for hour/minute/dayPeriod parts as used by the time inputs.
 *
 * @param hourFormat - '12' renders 1-12 hours plus a dayPeriod part, '24' renders 0-23.
 * @param minuteStep - ArrowUp/ArrowDown increment for the minute part.
 * @param dayPeriodPlaceholder - Locale label shown when the dayPeriod part is empty.
 */
export function timeInputPartDescriptors(
  hourFormat: '12' | '24',
  minuteStep: number,
  dayPeriodPlaceholder: string,
): Partial<Record<DateTimePartType, DateTimePartDescriptor>> {
  return {
    hour:
      hourFormat === '12'
        ? {
            type: 'hour',
            kind: 'numeric',
            maxLength: 2,
            min: 1,
            max: 12,
            placeholder: 'hh',
          }
        : {
            type: 'hour',
            kind: 'numeric',
            maxLength: 2,
            min: 0,
            max: 23,
            placeholder: 'hh',
            incrementFallback: 0,
          },
    minute: {
      type: 'minute',
      kind: 'numeric',
      maxLength: 2,
      min: 0,
      max: 59,
      placeholder: 'mm',
      step: minuteStep,
      incrementFallback: 0,
      wrap: true,
    },
    dayPeriod: {
      type: 'dayPeriod',
      kind: 'dayPeriod',
      maxLength: 8,
      min: 0,
      max: 0,
      placeholder: dayPeriodPlaceholder,
    },
  };
}

/**
 * Shared behavior for segmented date/time inputs (gui-date, gui-range-date,
 * gui-time and future date-time widgets), mirroring the AbstractCalendar
 * pattern: the base owns the part model, keyboard interaction and rendering of
 * the individual part inputs, while subclasses own their value type, its
 * serialization (commitParts) and the surrounding layout (render).
 */
export abstract class AbstractDateTimeInput extends LitElement {
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

  /** Part values per group, e.g. { default: { day: '15', month: '06' } }. */
  @state() private _partValues: Partial<Record<string, Partial<Record<DateTimePartType, string>>>> =
    {};

  protected abstract readonly inputBlockClass: string;
  protected abstract readonly groups: readonly string[];

  protected abstract getFormatParts(): Intl.DateTimeFormatPart[];
  protected abstract getPartDescriptor(type: string): DateTimePartDescriptor | undefined;
  protected abstract commitParts(group: string): void;

  protected onEnter(_event: KeyboardEvent, _group: string): void {
    // no-op by default
  }

  /**
   * Called when auto-advance runs past the last input of a group.
   * Default: wrap to the group's first input.
   */
  protected autoAdvanceFromGroupEnd(group: string): void {
    this.getGroupInputs(group)[0]?.focus();
  }

  /**
   * Called when ArrowLeft/ArrowRight navigation runs past the group edge.
   * `direction` is the pressed key's logical direction after the RTL flip has
   * already been applied to in-group navigation. Default: stop at the edge.
   */
  protected navigatePastGroupEdge(
    _key: 'ArrowLeft' | 'ArrowRight',
    _group: string,
    _isRTL: boolean,
  ): void {
    // no-op by default
  }

  /** Called when a part is blurred while empty/invalid. Default: emit null. */
  protected onEmptyPartBlur(): void {
    this.dispatchEvent(new CustomEvent('change', { detail: { value: null } }));
  }

  protected renderLiteral(part: Intl.DateTimeFormatPart): TemplateResult {
    return html`<span class="${this.inputBlockClass}__separator">${part.value}</span>`;
  }

  /**
   * Value shown inside a part input. Defaults to the stored part value;
   * subclasses can map canonical values to display labels (e.g. dayPeriod).
   */
  protected getPartDisplayValue(group: string, type: DateTimePartType): string {
    return this.getPartValue(group, type);
  }

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

  protected getPartValue(group: string, type: DateTimePartType): string {
    return this._partValues[group]?.[type] ?? '';
  }

  protected setPartValue(group: string, type: DateTimePartType, value: string): void {
    this._partValues = {
      ...this._partValues,
      [group]: { ...this._partValues[group], [type]: value },
    };
  }

  protected clearGroup(group: string): void {
    this._partValues = { ...this._partValues, [group]: {} };
  }

  protected clampToDescriptor(type: DateTimePartType, value: number): number {
    const descriptor = this.getPartDescriptor(type);
    if (!descriptor) return value;
    return Math.max(descriptor.min, Math.min(descriptor.max, value));
  }

  /**
   * Focusable part elements of a group in DOM order. Numeric parts are
   * inputs; dayPeriod parts are toggle buttons — both carry the __part class.
   */
  protected getGroupInputs(group: string): HTMLElement[] {
    return this.groups.length > 1
      ? Array.from(this.querySelectorAll<HTMLElement>(`[data-group="${group}"]`))
      : Array.from(this.querySelectorAll<HTMLElement>(`.${this.inputBlockClass}__part`));
  }

  /** Selects an input's text; a no-op for non-input parts (the toggle button). */
  protected selectPart(el: HTMLElement): void {
    if (el instanceof HTMLInputElement) el.select();
  }

  protected renderGroupParts(group: string) {
    const parts = this.getFormatParts();
    const multiGroup = this.groups.length > 1;

    return repeat(
      parts,
      (part: Intl.DateTimeFormatPart) => (multiGroup ? `${group}-${part.type}` : part.type),
      (part: Intl.DateTimeFormatPart, index: number) => {
        if (part.type === 'literal') {
          return this.renderLiteral(part);
        }

        const descriptor = this.getPartDescriptor(part.type);
        if (!descriptor) return '';

        const tabIndex = group === this.groups[0] && index === 0 ? 0 : -1;
        return this.renderPartInput(group, descriptor, tabIndex);
      },
    );
  }

  protected renderPartInput(
    group: string,
    descriptor: DateTimePartDescriptor,
    tabIndex: number,
  ): TemplateResult {
    const block = this.inputBlockClass;
    const type = descriptor.type;

    if (descriptor.kind === 'dayPeriod') {
      return this.renderDayPeriodToggle(group, descriptor, tabIndex);
    }

    const modifierClass = type === 'year' ? `gui-parts__year ${block}__year` : '';

    return html`
      <div class="gui-parts__touch-target ${block}__touch-target">
        <input
          type="text"
          inputmode="numeric"
          class="gui-parts__part ${block}__part ${modifierClass}"
          data-type=${type}
          data-group=${this.groups.length > 1 ? group : nothing}
          maxlength=${descriptor.maxLength}
          placeholder=${descriptor.placeholder}
          tabindex=${tabIndex}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          autocomplete="off"
          .value=${live(this.getPartDisplayValue(group, type))}
          @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, group, type)}
          @keyup=${(e: KeyboardEvent) => this.handleKeyUp(e, group, type)}
          @focus=${this.handleFocus}
          @blur=${(e: FocusEvent) => this.handleBlur(e, group, type)}
          @change=${(e: Event) => this.handleChange(e, group, type)}
        />
        <div class="gui-parts__visual-underline ${block}__visual-underline"></div>
      </div>
    `;
  }

  /** Accessible name for the dayPeriod toggle. English default like other aria labels. */
  protected dayPeriodAriaLabel(): string {
    return 'AM/PM';
  }

  /**
   * The dayPeriod part is a toggle button, not a free-text input: clicking it
   * (or Enter/Space natively) swaps AM and PM. A typed shortcut cannot work
   * across locales (e.g. Japanese 午前/午後 share their first character) and
   * mobile keyboards have no arrow keys, so the switch interaction is the one
   * that works everywhere.
   */
  protected renderDayPeriodToggle(
    group: string,
    descriptor: DateTimePartDescriptor,
    tabIndex: number,
  ): TemplateResult {
    const block = this.inputBlockClass;
    const type = descriptor.type;

    return html`
      <div class="gui-parts__touch-target ${block}__touch-target">
        <button
          type="button"
          class="gui-parts__part gui-parts__dayperiod ${block}__part ${block}__dayperiod"
          data-type=${type}
          data-group=${this.groups.length > 1 ? group : nothing}
          tabindex=${tabIndex}
          ?disabled=${this.disabled}
          aria-label=${this.dayPeriodAriaLabel()}
          @click=${() => this.toggleDayPeriod(group, type)}
          @keyup=${(e: KeyboardEvent) => this.handleKeyUp(e, group, type)}
          @focus=${this.handleFocus}
          @blur=${(e: FocusEvent) => this.handleBlur(e, group, type)}
        >
          ${this.getPartDisplayValue(group, type)}
        </button>
        <div class="gui-parts__visual-underline ${block}__visual-underline"></div>
      </div>
    `;
  }

  protected toggleDayPeriod(group: string, type: DateTimePartType): void {
    if (this.readOnly || this.disabled) return;
    const current = this.getPartValue(group, type);
    this.setPartValue(group, type, current === 'am' ? 'pm' : 'am');
    this.commitParts(group);
  }

  protected handleKeyDown(event: KeyboardEvent, _group: string, _type: DateTimePartType) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Enter',
    ];

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey || this.readOnly) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  protected handleFocus(event: FocusEvent) {
    this.dispatchEvent(new CustomEvent('focus', { detail: event }));
  }

  protected handleKeyUp(event: KeyboardEvent, group: string, type: DateTimePartType) {
    if (this.readOnly) return;

    const isRTL = window.getComputedStyle(this).direction === 'rtl';
    const target = event.target as HTMLElement;
    const input = target as HTMLInputElement;
    const inputs = this.getGroupInputs(group);
    const index = inputs.indexOf(target);
    const descriptor = this.getPartDescriptor(type);

    // Jump to the next part when an input is filled
    if (
      target instanceof HTMLInputElement &&
      input.value.length === input.maxLength &&
      /^[0-9]$/.test(event.key)
    ) {
      if (index === inputs.length - 1) {
        this.autoAdvanceFromGroupEnd(group);
      } else {
        inputs[index + 1].focus();
      }
    }

    switch (event.key) {
      case 'Enter': {
        this.onEnter(event, group);
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        // The dayPeriod toggle only changes with Enter/Space key press
        if (descriptor?.kind === 'dayPeriod') break;

        const step = descriptor?.step ?? 1;
        const fallback = descriptor?.incrementFallback ?? 1;
        const delta = event.key === 'ArrowUp' ? step : -step;
        const parsed = parseInt(input.value, 10);
        let value = isNaN(parsed) ? fallback : parsed + delta;
        if (descriptor?.wrap && !isNaN(parsed)) {
          const range = descriptor.max - descriptor.min + 1;
          value = ((((value - descriptor.min) % range) + range) % range) + descriptor.min;
        }
        this.setPartValue(group, type, value.toString().padStart(descriptor?.maxLength ?? 2, '0'));
        this.selectPart(target);
        this.commitParts(group);
        break;
      }
      case 'ArrowLeft': {
        const prevIdx = isRTL ? index + 1 : index - 1;
        if (prevIdx >= 0 && prevIdx < inputs.length) {
          inputs[prevIdx].focus();
          this.selectPart(inputs[prevIdx]);
        } else {
          this.navigatePastGroupEdge('ArrowLeft', group, isRTL);
        }
        break;
      }
      case 'ArrowRight': {
        const nextIdx = isRTL ? index - 1 : index + 1;
        if (nextIdx >= 0 && nextIdx < inputs.length) {
          inputs[nextIdx].focus();
          this.selectPart(inputs[nextIdx]);
        } else {
          this.navigatePastGroupEdge('ArrowRight', group, isRTL);
        }
        break;
      }
    }
  }

  protected handleChange(event: Event, group: string, type: DateTimePartType) {
    event.stopImmediatePropagation();

    if (this.readOnly) return;

    const descriptor = this.getPartDescriptor(type);
    if (descriptor?.kind === 'dayPeriod') return;

    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    this.setPartValue(group, type, val);
    this.commitParts(group);
  }

  protected handleBlur(event: FocusEvent, group: string, type: DateTimePartType) {
    const descriptor = this.getPartDescriptor(type);

    if (descriptor?.kind !== 'dayPeriod') {
      const input = event.target as HTMLInputElement;
      const val = parseInt(input.value, 10);

      // 0 is a valid value for zero-based parts (minute, 24h hour) but marks
      // an empty/cleared part everywhere else (day, month, year, 12h hour)
      if (!isNaN(val) && (val > 0 || descriptor?.min === 0)) {
        input.value = val.toString().padStart(descriptor?.maxLength ?? 2, '0');
      } else {
        this.onEmptyPartBlur();
      }
    }

    this.dispatchEvent(new CustomEvent('blur'));
  }
}
