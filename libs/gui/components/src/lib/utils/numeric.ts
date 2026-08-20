/**
 * Characters accepted by an `<input type="number">`: digits, decimal separators
 * ('.' and the locale-dependent ','), exponent markers and signs.
 */
const VALID_NUMBER_INPUT_CHARS = /^[0-9.,eE+-]+$/;

/**
 * Whether a value is an actual number, including 0. Property bindings bypass
 * the Lit converters, so number-typed properties can end up holding '', NaN or
 * null at runtime; truthiness checks additionally drop a legitimate 0.
 *
 * @param {unknown} value - The value to test.
 * @return {boolean} True only for a number that is not NaN.
 */
export const isRealNumber = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

/**
 * Prevents text that is not valid inside an `<input type="number">` from being
 * inserted. Chrome filters these characters natively but Firefox does not, so
 * without this guard letters can be typed (or pasted) into number inputs.
 *
 * Intended to be attached as a `beforeinput` listener.
 *
 * @param {InputEvent} event - The `beforeinput` event fired on the input.
 */
export function blockNonNumericInput(event: InputEvent): void {
  const data = event.data ?? event.dataTransfer?.getData('text');

  // Deletions and other non-inserting input types carry no data
  if (!data) return;

  if (!VALID_NUMBER_INPUT_CHARS.test(data)) {
    event.preventDefault();
  }
}

/**
 * Prevents keystrokes that would insert characters not accepted by an
 * `<input type="number">`. Complements {@link blockNonNumericInput} in
 * browsers or automation tools where `beforeinput` is not dispatched.
 *
 * Intended to be attached as a `keydown` listener.
 *
 * @param {KeyboardEvent} event - The `keydown` event fired on the input.
 */
export function blockNonNumericKeys(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;

  // Multi-character keys (Backspace, Tab, ArrowLeft...) never insert text
  if (event.key.length !== 1) return;

  if (!VALID_NUMBER_INPUT_CHARS.test(event.key)) {
    event.preventDefault();
  }
}
