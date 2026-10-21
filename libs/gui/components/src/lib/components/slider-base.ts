import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dispatchBlur } from '../utils/events';
import { message } from '../utils/messages';
import { isRealNumber } from '../utils/numeric';
import {
  formatSliderValue,
  type GuiSliderMark,
  type GuiSliderValuePlacement,
  sliderBounds,
  sliderTicks,
} from '../utils/slider';

/** `marks` from an attribute: present for a tick at every step, or a JSON list of marks. */
const marksConverter = {
  fromAttribute(value: string | null): boolean | GuiSliderMark[] | undefined {
    if (value === null || value === 'false') return value === null ? undefined : false;
    if (value === '' || value === 'true') return true;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : true;
    } catch {
      return true;
    }
  },
};

/** The keys that move a native range input. */
const MOVING_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

/**
 * What `gui-slider` and `gui-range-slider` share: the bounds and step, the tick marks, the number
 * format, and where the value shows. Each thumb is a native `<input type="range">`, so the
 * browser gives it the keyboard (arrows, Page Up and Down, Home and End), touch and the slider
 * role; the element formats the value it reads out through `aria-valuetext`.
 *
 * The native inputs carry `min`, `max` and `step`: a range input clamps its value to them, so
 * unlike other inner controls it can never be invalid, and the browser never blocks a submission
 * for it. The element validates its own value.
 */
export abstract class GuiSliderBase extends GuiFormControl {
  /** BCP 47 locale for formatting the value, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The lowest value. Defaults to 0. */
  @property({ type: Number }) minimum: number | undefined = 0;
  /** The highest value. Defaults to 100. */
  @property({ type: Number }) maximum: number | undefined = 100;
  /** The step between values, from `minimum`. Defaults to 1. */
  @property({ type: Number }) step: number | undefined = 1;
  /**
   * Tick marks on the track: `true` for one at every step (up to 101), or a list of values, or of
   * `{ value, label }` with a label under the tick.
   */
  @property({ converter: marksConverter }) marks: boolean | GuiSliderMark[] | undefined = undefined;
  /**
   * How the value reads: `Intl.NumberFormat` options, such as `{ style: 'currency', currency:
   * 'EUR' }` or `{ style: 'percent' }`. Used next to the label, in the bubbles, in the tick labels
   * and for screen readers.
   */
  @property({ type: Object }) format: Intl.NumberFormatOptions | undefined = undefined;
  /**
   * Where the value shows: `label`, at the end of the label's line (the default); `bubble`, over
   * the thumb while it is hovered, focused or dragged; `both`; or `hidden`, for an app that shows
   * it its own way. Screen readers read it from the thumb in every case.
   */
  @property({ type: String, attribute: 'value-placement' }) valuePlacement:
    | GuiSliderValuePlacement
    | undefined = 'label';

