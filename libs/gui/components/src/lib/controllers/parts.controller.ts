import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import {
  clearGroup as clearGroupValues,
  getPart as getPartValue,
  incrementPartValue,
  isDigitKey,
  seedDayPeriods as seedDayPeriodValues,
  setPart as setPartValue,
  shouldPreventPartKeyDown,
  type DateTimePartDescriptor,
  type DateTimePartType,
  type GroupWriteBacks,
  type PartValues,
} from '../utils/parts';
import { parseISODateString } from '../utils/date';
import {
  from24Hour,
  parseISODateTimeString,
  parseISOTimeString,
  type HourFormat,
} from '../utils/time';

export type GUIPartsHost = ReactiveControllerHost & HTMLElement;

/** The ISO shapes {@link GUIPartsController.setGroupFromISO} can seed from. */
export type GroupSeedShape = 'date' | 'time' | 'dateTime';

export interface GUIPartsControllerOptions {
  /** BEM block class of the segmented input. */
  blockClass: string;
  /** The part groups, e.g. `['default']` or `['start', 'end']`. */
  groups: readonly string[];
  /** Descriptor lookup by part type. */
  getDescriptor(type: string): DateTimePartDescriptor | undefined;
  /**
   * Commits a group's parts: parse, write corrections back, emit events.
   * Called after ArrowUp/ArrowDown increments, input change events and
   * the day-period toggle.
   */
  commitGroup(group: string): void;
  /** The effective parts-readonly state. */
  isReadonly(): boolean;
  /** The disabled state. */
  isDisabled(): boolean;
  /**
   * Called from {@link GUIPartsController.handleBlur} when a numeric part is
   * blurred while empty/invalid (NaN, or 0 on a part whose minimum is not 0).
   * REQUIRED so each host states its policy explicitly:
   * - In scalar inputs dispatch a change carrying null.
   * - In range inputs an empty part never commits a null value.
   */
  onEmptyPartBlur(): void;
  /** Enter keyup hook. Omitted: no-op. */
  onEnter?(event: KeyboardEvent, group: string): void;
  /** Accessor for the effective hour format. */
  getHourFormat?(): HourFormat;
  /** Locale day-period labels. */
  getDayPeriodLabels?(): { am: string; pm: string };
  /**
   * Dispatches a surfaced `inputError`
   * Required by hosts that call {@link GUIPartsController.surfaceInputError}.
   */
  onInputErrorSurfaced?(message: string): void;
  /**
   * Dispatches the `change` echo that clears a previously-surfaced `inputError`
   * Required by hosts that call {@link GUIPartsController.clearSurfacedInputError}.
   */
  onSurfacedErrorCleared?(value: unknown): void;
}

/**
 * Part model, keyboard interaction and segment focus of the segmented date/time inputs.
 */
export class GUIPartsController implements ReactiveController {
  private host: GUIPartsHost;
  private options: GUIPartsControllerOptions;

  private _values: PartValues = {};
  private _hasSurfacedInputError = false;

  constructor(host: GUIPartsHost, options: GUIPartsControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // templates bind the handlers per part input.
  }

  get values(): PartValues {
    return this._values;
  }

  getPart(group: string, type: DateTimePartType): string {
    return getPartValue(this._values, group, type);
  }

  setPart(group: string, type: DateTimePartType, value: string): void {
    this._values = setPartValue(this._values, group, type, value);
    this.host.requestUpdate();
  }

  clearGroup(group: string): void {
    this._values = clearGroupValues(this._values, group);
    this.host.requestUpdate();
  }

  /** Writes clamp corrections back into the state. */
  applyWriteBacks(group: string, writeBacks: GroupWriteBacks): void {
    for (const [type, value] of Object.entries(writeBacks)) {
      if (value !== undefined) this.setPart(group, type as DateTimePartType, value);
    }
  }

