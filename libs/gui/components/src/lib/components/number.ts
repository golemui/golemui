import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import {
  blockNonNumericInput,
  blockNonNumericKeys,
  isRealNumber,
  serverValue,
  stepValue,
} from '../utils/numeric';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dispatchBlur, dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { message } from '../utils/messages';

/** What <gui-number> renders besides the control state: its presentation props. */
export type GuiNumberProps = {
  hint?: string;
  step?: number;
  placeholder?: string;
  autocomplete?: string;
};

/**
 * A number field. ArrowUp and ArrowDown step the value.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the number: on blur or Enter, or at once with a step.
 *   `detail.value` is the number.
 * @fires gui-blur - Focus left the control.
 */
export class GuiNumber extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The number, or `undefined` when empty. */
  @property({ type: Number }) value: number | undefined = undefined;

  /** The step of the ArrowUp and ArrowDown keys. Defaults to 1. An empty field steps from 0. */
  @property({ type: Number }) step: number | undefined = undefined;
  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner native control. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /** Smallest allowed number. */
  @property({ type: Number }) minimum: number | undefined = undefined;
  /** Largest allowed number. */
  @property({ type: Number }) maximum: number | undefined = undefined;
  /** Grows the field with its content instead of scrolling. */
  @property({ attribute: 'auto-grow', converter: booleanAttribute }) autoGrow: boolean | undefined =
    false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
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

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override render() {
    super.render();

    // A server render has no rendered input to measure. The first client render finds no
    // input either, so both fall back to the same default width.
    const inputElement =
      typeof document === 'undefined'
        ? null
        : (this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement | null);

    // TODO: Try to calculate this better, too many magic numbers
    const inputStyles: any = {
      'min-width': '23px',
    };

    if (this.autoGrow) {
      if (inputElement) {
        inputElement.style.width = '0px';
        const newWidth = Math.max(23, inputElement.scrollWidth);
        inputStyles.width = `${newWidth}px`;
        inputStyles.maxWidth = `${newWidth}px`;
        inputElement.style.width = '';
      } else {
        inputStyles.width = '47px';
      }
    }

    const templateData: ControlTemplateData<number> & GuiNumberProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.normalizedValue,
      step: this.step,
      placeholder: this.placeholder,
      autocomplete: this.autocomplete,
    };

    // The inner input carries no constraints (see GuiFormControl): `step="any"` keeps the browser
    // from rejecting decimals, and the bounds reach assistive technology as aria-valuemin/max.
    return html`
      ${addLabel(this.uid, templateData)}

      <div class="gui-widget">
        <input
          type="number"
          inputmode="decimal"
          id=${this.uid}
          data-cy=${`${this.uid}_number`}
          class="gui-widget-input"
          style=${cspStyleMap(inputStyles)}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          step="any"
          aria-valuemin=${isRealNumber(this.minimum) ? this.minimum : nothing}
          aria-valuemax=${isRealNumber(this.maximum) ? this.maximum : nothing}
          placeholder=${this.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          value=${serverValue(this.normalizedValue)}
          @input=${this.valueChanged}
          @change=${this.valueCommitted}
          @beforeinput=${blockNonNumericInput}
          @keydown=${this.keyDown}
          @blur=${this.onBlur}
        />
        <span class="gui-number__decoration">
          <span class="gui-caret gui-caret--up" aria-hidden="true"></span>
          <span class="gui-caret" aria-hidden="true"></span>
        </span>
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  /**
   * The value as an actual number, or undefined. Property bindings bypass the
   * Lit converter, so arbitrary consumers can hand us '' (Angular-style ?? ''
   * templates), NaN (the Vue undefined workaround) or null.
   */
  private get normalizedValue(): number | undefined {
    return isRealNumber(this.value) ? this.value : undefined;
  }

  /**
   * Owns the native input value instead of a template binding. An attribute binding is
   * ignored once the user typed, and a string live() binding cannot express "equal as
   * numbers", so a draft like `1.` that already parses to the store value would be
   * clobbered mid-typing. The comparison is numeric so such a draft survives, and a
   * focused input is left alone while typing.
   */
  private syncNativeInput(): void {
    const input = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement | null;
    if (input === null || input.matches(':focus')) {
      return;
    }
    const storeValue = this.normalizedValue;
    const shownValue = input.valueAsNumber;
    const bothEmpty = Number.isNaN(shownValue) && storeValue === undefined;
    const sameNumber = !Number.isNaN(shownValue) && shownValue === storeValue;
    if (bothEmpty || sameNumber) {
      return;
    }
    if (storeValue === undefined) {
      input.value = '';
    } else {
      input.valueAsNumber = storeValue;
    }
  }

  protected override updated(): void {
    this.syncNativeInput();
  }

  /** @internal */
  keyDown(event: KeyboardEvent) {
    event.stopPropagation();
    blockNonNumericKeys(event);

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.plus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.minus();
        break;
    }
  }

  /** @internal */
  minus() {
    this.stepBy(-1);
  }

  /** @internal */
  plus() {
    this.stepBy(1);
  }

  /** Steps the value up or down like a native number input's arrow keys (see stepValue). */
  private stepBy(direction: 1 | -1) {
    if (this.readOnly) return;

    const target = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement;
    const current = Number.isNaN(target.valueAsNumber) ? undefined : target.valueAsNumber;
    const value = stepValue(current, direction, {
      step: this.step,
      minimum: this.minimum,
      maximum: this.maximum,
    });

    target.valueAsNumber = value;
    this.value = value;

    // A step is a complete edit, like the native number input's arrow keys.
    dispatchValue(this, this.value);
  }

  protected override validate(): GuiValidity | null {
    const value = this.normalizedValue;
    if (value !== undefined && isRealNumber(this.minimum) && value < this.minimum) {
      return {
        flags: { rangeUnderflow: true },
        message: message('rangeUnderflow', undefined, { min: this.minimum }),
      };
    }
    if (value !== undefined && isRealNumber(this.maximum) && value > this.maximum) {
      return {
        flags: { rangeOverflow: true },
        message: message('rangeOverflow', undefined, { max: this.maximum }),
      };
    }
    return super.validate();
  }

  /** @internal */
  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      const value = target.valueAsNumber;
      this.value = Number.isNaN(value) ? undefined : value;
      dispatchValue(this, this.value, { commit: false });
    }
  }

  /**
   * The native `change`: the user committed the typed number (blur or Enter).
   *
   * @internal
   */
  valueCommitted(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    dispatchChange(this, Number.isNaN(value) ? undefined : value);
  }

  /** @internal */
  onBlur() {
    // The focus guard in syncNativeInput() defers programmatic values while the
    // user is typing; land them now instead of relying on the blur dispatch to
    // coincidentally cause a store change and re-render.
    this.syncNativeInput();
    dispatchBlur(this);
  }
}

/** The events `gui-number` fires, with their types. */
export const GuiNumberEvents = {
  ...valueEvents<GuiNumber['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-number': GuiNumber;
  }
}

safeDefine('gui-number', GuiNumber);
