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
  /**
   * BEM block class of the segmented input (the abstract's `inputBlockClass`),
   * e.g. 'gui-date-input'. Scopes the single-group part query
   * (`.${blockClass}__part`).
   */
  blockClass: string;
  /**
   * The part groups, e.g. `['default']` (scalar inputs) or `['start', 'end']`
   * (range inputs). More than one group switches the DOM queries to
   * `[data-group]` scoping and turns on the built-in group-crossing
   * navigation (auto-advance into the next group, ArrowLeft/ArrowRight
   * jumping between the first and last group in visual order).
   */
  groups: readonly string[];
  /** Descriptor lookup by part type (the abstract's `getPartDescriptor`). */
  getDescriptor(type: string): DateTimePartDescriptor | undefined;
  /**
   * Commits a group's parts (the abstract's `commitParts`): parse, write
   * corrections back, emit events. Called after ArrowUp/ArrowDown increments,
   * input change events and the day-period toggle.
   */
  commitGroup(group: string): void;
  /**
   * The effective parts-readonly state (the abstract's `partsReadonly`
   * getter) — e.g. `!!readOnly` for most inputs, `!!readOnly ||
   * allowCustomTime === false` for gui-range-time.
   */
  isReadonly(): boolean;
  /** The disabled state; blocks the day-period toggle like the abstract. */
  isDisabled(): boolean;
  /**
   * Called from {@link GUIPartsController.handleBlur} when a numeric part is
   * blurred while empty/invalid (NaN, or 0 on a part whose minimum is not 0).
   * REQUIRED so each host states its policy explicitly:
   * - Scalar inputs (the abstract's default, abstract-date-time-input.ts
   *   172-174): dispatch a change carrying null —
   *   `() => this.dispatchEvent(new CustomEvent('change', { detail: { value: null }, bubbles: true }))`
   * - Range inputs: `() => {}` — an empty part never commits a null value.
   */
  onEmptyPartBlur(): void;
  /** Enter keyup hook (the abstract's `onEnter`). Omitted: no-op. */
  onEnter?(event: KeyboardEvent, group: string): void;
  /**
   * Accessor for the effective hour format. Consulted by
   * {@link GUIPartsController.seedDayPeriods} and (as the default) by
   * {@link GUIPartsController.setGroupFromISO} for the 12h hour/dayPeriod
   * seeding. Omit for date-only inputs — the default '24' makes day-period
   * seeding a no-op.
   */
  getHourFormat?(): HourFormat;
  /**
   * Locale day-period labels, used by
   * {@link GUIPartsController.getPartDisplay} to map the canonical 'am'/'pm'
   * state to its display label (the time twins' `getPartDisplayValue`
   * override). Omit to display the raw stored value (the abstract base's
   * default, used by date-only inputs).
   */
  getDayPeriodLabels?(): { am: string; pm: string };
  /**
   * Dispatches a surfaced `inputError` (event dispatch stays with the host):
   * `(message) => this.dispatchEvent(new CustomEvent('inputError', { detail: { message }, bubbles: true }))`
   * Required by hosts that call {@link GUIPartsController.surfaceInputError}.
   */
  onInputErrorSurfaced?(message: string): void;
  /**
   * Dispatches the `change` echo that clears a previously-surfaced
   * `inputError` (abstract-date-time-input.ts 245-251):
   * `(value) => this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }))`
   * Required by hosts that call
   * {@link GUIPartsController.clearSurfacedInputError}.
   */
  onSurfacedErrorCleared?(value: unknown): void;
}

