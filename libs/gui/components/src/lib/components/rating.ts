import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { type GuiValidity, GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';
import { starIcon } from '../utils/icons';
import { message, requiredName } from '../utils/messages';
import { isRealNumber } from '../utils/numeric';
import { addErrors, addLabel, type ControlTemplateData, showsErrors } from '../utils/templates';

const DEFAULT_MAX = 5;

/** The keys that check another star: a read-only rating ignores them. */
const MOVING_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

/**
 * A rating from 1 to `max` stars, such as a review's score.
 *
 * ```html
 * <gui-rating label="Service" name="service" max="5"></gui-rating>
 * ```
 *
 * The stars are native radio buttons, so the arrow keys move between them and pick one, and
 * screen readers read a group of "1 star" to "5 stars". The pointer previews a rating as it
 * moves over the stars.
 *
 * Until the user picks one, or `value` is set, it has no value. A click on the picked star clears
 * it, and so do Delete and Backspace. A `required` rating clears too, as a required text field
 * empties: it then reports the missing value. A value set from code
 * that isn't a whole number from 1 to `max` is kept, shows the stars below it, and is reported
 * invalid.
 *
 * @fires gui-input - The user picked or cleared a rating. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the stars.
 */
export class GuiRating extends GuiFormControl {
  /** The number of stars picked, from 1 to `max`, or `undefined` before the user picks one. */
  @property({ type: Number }) value: number | undefined = undefined;
  /** How many stars it has. Defaults to 5. */
  @property({ type: Number }) max: number | undefined = DEFAULT_MAX;

  /** Space was pressed: the click that follows comes from the keyboard, and clears nothing. */
  private spacePressed = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[name="${this.domId}"]`),
    getState: () => ({
      domId: this.domId,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // Radios can't carry aria-readonly: the group does.
        readonly: false,
        disabled: false,
        required: this.required,
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

  /** `max`, or the default for anything that isn't a whole number above 0. */
  private get stars(): number {
    const max = this.max;
    return max !== undefined && Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX;
  }

  /** The value, or `undefined` for anything that isn't a number. */
  private get number(): number | undefined {
    return isRealNumber(this.value) ? this.value : undefined;
  }

  override render() {
    super.render();
    const stars = this.stars;
    const value = this.number;
    // The stars a value fills: a value off the scale, which is invalid, fills what it can.
    const filled = value === undefined ? 0 : Math.max(0, Math.min(stars, Math.floor(value)));
    // The star the value picks, if it picks one: one off the scale or between two picks none.
    const checked =
      value !== undefined && Number.isInteger(value) && value >= 1 && value <= stars
        ? value
        : undefined;
    const errors = showsErrors(this.touched, this.errors);

    const templateData: ControlTemplateData<number> & { hint?: string } = {
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value,
      hint: this.hint,
    };

    // One star takes the Tab key: the picked one, else the first.
    const star = (count: number) => {
      const isChecked = count === checked;
      // The radios share a name to form one group, and point at a form that does not exist to
      // stay out of the page's form: the element submits the value itself.
      return html`<label
        class="gui-rating__star${count <= filled ? ' gui-rating__star--filled' : ''}"
        for=${`${this.domId}_${count}`}
        ><input
          type="radio"
          class="gui-rating__input gui-visually-hidden"
          id=${`${this.domId}_${count}`}
          data-cy=${`${this.uid}_rating_${count}`}
          name=${this.domId}
          form=${`${this.domId}_none`}
          value=${count}
          tabindex=${count === (checked ?? 1) ? '0' : '-1'}
          aria-label=${requiredName('ratingStars', undefined, { count })}
          .checked=${live(isChecked)}
          ?disabled=${this.disabled}
          @click=${this.onClick}
          @keydown=${this.onKeydown}
          @change=${this.valueChanged}
        />${starIcon()}</label
      >`;
    };

    return html`
      ${addLabel(this, templateData, false, undefined, false)}

      <div class="gui-widget">
        <div
          class="gui-rating__stars${this.disabled || this.readOnly
            ? ' gui-rating__stars--static'
            : ''}"
          role="radiogroup"
          id=${this.domId}
          aria-labelledby=${this.label ? `${this.domId}_label` : nothing}
          aria-describedby=${this.hint ? `${this.domId}_hint` : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          aria-invalid=${errors ? 'true' : nothing}
          aria-errormessage=${errors ? `${this.domId}_errors` : nothing}
          @focusout=${this.onFocusOut}
        >
          ${Array.from({ length: stars }, (_, index) => star(index + 1))}
        </div>
      </div>

      ${addErrors(this, templateData)}
    `;
  }

  /** A value set from code off the scale: below 1, above `max`, or between two stars. */
  protected override validate(): GuiValidity | null {
    const value = this.number;
    if (value !== undefined) {
      const max = this.stars;
      if (value < 1) {
        return {
          flags: { rangeUnderflow: true },
          message: message('rangeUnderflow', undefined, { min: 1 }),
        };
      }
      if (value > max) {
        return {
          flags: { rangeOverflow: true },
          message: message('rangeOverflow', undefined, { max }),
        };
      }
      if (!Number.isInteger(value)) {
        return {
          flags: { stepMismatch: true },
          message: message('stepMismatch', undefined, { nearest: Math.round(value) }),
        };
      }
    }
    return super.validate();
  }

  /** Clears the rating for the user. A required one then reports the missing value. */
  private clear() {
    if (this.readOnly || this.number === undefined) return;
    this.value = undefined;
    dispatchValue(this, undefined);
  }

  /** @internal */
  valueChanged(event: Event) {
    event.stopPropagation();
    if (this.readOnly) return;
    this.value = Number((event.target as HTMLInputElement).value);
    dispatchValue(this, this.value);
  }

  /**
   * A click on the picked star clears it: a click on a checked radio fires no `change`. Space
   * checks a star, as on any radio, and clears nothing. A read-only rating cancels the click:
   * the browser then restores the checked radio and fires no `change`.
   *
   * @internal
   */
  onClick(event: Event) {
    const fromKeyboard = this.spacePressed;
    this.spacePressed = false;
    if (this.readOnly) {
      event.preventDefault();
      return;
    }
    const count = Number((event.target as HTMLInputElement).value);
    if (!fromKeyboard && count === this.value) this.clear();
  }

  /**
   * Delete and Backspace clear the rating. A read-only rating ignores the keys that would check
   * another star.
   *
   * @internal
   */
  onKeydown(event: KeyboardEvent) {
    if (event.key === ' ') this.spacePressed = true;
    if (this.readOnly) {
      if (MOVING_KEYS.has(event.key)) event.preventDefault();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.clear();
    }
  }

  /**
   * The arrow keys and a click move focus from one star to another: only focus that leaves the
   * stars is a blur.
   *
   * @internal
   */
  onFocusOut(event: FocusEvent) {
    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
    dispatchBlur(this);
  }
}

/** The events `gui-rating` fires, with their types. */
export const GuiRatingEvents = {
  ...valueEvents<GuiRating['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-rating': GuiRating;
  }
}

safeDefine('gui-rating', GuiRating);