  /**
   * Seeds each group's day-period toggle to 'am' when the effective format is
   * 12h (the twins' seedDayPeriods). Requests an update only when something
   * was actually seeded, matching the conditional setPartValue calls.
   *
   * @param {readonly string[]} [groups] - The groups to seed; defaults to all.
   */
  seedDayPeriods(groups: readonly string[] = this.options.groups): void {
    this.seedWith(groups, this.options.getHourFormat?.() ?? '24');
  }

  private seedWith(groups: readonly string[], hourFormat: HourFormat): void {
    const next = seedDayPeriodValues(this._values, groups, hourFormat);
    if (next !== this._values) {
      this._values = next;
      this.host.requestUpdate();
    }
  }

  /**
   * Seeds a group's parts from an ISO value; a null/empty value clears the
   * group (re-seeding its day period for time-aware shapes) and an
   * unparseable one leaves the state untouched.
   *
   * @param {string} group - The group to seed.
   * @param {string | null} iso - The ISO value, or null/'' to clear.
   * @param {GroupSeedShape} shape - Which parts the value carries.
   * @param {HourFormat} [hourFormat] - The effective hour format; defaults to
   *   the `getHourFormat` option (then '24').
   */
  setGroupFromISO(
    group: string,
    iso: string | null,
    shape: GroupSeedShape,
    hourFormat?: HourFormat,
  ): void {
    const format = hourFormat ?? this.options.getHourFormat?.() ?? '24';

    if (!iso) {
      this.clearGroup(group);
      if (shape !== 'date') this.seedWith([group], format);
      return;
    }

    if (shape === 'date') {
      const date = parseISODateString(iso);
      if (isNaN(date.getTime())) return;
      this.setPart(group, 'year', String(date.getFullYear()).padStart(4, '0'));
      this.setPart(group, 'month', String(date.getMonth() + 1).padStart(2, '0'));
      this.setPart(group, 'day', String(date.getDate()).padStart(2, '0'));
      return;
    }

    if (shape === 'time') {
      let time = parseISOTimeString(iso);
      if (!time) {
        const date = parseISODateTimeString(iso);
        if (isNaN(date.getTime())) return;
        time = { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() };
      }
      this.writeTimeParts(group, time.hours, time.minutes, format);
      return;
    }

    const date = parseISODateTimeString(iso);
    if (isNaN(date.getTime())) return;
    this.setPart(group, 'day', String(date.getDate()).padStart(2, '0'));
    this.setPart(group, 'month', String(date.getMonth() + 1).padStart(2, '0'));
    this.setPart(group, 'year', String(date.getFullYear()).padStart(4, '0'));
    this.writeTimeParts(group, date.getHours(), date.getMinutes(), format);
  }

  private writeTimeParts(
    group: string,
    hour24: number,
    minutes: number,
    hourFormat: HourFormat,
  ): void {
    if (hourFormat === '12') {
      const { hour12, period } = from24Hour(hour24);
      this.setPart(group, 'hour', hour12.toString().padStart(2, '0'));
      this.setPart(group, 'dayPeriod', period);
    } else {
      this.setPart(group, 'hour', hour24.toString().padStart(2, '0'));
    }
    this.setPart(group, 'minute', minutes.toString().padStart(2, '0'));
  }

  /** Value shown inside a part input. */
  getPartDisplay = (group: string, type: DateTimePartType): string => {
    const value = this.getPart(group, type);
    if (type === 'dayPeriod' && (value === 'am' || value === 'pm')) {
      const labels = this.options.getDayPeriodLabels?.();
      if (labels) return labels[value];
    }
    return value;
  };

  /**
   * Focusable part elements of a group in DOM order. Numeric parts are
   * inputs; dayPeriod parts are toggle buttons.
   */
  getGroupInputs(group: string): HTMLElement[] {
    return this.options.groups.length > 1
      ? Array.from(this.host.querySelectorAll<HTMLElement>(`[data-group="${group}"]`))
      : Array.from(this.host.querySelectorAll<HTMLElement>(`.${this.options.blockClass}__part`));
  }

  /** Selects an input's text; a no-op for non-input parts (the toggle button). */
  selectPart(el: HTMLElement): void {
    if (el instanceof HTMLInputElement) el.select();
  }