/**
 * Part model, keyboard interaction and segment focus of the segmented
 * date/time inputs, extracted from `AbstractDateTimeInput` (and the value
 * seeding of its two subclass twins) as a reactive controller. The host keeps
 * its properties, rendering (via `utils/part-templates.ts`) and event
 * emission; the controller owns:
 *
 * - The per-group part values (immutable updates via `utils/parts.ts`, each
 *   write followed by `host.requestUpdate()` — matching the abstract's Lit
 *   `@state` reassignment).
 * - The keyboard pipeline: digit gating on keydown; auto-advance, arrow
 *   increment (step/wrap/fallback via `incrementPartValue`), visual-order
 *   ArrowLeft/ArrowRight navigation and Enter on keyup; sanitize-and-commit
 *   on change; zero-padding plus the empty-part policy on blur.
 * - Group crossing, built in when `options.groups.length > 1`: auto-advance
 *   from the end of a group into the next group's first input, and
 *   ArrowLeft/ArrowRight crossing between the first and last group with the
 *   RTL flip — reproducing the identical `autoAdvanceFromGroupEnd` /
 *   `navigatePastGroupEdge` overrides of the three range inputs. With a
 *   single group the abstract's defaults apply: auto-advance wraps to the
 *   group's first input and arrow navigation stops at the edges.
 * - The day-period state flip (`toggleDayPeriod`) — the toggle button itself
 *   is host-rendered.
 * - The surfaced-inputError flag (`_hasSurfacedInputError` semantics), with
 *   the actual event dispatch delegated to host callbacks.
 *
 * Port fidelity notes:
 * - `setGroupFromISO` unifies `date-input.parseValue`,
 *   `range-date-input.writeGroupDate`, `AbstractTimePartsInput.setGroupTime`
 *   and `AbstractDateTimePartsInput.setGroupDateTime`. The year is always
 *   written `padStart(4, '0')` (the `writeGroupDate` form); the other three
 *   used a bare `toString()`, which differs only for years below 1000 — under
 *   the year descriptor's minimum, so unreachable through committed values.
 * - The 'focus' re-dispatch (`CustomEvent('focus', { detail })`) and the
 *   unconditional `CustomEvent('blur')` are identical across all six inputs
 *   and carry no widget value, so the controller dispatches them on the host
 *   directly; value-carrying events stay behind the option callbacks.
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

  /** No lifecycle work; present so the class satisfies ReactiveController. */
  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // templates bind the handlers per part input.
  }

  /** The current part-values state (copy-on-write; safe to hold snapshots). */
  get values(): PartValues {
    return this._values;
  }

  // --- Part model ---

  /** A part's raw stored value; '' when unset (the abstract's getPartValue). */
  getPart(group: string, type: DateTimePartType): string {
    return getPartValue(this._values, group, type);
  }

  /** Stores a part value and requests a host update (setPartValue). */
  setPart(group: string, type: DateTimePartType, value: string): void {
    this._values = setPartValue(this._values, group, type, value);
    this.host.requestUpdate();
  }

  /** Resets a group's parts to an empty record (the abstract's clearGroup). */
  clearGroup(group: string): void {
    this._values = clearGroupValues(this._values, group);
    this.host.requestUpdate();
  }

  /** Writes a parse pipeline's clamp corrections back into the state. */
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
   * unparseable one leaves the state untouched. Unifies:
   * - 'date': `date-input.parseValue` / `range-date-input.writeGroupDate` —
   *   day/month from `parseISODateString`, year padded to 4.
   * - 'time': `AbstractTimePartsInput.setGroupTime` — an ISO time, or the
   *   time-of-day of a full ISO date-time; 12h splits into hour + dayPeriod.
   * - 'dateTime': `AbstractDateTimePartsInput.setGroupDateTime` — all parts
   *   from `parseISODateTimeString`.
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

  /**
   * Value shown inside a part input (the abstract's getPartDisplayValue):
   * the stored value, with a canonical 'am'/'pm' day period mapped to its
   * locale label when `getDayPeriodLabels` is provided. Arrow fn so templates
   * can pass it as the display accessor directly.
   */
  getPartDisplay = (group: string, type: DateTimePartType): string => {
    const value = this.getPart(group, type);
    if (type === 'dayPeriod' && (value === 'am' || value === 'pm')) {
      const labels = this.options.getDayPeriodLabels?.();
      if (labels) return labels[value];
    }
    return value;
  };

  // --- Segment focus ---

  /**
   * Focusable part elements of a group in DOM order. Numeric parts are
   * inputs; dayPeriod parts are toggle buttons — both carry the __part class.
   */
  getGroupInputs(group: string): HTMLElement[] {
    return this.options.groups.length > 1
      ? Array.from(this.host.querySelectorAll<HTMLElement>(`[data-group="${group}"]`))
      : Array.from(
          this.host.querySelectorAll<HTMLElement>(`.${this.options.blockClass}__part`),
        );
  }

  /** Selects an input's text; a no-op for non-input parts (the toggle button). */
  selectPart(el: HTMLElement): void {
    if (el instanceof HTMLInputElement) el.select();
  }

  /**
   * Focuses a group's first part on the next animation frame — the deferral
   * the three range inputs use after a pill commit, so focus lands once the
   * cleared parts have re-rendered.
   */
  focusFirst(group: string): void {
    requestAnimationFrame(() => {
      this.getGroupInputs(group)[0]?.focus();
    });
  }

  // --- Keyboard pipeline ---

  /**
   * Digit gating (the abstract's handleKeyDown): editing/navigation keys,
   * ctrl/meta chords and readonly parts pass through; any other non-digit key
   * is prevented.
   */
  handleKeyDown = (event: KeyboardEvent, _group: string, _type: DateTimePartType): void => {
    if (shouldPreventPartKeyDown(event, this.options.isReadonly())) {
      event.preventDefault();
    }
  };

  /** Re-dispatches focus as the host's `focus` CustomEvent (handleFocus). */
  handleFocus = (event: FocusEvent): void => {
    this.host.dispatchEvent(new CustomEvent('focus', { detail: event }));
  };

  /**
   * The keyup pipeline (the abstract's handleKeyUp): auto-advance when a
   * digit fills a segment to its maxlength; Enter -> onEnter; ArrowUp/Down
   * increment via `incrementPartValue`, re-select and commit; ArrowLeft/Right
   * move by VISUAL position — the `getBoundingClientRect().left` sort handles
   * the LTR time cluster inside an RTL row, where DOM order alone cannot tell
   * which part is adjacent.
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
        // The dayPeriod toggle only changes with Enter/Space key press
        if (descriptor?.kind === 'dayPeriod') break;

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
   * Sanitize-and-commit on change (the abstract's handleChange): strips
   * non-digits, stores the value and commits. Always stops immediate
   * propagation so the native change never escapes the widget.
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
   * Blur handling (the abstract's handleBlur): zero-pads a valid numeric part
   * in the DOM, routes an empty/invalid part to `onEmptyPartBlur`, and always
   * dispatches the host's `blur` CustomEvent.
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
   * Swaps the day-period state and commits (the abstract's toggleDayPeriod).
   * An unset period toggles to 'am'. Blocked while readonly or disabled.
   */
  toggleDayPeriod = (group: string, type: DateTimePartType): void => {
    if (this.options.isReadonly() || this.options.isDisabled()) return;
    const current = this.getPart(group, type);
    this.setPart(group, type, current === 'am' ? 'pm' : 'am');
    this.options.commitGroup(group);
  };

  // --- Group-crossing navigation ---

  /**
   * Auto-advance past the last input of a group. Multi-group: into the next
   * group's first input, nowhere after the last group (the three range
   * inputs' identical overrides). Single group: wrap to the group's first
   * input (the abstract's default).
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
   * ArrowLeft/ArrowRight past a group's visual edge. Single group: stop at
   * the edge (the abstract's default no-op). Multi-group (the range inputs'
   * identical overrides): ArrowLeft targets the last input of the first group
   * (in RTL, of the last group), ArrowRight the first input of the last group
   * (in RTL, of the first group) — a no-op when already in the target group.
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

  // --- Surfaced inputError flow ---

  /** Whether an inputError has been surfaced and not yet cleared. */
  get hasSurfacedInputError(): boolean {
    return this._hasSurfacedInputError;
  }

  /**
   * Surfaces an inputError through `onInputErrorSurfaced` and remembers it so
   * it can later be cleared (the abstract's surfaceInputError).
   */
  surfaceInputError(message: string): void {
    this._hasSurfacedInputError = true;
    this.options.onInputErrorSurfaced?.(message);
  }

  /**
   * Clears a previously-surfaced inputError by echoing the given (unchanged)
   * value through `onSurfacedErrorCleared`; a no-op when nothing is surfaced
   * (the abstract's clearSurfacedInputError).
   */
  clearSurfacedInputError(value: unknown): void {
    if (!this._hasSurfacedInputError) return;
    this._hasSurfacedInputError = false;
    this.options.onSurfacedErrorCleared?.(value);
  }

  /**
   * Drops the surfaced flag without emitting — for callers that emit their
   * own change (the range inputs' `_hasSurfacedInputError = false` before a
   * commit's change event).
   */
  resetSurfacedInputError(): void {
    this._hasSurfacedInputError = false;
  }
}
