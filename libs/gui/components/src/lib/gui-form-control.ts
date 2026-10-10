import { property } from 'lit/decorators.js';
import { booleanAttribute } from './utils/converters';
import { GuiElement } from './gui-element';
import { message } from './utils/messages';

/** Why a control's value is invalid, see {@link GuiFormControl.validate}. */
export type GuiValidity = { flags: ValidityStateFlags; message: string };

/**
 * A bounds error as validity: a value below `min` underflows, one above `max` overflows, and any
 * other error (a disabled range) is custom. Values compare as numbers or ISO strings.
 */
export function boundsValidity<T extends string | number>(
  message: string | null,
  value: T | undefined,
  min: T | undefined,
  max: T | undefined,
): GuiValidity | null {
  if (!message || value === undefined) return null;
  const flags: ValidityStateFlags =
    min !== undefined && value < min
      ? { rangeUnderflow: true }
      : max !== undefined && value > max
        ? { rangeOverflow: true }
        : { customError: true };
  return { flags, message };
}

const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  value === false ||
  (typeof value === 'number' && Number.isNaN(value)) ||
  (Array.isArray(value) && value.length === 0);

const toFormEntry = (value: unknown): string =>
  typeof value === 'object' ? JSON.stringify(value) : String(value);

/**
 * Base class of the GolemUI elements that hold a value. They take part in a native `<form>` like
 * the built-in controls: the value is submitted under `name`, `required` and the element's bounds
 * block an invalid submission, `form.reset()` restores the initial value, and a disabled
 * `<fieldset>` disables them.
 *
 * Only an element with a `name` takes part in submission and validation. GolemUI Forms never sets
 * one, and neither do the elements that compose others (a picker's inner field), so neither is
 * validated twice.
 *
 * The native controls an element renders sit in the light DOM, inside the same `<form>`, so they
 * must carry no constraint attributes (`required`, `min`, `max`, `step`, `pattern`): the browser
 * would validate them too, with or without a `name`. The element validates through
 * {@link GuiFormControl.validate} and points the browser at the control with
 * {@link GuiFormControl.validationAnchor}; `aria-required` and the like carry the state.
 */
export abstract class GuiFormControl extends GuiElement {
  static formAssociated = true;

  /**
   * The name the value is submitted under. Without it the element stays out of its form.
   * Reflected, like a native control's: the form reads a single value's name from the attribute.
   */
  @property({ type: String, reflect: true }) name: string | undefined = undefined;

  /** The element's value. Its type depends on the element. */
  abstract value: unknown;

  /**
   * The visible label, which also names the control for assistive technology. Without one the
   * control has no accessible name; the date, time, range, tags and file fields warn about it in
   * development builds.
   */
  @property({ type: String }) label: string | undefined = undefined;

  /** Help text shown under the label and announced as the control's description. */
  @property({ type: String }) hint: string | undefined = undefined;

  /**
   * Error messages to show, typically from your own validation. They show as soon as they are set,
   * unless `touched` is `false`.
   */
  @property({ type: Array }) errors: string[] | undefined = [];

  /**
   * Whether the user has interacted with the control. Leave it unset unless you validate on
   * interaction: `false` holds `errors` back until it becomes `true`.
   */
  @property({ converter: booleanAttribute }) touched: boolean | undefined = undefined;

  /** The control needs a value: it is marked as required and, with a `name`, blocks submission. */
  @property({ converter: booleanAttribute }) required: boolean | undefined = false;

  /** The value can be read and focused but not changed. */
  @property({ attribute: 'readonly', converter: booleanAttribute }) readOnly: boolean | undefined =
    false;

  private ownDisabled: boolean | undefined = false;
  private formDisabled = false;
  private defaultValue: unknown = undefined;
  private hasDefaultValue = false;

  /**
   * Disabled by its own attribute or by a disabled `<fieldset>` around it. Setting the property
   * sets the attribute, like a native control's.
   */
  @property({ converter: booleanAttribute })
  get disabled(): boolean | undefined {
    return this.ownDisabled || this.formDisabled;
  }

  set disabled(value: boolean | undefined) {
    this.ownDisabled = value;
    // The browser reads the attribute, not the property: without it, a disabled element would
    // still be submitted. Only the element's own state is reflected, never the fieldset's.
    if (!!value !== this.hasAttribute('disabled')) {
      if (value) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }
  }

  // Not every environment implements ElementInternals (jsdom does not).
  protected readonly internals: ElementInternals | undefined =
    typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;

  constructor() {
    super();
    // A controller instead of `updated()`, which elements override without calling super.
    this.addController({ hostUpdated: () => this.syncForm() });
  }

  /** The `<form>` the element belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? null;
  }

  /** The element's validity, like a native control's. */
  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  /** The message the browser shows for an invalid value. */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? '';
  }

  /** The value the element submits, validates and resets: `value` unless an element says otherwise. */
  protected get controlValue(): unknown {
    return this.value;
  }

  protected set controlValue(value: unknown) {
    this.value = value;
  }

  checkValidity(): boolean {
    return this.internals?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    return this.internals?.reportValidity() ?? true;
  }

  /**
   * Why the current value is invalid, or null when it is valid. Elements with bounds (`min`,
   * `minDate`…) extend it; the base checks `required`.
   */
  protected validate(): GuiValidity | null {
    return this.required && isEmptyValue(this.controlValue)
      ? { flags: { valueMissing: true }, message: message('valueMissing') }
      : null;
  }

  /**
   * The value as the form submits it: text for a scalar, one entry per item for a list, and JSON
   * for an object such as a date range.
   */
  protected formValue(): string | FormData | null {
    const value = this.controlValue;
    if (isEmptyValue(value)) return null;
    if (value === true) return 'on';
    if (Array.isArray(value)) {
      const data = new FormData();
      for (const item of value) data.append(this.name as string, toFormEntry(item));
      return data;
    }
    return toFormEntry(value);
  }

  /** The inner control the browser points at when it reports an invalid value. */
  protected validationAnchor(): HTMLElement | undefined {
    return (
      this.querySelector<HTMLElement>(
        'input, textarea, select, button, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      ) ?? undefined
    );
  }

  /**
   * The inner native controls are in the light DOM, so the reset empties them too. The render after
   * it writes the value back into them, also when the value did not change and setting it would
   * schedule no render. An element that overrides this calls `super.formResetCallback()`.
   */
  formResetCallback(): void {
    if (this.hasDefaultValue) this.controlValue = this.defaultValue;
    this.requestUpdate();
  }

  formDisabledCallback(disabled: boolean): void {
    const previous = this.disabled;
    this.formDisabled = disabled;
    this.requestUpdate('disabled', previous);
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return;
    try {
      this.controlValue = JSON.parse(state);
    } catch {
      // A state the element did not write: nothing to restore.
    }
  }

  private syncForm(): void {
    if (!this.hasDefaultValue) {
      // The value the element starts with, which `form.reset()` restores.
      this.defaultValue = this.controlValue;
      this.hasDefaultValue = true;
    }

    const internals = this.internals;
    if (!internals) return;

    if (!this.name) {
      internals.setFormValue(null);
      internals.setValidity({});
      return;
    }

    internals.setFormValue(
      this.formValue(),
      this.controlValue === undefined ? null : JSON.stringify(this.controlValue),
    );

    // Like native controls, disabled and read-only ones are never validated.
    const invalid = this.disabled || this.readOnly ? null : this.validate();
    if (invalid) {
      internals.setValidity(invalid.flags, invalid.message, this.validationAnchor());
    } else {
      internals.setValidity({});
    }
  }
}
