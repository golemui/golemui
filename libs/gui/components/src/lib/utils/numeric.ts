import { isServer, nothing } from 'lit';

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
 * The `value` attribute of a number input, rendered on the server only. In the browser the
 * elements set the input's value themselves after each render (a template binding would
 * overwrite what the user is typing), but the server has no input to set it on: without the
 * attribute the server HTML would show an empty field.
 *
 * @param {number | undefined} value - The element's value.
 * @return The value as an attribute on the server, otherwise `nothing`.
 */
export const serverValue = (value: number | undefined) =>
  isServer && value !== undefined ? String(value) : nothing;

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

/** The number of decimals a number is written with: 2 for 0.25, 7 for 1e-7. */
function decimalsOf(value: number): number {
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
  const fraction = mantissa.split('.')[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent));
}

/**
 * The value one step up or down, as the arrow keys of a native number input give it: an empty
 * field steps from 0, so a step down gives -step, and the result is clamped to the bounds. A step
 * that is not a positive number counts as 1. The result is rounded to the decimals of the value and
 * the step, so 0.1 + 0.2 gives 0.3 and not 0.30000000000000004.
 *
 * @param {number | undefined} current - The value, or undefined when the field is empty.
 * @param {1 | -1} direction - 1 for a step up, -1 for a step down.
 * @param {object} options - The step and the bounds, each optional.
 * @return {number} The stepped value.
 */
export function stepValue(
  current: number | undefined,
  direction: 1 | -1,
  options: { step?: number; minimum?: number; maximum?: number },
): number {
  const step = isRealNumber(options.step) && options.step > 0 ? options.step : 1;
  const from = isRealNumber(current) ? current : 0;
  const decimals = Math.min(100, Math.max(decimalsOf(from), decimalsOf(step)));
  let value = Number((from + direction * step).toFixed(decimals));

  value = isRealNumber(options.maximum) ? Math.min(value, options.maximum) : value;
  value = isRealNumber(options.minimum) ? Math.max(value, options.minimum) : value;
  return value;
}
