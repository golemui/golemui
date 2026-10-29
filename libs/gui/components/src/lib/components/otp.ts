import { html, nothing, type ComplexAttributeConverter, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { warnInDevelopment } from '../utils/dev';
import { dispatchBlur, dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { message } from '../utils/messages';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

const DEFAULT_LENGTH = 6;

/** The keys that move the caret, which would let the user type in the middle of the code. */
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** Reads `groups="3,3"` (or `"3 3"`, or JSON) as a list of group sizes. */
const groupsConverter: ComplexAttributeConverter<number[] | undefined> = {
  fromAttribute: (value: string | null) =>
    value === null || value.trim() === ''
      ? undefined
      : value
          .split(/[^\d]+/)
          .filter(Boolean)
          .map(Number),
  toAttribute: (value: number[] | undefined) => value?.join(','),
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/**
 * A one-time code field: the digits of a verification code, drawn as one box per digit.
 *
 * It is one native text input under the boxes, so paste, SMS and email autofill
 * (`autocomplete="one-time-code"`), password managers and screen readers treat it as a plain
 * field. The user types in order and Backspace removes the last digit. Anything that isn't a digit
 * is dropped, so a pasted `123-456` becomes `123456`.
 *
 * A `value` set from code is kept as it is, and the boxes show its first `length` digits. One with
 * anything but digits, or more than `length` of them, is invalid with its own message, "Enter a
 * 6-digit code.", rather than the incomplete one.
 *
 * The code always runs left to right, like a phone number, also in a right-to-left page.
 *
 * ```html
 * <gui-otp label="Verification code" length="6" groups="3,3"></gui-otp>
 * ```
 *
 * @fires gui-input - The user typed, pasted or removed a digit. `detail.value` is the code so far.
 * @fires gui-change - The code is complete, or focus left after a change. `detail.value` is the
 *   code.
 * @fires gui-blur - Focus left the control.
 */
export class GuiOtp extends GuiFormControl {
  /** The digits entered so far. Complete when it has `length` of them. */
  @property({ type: String }) value: string | undefined = undefined;
  /** How many digits the code has. Defaults to 6. */
  @property({ type: Number }) length: number | undefined = DEFAULT_LENGTH;
  /**
   * Splits the boxes into groups with a gap between them, such as `[3, 3]` for `123 456`. The sizes
   * must add up to `length`. It only changes how the code looks, never the value.
   */
  @property({ converter: groupsConverter }) groups: number[] | undefined = undefined;
  /** The error for a code with fewer than `length` digits. Defaults to "Enter all N digits." */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;

  /** The code `gui-change` last reported, so a code is reported complete once. */
  private committed: string | undefined = undefined;

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

  /** The number of digits, or the default for anything that isn't a positive integer. */
  private get codeLength(): number {
    return isPositiveInteger(this.length) ? this.length : DEFAULT_LENGTH;
  }

  /** Whether `groups` lists sizes that add up to the length. */
  private get validGroups(): boolean {
    const groups = this.groups;
    return (
      Array.isArray(groups) &&
      groups.every(isPositiveInteger) &&
      groups.reduce((sum, size) => sum + size, 0) === this.codeLength
    );
  }

  /** The group sizes to draw: `groups` when they are valid, else one group. */
  private get groupSizes(): number[] {
    return this.validGroups ? (this.groups as number[]) : [this.codeLength];
  }

  /** The value's digits, at most `length` of them: what the boxes show. */
  private get digits(): string {
    return this.sanitize(this.value ?? '');
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<string> & { hint?: string } = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
    };

    return html`
      ${addLabel(this.uid, templateData)}

      <div class="gui-widget">
        <div class="gui-otp__control" dir="ltr">
          ${this.boxes()}
          <input
            type="text"
            id=${this.uid}
            data-cy=${`${this.uid}_otp`}
            class="gui-otp__input"
            inputmode="numeric"
            autocomplete="one-time-code"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            .value=${live(this.digits)}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            @input=${this.onInput}
            @change=${this.onChange}
            @keydown=${this.onKeydown}
            @select=${this.keepCaretAtEnd}
            @pointerup=${this.keepCaretAtEnd}
            @focus=${this.keepCaretAtEnd}
            @blur=${this.onBlur}
          />
        </div>
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  /** The boxes, in their groups. Decorative: the input under them is the field. */
  private boxes() {
    const digits = this.digits;
    // The box the next digit goes in, or the last one when the code is complete.
    const active = Math.min(digits.length, this.codeLength - 1);
    let index = 0;

    return html`<div class="gui-otp__boxes" aria-hidden="true">
      ${this.groupSizes.map(
        (size, group) => html`
          ${group > 0 ? html`<span class="gui-otp__separator"></span>` : nothing}
          <span class="gui-otp__group">
            ${Array.from({ length: size }, () => {
              const position = index++;
              const classes = {
                'gui-otp__box': true,
                'gui-otp__box--filled': position < digits.length,
                'gui-otp__box--active': position === active,
              };
              return html`<span class=${classMap(classes)}>${digits[position] ?? ''}</span>`;
            })}
          </span>
        `,
      )}
    </div>`;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.groups !== undefined && !this.validGroups) {
      warnInDevelopment(
        this,
        `ignores groups="${String(this.groups)}": the sizes must add up to length (${this.codeLength}).`,
      );
    }
  }

  protected override validate(): GuiValidity | null {
    const value = this.value ?? '';
    if (value === '') return super.validate();
    const length = this.codeLength;
    if (/^\d+$/.test(value)) {
      if (value.length === length) return null;
      if (value.length < length) {
        return {
          flags: { tooShort: true },
          message: message('incompleteCode', this.incompleteMessage, { length }),
        };
      }
    }
    // Only a value set from code can hold more digits, or anything else: typing keeps neither.
    const flags: ValidityStateFlags = /^\d+$/.test(value)
      ? { tooLong: true }
      : { patternMismatch: true };
    return { flags, message: message('invalidCode', undefined, { length }) };
  }

  /** Keeps the digits of a typed or pasted text, up to the code's length. */
  private sanitize(text: string): string {
    return text.replace(/\D/g, '').slice(0, this.codeLength);
  }

  /** @internal */
  onInput(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const code = this.sanitize(input.value);
    // A typed dash or letter comes back out, and the caret stays at the end.
    if (input.value !== code) input.value = code;
    if (code === (this.value ?? '')) return;

    this.value = code;
    dispatchValue(this, code, { commit: false });
    if (code.length === this.codeLength) this.commit();
  }

  /**
   * The native `change`: focus left after the user changed the code.
   *
   * @internal
   */
  onChange(event: Event) {
    event.stopPropagation();
    this.commit();
  }

  private commit() {
    if (this.value === this.committed) return;
    this.committed = this.value;
    dispatchChange(this, this.value);
  }

  /**
   * The digits fill in order, so the caret stays after the last one. Selecting the whole code is
   * allowed, to replace or delete it at once.
   *
   * @internal
   */
  onKeydown(event: KeyboardEvent) {
    if (CARET_KEYS.has(event.key)) event.preventDefault();
  }

  /** @internal */
  keepCaretAtEnd(event: Event) {
    const input = event.target as HTMLInputElement;
    const end = input.value.length;
    const { selectionStart, selectionEnd } = input;
    const wholeCode = selectionStart === 0 && selectionEnd === end;
    if (wholeCode || (selectionStart === end && selectionEnd === end)) return;
    input.setSelectionRange(end, end);
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }
}

/** The events `gui-otp` fires, with their types. */
export const GuiOtpEvents = {
  ...valueEvents<GuiOtp['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-otp': GuiOtp;
  }
}

safeDefine('gui-otp', GuiOtp);