  focusFirst(group: string): void {
    requestAnimationFrame(() => {
      this.getGroupInputs(group)[0]?.focus();
    });
  }

  /**
   * We allow here editing/navigation keys, ctrl/meta chords and readonly parts
   * pass through; any other non-digit key is prevented.
   */
  handleKeyDown = (event: KeyboardEvent, group: string, type: DateTimePartType): void => {
    if (event.key === 'Enter' && this.options.onEnter) {
      event.preventDefault();

      if (event.target instanceof HTMLInputElement) {
        this.setPart(group, type, event.target.value.replace(/[^0-9]/g, ''));
      }
    }

    if (shouldPreventPartKeyDown(event, this.options.isReadonly())) {
      event.preventDefault();
    }
  };

  /**
   * Keydown for the dayPeriod `<button>`, which -- unlike the numeric parts --
   * has native activation semantics we have to suppress:
   *
   * - Enter activates a button on keydown, which would toggle AM/PM. We block
   *   it so Enter is free to mean "commit" (the keyup still fires, so
   *   {@link handleKeyUp} routes it to `onEnter`). Space is left alone and
   *   keeps toggling natively on keyup.
   * - ArrowUp/Down scroll the page on a focused button. We block that; the
   *   toggle itself happens on keyup, so holding the key does not rapid-cycle.
   */
  handleDayPeriodKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  /** Re-dispatches focus as the host's `focus` CustomEvent (handleFocus). */
  handleFocus = (event: FocusEvent): void => {
    this.host.dispatchEvent(new CustomEvent('focus', { detail: event }));
  };

