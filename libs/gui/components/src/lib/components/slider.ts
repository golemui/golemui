import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { cspStyleMap, safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { type GuiValidity } from '../gui-form-control';
import { dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { isRealNumber } from '../utils/numeric';
import { percentOf, snapToStep } from '../utils/slider';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { GuiSliderBase } from './slider-base';

/**
 * A slider to pick a number in a range by dragging a thumb, or with the arrow keys, Page Up and
 * Page Down, Home and End.
 *
 * Until the user moves it, or `value` is set, it has no value: the thumb rests at `minimum`, the
 * value shows as "–", and screen readers hear "Not set".
 *
 * ```html
 * <gui-slider label="Volume" minimum="0" maximum="100" step="5"></gui-slider>
 * ```
 *
 * @fires gui-input - The user moved the thumb. `detail.value` is the new value.
 * @fires gui-change - The user let go of the thumb, or moved it with a key. `detail.value` is the
 *   value.
 * @fires gui-blur - Focus left the control.
 */
export class GuiSlider extends GuiSliderBase {
  /** The number, or `undefined` before the user picks one. */
  @property({ type: Number }) value: number | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        // The slider role takes aria-readonly; the element blocks the keys and the pointer itself.
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  /** The value, or `undefined` for anything that isn't a number. */
  private get number(): number | undefined {
    return isRealNumber(this.value) ? this.value : undefined;
  }

  override render() {
    super.render();
    const { min, max, step } = this.bounds;
    const value = this.number;
    const position = value === undefined ? min : snapToStep(value, min, max, step);
    const percent = percentOf(position, min, max);
    const text = value === undefined ? '–' : this.formatValue(value);

    const templateData: ControlTemplateData<number> & { hint?: string } = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value,
    };

    return html`
      ${addLabel(this.uid, templateData, false, undefined, true, this.labelValue(text))}

      <div class="gui-widget">
        <div class=${this.controlClasses(value === undefined)}>
          <div class="gui-slider__rail" aria-hidden="true">
            <span
              class="gui-slider__fill"
              style=${cspStyleMap({ '--_start': 0, '--_end': value === undefined ? 0 : percent })}
            ></span>
          </div>
          ${this.ticks({ start: 0, end: value === undefined ? -1 : percent })}
          <input
            type="range"
            id=${this.uid}
            data-cy=${`${this.uid}_slider`}
            class="gui-slider__input"
            min=${min}
            max=${max}
            step=${step}
            .value=${live(String(position))}
            ?disabled=${this.disabled}
            aria-valuetext=${this.valueText(value)}
            @input=${this.onInput}
            @change=${this.onChange}
            @keydown=${this.onKeydown}
            @pointerdown=${this.onPointerDown}
            @blur=${this.onBlur}
          />
          ${this.bubble(text, percent)}
        </div>
        ${this.tickLabels()}
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  protected override validate(): GuiValidity | null {
    return this.boundsError(this.number) ?? super.validate();
  }

  /** @internal */
  onInput(event: Event) {
    event.stopPropagation();
    if (this.readOnly) return;
    this.value = Number((event.target as HTMLInputElement).value);
    dispatchValue(this, this.value, { commit: false });
  }

  /** @internal */
  onChange(event: Event) {
    event.stopPropagation();
    if (this.readOnly) return;
    dispatchChange(this, this.value);
  }
}

/** The events `gui-slider` fires, with their types. */
export const GuiSliderEvents = {
  ...valueEvents<GuiSlider['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-slider': GuiSlider;
  }
}

safeDefine('gui-slider', GuiSlider);