  /** Escape hid the bubbles, until the pointer and the focus leave the element. */
  @state() protected bubblesDismissed = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
    this.addEventListener('pointerleave', this.onLeave);
    this.addEventListener('focusout', this.onFocusOut);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerleave', this.onLeave);
    this.removeEventListener('focusout', this.onFocusOut);
  }

  /** The bounds and step, with the native defaults for the missing ones. */
  protected get bounds() {
    return sliderBounds(this.minimum, this.maximum, this.step);
  }

  /** A value as it reads, in the element's locale and format. */
  protected formatValue(value: number): string {
    return formatSliderValue(value, this.localeId, this.format);
  }

  /** What a thumb reads out: its formatted value, or "Not set" before there is one. */
  protected valueText(value: number | undefined): string {
    return value === undefined ? message('notSet') : this.formatValue(value);
  }

  private get placement(): GuiSliderValuePlacement {
    return this.valuePlacement || 'label';
  }

  private get showsBubble(): boolean {
    return this.placement === 'bubble' || this.placement === 'both';
  }

  /** The value at the end of the label's line. Hidden from assistive technology: the thumb reads it. */
  protected labelValue(text: string) {
    if (this.placement !== 'label' && this.placement !== 'both') return nothing;
    return html`<output class="gui-slider__value" aria-hidden="true">${text}</output>`;
  }

  /** A thumb's bubble, the sibling right after its input, which the stylesheet shows on hover and focus. */
  protected bubble(text: string, percent: number) {
    if (!this.showsBubble) return nothing;
    return html`<span
      class="gui-slider__bubble"
      aria-hidden="true"
      style=${cspStyleMap({ '--_percent': percent })}
      >${text}</span
    >`;
  }

  /** The ticks to draw, for the current bounds and `marks`. */
  private get tickList() {
    const { min, max, step } = this.bounds;
    return sliderTicks(this.marks, min, max, step);
  }

  /** The tick marks along the rail, filled between `fill.start` and `fill.end`. Decorative. */
  protected ticks(fill: { start: number; end: number }): TemplateResult | typeof nothing {
    const ticks = this.tickList;
    if (!ticks.length) return nothing;
    return html`<div class="gui-slider__ticks" aria-hidden="true">
      ${ticks.map(
        (tick) =>
          html`<span
            class="gui-slider__tick${tick.percent >= fill.start && tick.percent <= fill.end
              ? ' gui-slider__tick--filled'
              : ''}"
            style=${cspStyleMap({ '--_percent': tick.percent })}
          ></span>`,
      )}
    </div>`;
  }

  /** The labels of the marks that have one, under the control. Decorative: the thumbs read values. */
  protected tickLabels(): TemplateResult | typeof nothing {
    const labelled = this.tickList.filter((tick) => tick.label);
    if (!labelled.length) return nothing;
    return html`<div class="gui-slider__tick-labels" aria-hidden="true">
      ${labelled.map(
        (tick) =>
          html`<span
            class="gui-slider__tick-label${tick.percent === 0
              ? ' gui-slider__tick-label--first'
              : tick.percent === 100
                ? ' gui-slider__tick-label--last'
                : ''}"
            style=${cspStyleMap({ '--_percent': tick.percent })}
            >${tick.label}</span
          >`,
      )}
    </div>`;
  }

  /** The classes of the box that holds the rail, the thumbs and the bubbles. */
  protected controlClasses(empty: boolean): string {
    return [
      'gui-slider__control',
      empty ? 'gui-slider__control--empty' : '',
      this.bubblesDismissed ? 'gui-slider__control--dismissed' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  /** A bounds error for a value set from outside, which the thumbs could not reach. */
  protected boundsError(value: number | undefined): GuiValidity | null {
    if (!isRealNumber(value)) return null;
    const { min, max } = this.bounds;
    if (value < min) {
      return {
        flags: { rangeUnderflow: true },
        message: message('rangeUnderflow', undefined, { min }),
      };
    }
    if (value > max) {
      return {
        flags: { rangeOverflow: true },
        message: message('rangeOverflow', undefined, { max }),
      };
    }
    return null;
  }

  /**
   * A read-only slider stays focusable and readable, but its keys and pointer don't move it: a
   * native range input has no read-only state of its own.
   *
   * @internal
   */
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Escape hides the bubbles (WCAG 1.4.13), and does nothing else: not even close the dialog
      // the slider is in. The next Escape does.
      if (this.showsBubble && !this.bubblesDismissed) {
        event.preventDefault();
        event.stopPropagation();
        this.bubblesDismissed = true;
      }
      return;
    }
    if (this.readOnly && MOVING_KEYS.has(event.key)) event.preventDefault();
  }

  /** @internal */
  onPointerDown(event: PointerEvent) {
    if (this.readOnly) {
      event.preventDefault();
      (event.currentTarget as HTMLElement).focus();
    }
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }

  private onLeave = () => {
    if (!this.contains(document.activeElement)) this.bubblesDismissed = false;
  };

  private onFocusOut = (event: FocusEvent) => {
    if (!this.contains(event.relatedTarget as Node | null)) this.bubblesDismissed = false;
  };
}