  /**
   * The keyup pipeline:
   * - auto-advance when a digit fills a segment to its maxlength
   * - Enter -> onEnter
   * - ArrowUp/Down increment via `incrementPartValue`, re-select and commit
   * - ArrowLeft/Right move by VISUAL position, handles the LTR/RTL
   */
  handleKeyUp = (event: KeyboardEvent, group: string, type: DateTimePartType): void => {
    if (this.options.isReadonly()) return;

    const isRTL = window.getComputedStyle(this.host).direction === 'rtl';
    const target = event.target as HTMLElement;
    const input = target as HTMLInputElement;
    const inputs = this.getGroupInputs(group);
    const index = inputs.indexOf(target);
    const descriptor = this.options.getDescriptor(type);

    // Jump to the next part when an input is filled
    if (
      target instanceof HTMLInputElement &&
      input.value.length === input.maxLength &&
      isDigitKey(event.key)
    ) {
      if (index === inputs.length - 1) {
        this.autoAdvanceFromGroupEnd(group);
      } else {
        inputs[index + 1].focus();
      }
    }

    switch (event.key) {
      case 'Enter': {
        this.options.onEnter?.(event, group);
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        if (descriptor?.kind === 'dayPeriod') {
          this.toggleDayPeriod(group, type);
          break;
        }

        const next = incrementPartValue(
          descriptor,
          input.value,
          event.key === 'ArrowUp' ? 'up' : 'down',
        );
        this.setPart(group, type, next);
        this.selectPart(target);
        this.options.commitGroup(group);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const visualOrder = [...inputs].sort(
          (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left,
        );
        const visualIndex = visualOrder.indexOf(target);
        const nextIdx = event.key === 'ArrowRight' ? visualIndex + 1 : visualIndex - 1;
        if (nextIdx >= 0 && nextIdx < visualOrder.length) {
          visualOrder[nextIdx].focus();
          this.selectPart(visualOrder[nextIdx]);
        } else {
          this.navigatePastGroupEdge(event.key, group, isRTL);
        }
        break;
      }
    }
  };

  /**
   * Sanitize-and-commit on change: strips non-digits, stores the value and commits.
   * Always stops immediate propagation so the native change never escapes the widget.
   */
  handleChange = (event: Event, group: string, type: DateTimePartType): void => {
    event.stopImmediatePropagation();

    if (this.options.isReadonly()) return;

    const descriptor = this.options.getDescriptor(type);
    if (descriptor?.kind === 'dayPeriod') return;

    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    this.setPart(group, type, val);
    this.options.commitGroup(group);
  };

  /**
   * Blur handling:
   * - zero-pads a valid numeric part in the DOM
   * - routes an empty/invalid part to `onEmptyPartBlur`
   * - always dispatches the host's `blur` CustomEvent.
   */
  handleBlur = (event: FocusEvent, _group: string, type: DateTimePartType): void => {
    const descriptor = this.options.getDescriptor(type);

    if (descriptor?.kind !== 'dayPeriod') {
      const input = event.target as HTMLInputElement;
      const val = parseInt(input.value, 10);

      // 0 is a valid value for zero-based parts (minute, 24h hour) but marks
      // an empty/cleared part everywhere else (day, month, year, 12h hour)
      if (!isNaN(val) && (val > 0 || descriptor?.min === 0)) {
        input.value = val.toString().padStart(descriptor?.maxLength ?? 2, '0');
      } else {
        this.options.onEmptyPartBlur();
      }
    }

    this.host.dispatchEvent(new CustomEvent('blur'));
  };

  /**
   * Swaps the day-period state and commits.
   * An unset period toggles to 'am'. Blocked while readonly or disabled.
   */
  toggleDayPeriod = (group: string, type: DateTimePartType): void => {
    if (this.options.isReadonly() || this.options.isDisabled()) return;
    const current = this.getPart(group, type);
    this.setPart(group, type, current === 'am' ? 'pm' : 'am');
    this.options.commitGroup(group);
  };

  /**
   * Auto-advance past the last input of a group, or into the next
   * group's first input, if it has more than one group (like ranged inputs).
   */
  private autoAdvanceFromGroupEnd(group: string): void {
    const groups = this.options.groups;
    if (groups.length > 1) {
      const nextGroup = groups[groups.indexOf(group) + 1];
      if (nextGroup !== undefined) {
        this.getGroupInputs(nextGroup)[0]?.focus();
      }
      return;
    }
    this.getGroupInputs(group)[0]?.focus();
  }

  /**
   * ArrowLeft/ArrowRight past a group's visual edge.
   */
  private navigatePastGroupEdge(
    key: 'ArrowLeft' | 'ArrowRight',
    group: string,
    isRTL: boolean,
  ): void {
    const groups = this.options.groups;
    if (groups.length <= 1) return;

    const firstGroup = groups[0];
    const lastGroup = groups[groups.length - 1];

    if (key === 'ArrowLeft') {
      const otherGroup = isRTL ? lastGroup : firstGroup;
      if (group !== otherGroup) {
        const otherInputs = this.getGroupInputs(otherGroup);
        const target = otherInputs[otherInputs.length - 1];
        if (target) {
          target.focus();
          this.selectPart(target);
        }
      }
    } else {
      const otherGroup = isRTL ? firstGroup : lastGroup;
      if (group !== otherGroup) {
        const otherInputs = this.getGroupInputs(otherGroup);
        if (otherInputs[0]) {
          otherInputs[0].focus();
          this.selectPart(otherInputs[0]);
        }
      }
    }
  }

  /** Whether an inputError has been surfaced and not yet cleared. */
  get hasSurfacedInputError(): boolean {
    return this._hasSurfacedInputError;
  }

  /**
   * Surfaces an inputError through `onInputErrorSurfaced` and remembers it so
   * it can later be cleared.
   */
  surfaceInputError(message: string): void {
    this._hasSurfacedInputError = true;
    this.options.onInputErrorSurfaced?.(message);
  }

  /**
   * Clears a previously-surfaced inputError by echoing the given (unchanged)
   * value through `onSurfacedErrorCleared`; a no-op when nothing is surfaced.
   */
  clearSurfacedInputError(value: unknown): void {
    if (!this._hasSurfacedInputError) return;
    this._hasSurfacedInputError = false;
    this.options.onSurfacedErrorCleared?.(value);
  }

  resetSurfacedInputError(): void {
    this._hasSurfacedInputError = false;
  }
}
