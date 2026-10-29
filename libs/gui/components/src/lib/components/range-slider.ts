import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { cspStyleMap, safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { type GuiValidity } from '../gui-form-control';
import { dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { requiredName } from '../utils/messages';
import { isRealNumber } from '../utils/numeric';
import { type GuiSliderRange, percentOf, snapToStep } from '../utils/slider';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { GuiSliderBase } from './slider-base';

type Thumb = 'start' | 'end';

/**
 * A slider with two thumbs, to pick a range: a low and a high value, such as a price range. Its
 * value is `{ start, end }`. The thumbs can meet but not cross, and a press on the track moves the
 * nearer one there.
 *
 * Each thumb is named by the label and then its own name, as "Price Minimum" and "Price Maximum";
 * the "Minimum" and "Maximum" strings translate through `configureMessages`.
 *
 * Until the user moves a thumb, or `value` is set, it has no value: the thumbs rest at the ends,
 * the value shows as "–", and screen readers hear "Not set". A key or a press that leaves a thumb
 * at its end then picks the whole range, from `minimum` to `maximum`.
 *
 * ```html
 * <gui-range-slider label="Price" minimum="0" maximum="500" step="10"></gui-range-slider>
 * ```
 *
 * @fires gui-input - The user moved a thumb. `detail.value` is the new `{ start, end }`.
 * @fires gui-change - The user let go of a thumb, or moved it with a key. `detail.value` is the
 *   range.
 * @fires gui-blur - Focus left the range slider: not when it moves from one thumb to the other.
 */
export class GuiRangeSlider extends GuiSliderBase {
  /** The range, or `undefined` before the user picks one. */
  @property({ type: Object }) value: GuiSliderRange | undefined = undefined;
  /** The name of the low thumb, after the label. Defaults to "Minimum". */
  @property({ type: String, attribute: 'start-label' }) startLabel: string | undefined = undefined;
  /** The name of the high thumb, after the label. Defaults to "Maximum". */
  @property({ type: String, attribute: 'end-label' }) endLabel: string | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id^="${this.uid}_"].gui-slider__input`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  /** The range, or `undefined` unless both ends are numbers. */
  private get range(): GuiSliderRange | undefined {
    const value = this.value;
    return value && isRealNumber(value.start) && isRealNumber(value.end) ? value : undefined;
  }

  /** Where each thumb sits: on the range, or at the ends without one. */
  private get positions(): GuiSliderRange {
    const { min, max, step } = this.bounds;
    const range = this.range;
    if (!range) return { start: min, end: max };
    const start = snapToStep(Math.min(range.start, range.end), min, max, step);
    const end = snapToStep(Math.max(range.start, range.end), min, max, step);
    return { start, end };
  }

  override render() {
    super.render();
    const { min, max, step } = this.bounds;
    const range = this.range;
    const empty = range === undefined;
    const positions = this.positions;
    const percents = {
      start: percentOf(positions.start, min, max),
      end: percentOf(positions.end, min, max),
    };
    const texts = {
      start: empty ? '–' : this.formatValue(range.start),
      end: empty ? '–' : this.formatValue(range.end),
    };
    const labelText = empty ? '–' : `${texts.start} – ${texts.end}`;

    const templateData: ControlTemplateData<GuiSliderRange> & { hint?: string } = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: range,
    };

    const thumb = (which: Thumb) =>
      html`<input
          type="range"
          id=${`${this.uid}_${which}`}
          data-cy=${`${this.uid}_slider_${which}`}
          class="gui-slider__input"
          min=${min}
          max=${max}
          step=${step}
          .value=${live(String(positions[which]))}
          ?disabled=${this.disabled}
          aria-labelledby=${[this.label ? `${this.uid}_label` : '', `${this.uid}_${which}_name`]
            .filter(Boolean)
            .join(' ')}
          aria-valuetext=${this.valueText(empty ? undefined : range[which])}
          @input=${(event: Event) => this.onInput(event, which)}
          @change=${this.onChange}
          @keydown=${this.onKeydown}
          @pointerdown=${this.onPointerDown}
          @blur=${this.onBlur}
        />
        ${this.bubble(texts[which], percents[which])}
        <span class="gui-visually-hidden" id=${`${this.uid}_${which}_name`}
          >${which === 'start'
            ? requiredName('minimum', this.startLabel)
            : requiredName('maximum', this.endLabel)}</span
        >`;

    return html`
      ${addLabel(this.uid, templateData, false, undefined, false, this.labelValue(labelText))}

      <div class="gui-widget">
        <div
          class="${this.controlClasses(empty)} gui-slider__control--range"
          @pointerdown=${this.onTrackPointerDown}
        >
          <div class="gui-slider__rail" aria-hidden="true">
            <span
              class="gui-slider__fill"
              style=${cspStyleMap({
                '--_start': empty ? 0 : percents.start,
                '--_end': empty ? 0 : percents.end,
              })}
            ></span>
          </div>
          ${this.ticks(empty ? { start: -1, end: -1 } : percents)} ${thumb('start')} ${thumb('end')}
        </div>
      </div>

      ${this.footer(addErrors(this.uid, templateData))}
    `;
  }

  protected override validate(): GuiValidity | null {
    const range = this.range;
    return (
      this.boundsError(range?.start) ??
      this.boundsError(range?.end) ??
      this.stepError(range?.start) ??
      this.stepError(range?.end) ??
      super.validate()
    );
  }

  protected override get empty(): boolean {
    return this.range === undefined;
  }

  protected override pick(input: HTMLInputElement) {
    const which: Thumb = input.id === `${this.uid}_start` ? 'start' : 'end';
    this.setThumb(which, Number(input.value), true);
  }

  /** The thumb the browser points at for an invalid value. */
  protected override validationAnchor(): HTMLElement | undefined {
    return this.querySelector<HTMLElement>(`input[id="${this.uid}_start"]`) ?? undefined;
  }

  /** A thumb moved: it stops at the other one rather than cross it. */
  private onInput(event: Event, which: Thumb) {
    event.stopPropagation();
    if (this.readOnly) return;
    const input = event.target as HTMLInputElement;
    const positions = this.positions;
    let moved = Number(input.value);
    if (which === 'start' && moved > positions.end) moved = positions.end;
    if (which === 'end' && moved < positions.start) moved = positions.start;
    input.value = String(moved);
    this.setThumb(which, moved, false);
  }

  /** @internal */
  onChange(event: Event) {
    event.stopPropagation();
    if (this.readOnly) return;
    dispatchChange(this, this.value);
  }

  private setThumb(which: Thumb, value: number, commit: boolean) {
    const next = { ...this.positions, [which]: value };
    this.value = next;
    dispatchValue(this, next, { commit });
  }

  /**
   * A press on the track, away from the thumbs (which take only their own presses), moves the
   * nearer thumb there and focuses it.
   */
  private onTrackPointerDown = (event: PointerEvent) => {
    if (this.disabled || this.readOnly || event.button !== 0) return;
    if ((event.target as Element).closest('input')) return;
    const rail = this.querySelector<HTMLElement>('.gui-slider__rail');
    if (!rail) return;
    const box = rail.getBoundingClientRect();
    if (!box.width) return;
    const rtl = getComputedStyle(rail).direction === 'rtl';
    const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const { min, max, step } = this.bounds;
    const value = snapToStep(min + (rtl ? 1 - fraction : fraction) * (max - min), min, max, step);

    const positions = this.positions;
    const which: Thumb =
      value <= positions.start
        ? 'start'
        : value >= positions.end
          ? 'end'
          : value - positions.start <= positions.end - value
            ? 'start'
            : 'end';
    event.preventDefault();
    this.querySelector<HTMLInputElement>(`input[id="${this.uid}_${which}"]`)?.focus();
    this.setThumb(which, value, true);
  };
}

/** The events `gui-range-slider` fires, with their types. */
export const GuiRangeSliderEvents = {
  ...valueEvents<GuiRangeSlider['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-slider': GuiRangeSlider;
  }
}

safeDefine('gui-range-slider', GuiRangeSlider);
