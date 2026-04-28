import type { Validator } from '@golemui/gui-validators';

/**
 * Build a fixed-type validator from a user-supplied partial validator and a
 * known JSON-schema type. The DX layer uses this for widgets whose value
 * shape is fixed (e.g. password is always string, currency always number,
 * calendar always string-with-format, repeater always array).
 *
 * Returns `undefined` when the user did not supply a validator, so callers
 * can spread the result conditionally:
 *
 *   ...(def.validator != null ? { validator: buildTypedValidator(def.validator, 'string') } : {})
 */
export function buildTypedValidator(
  validator: Record<string, unknown> | undefined,
  type: Validator['type'],
): Validator | undefined {
  if (validator == null) return undefined;
  return { type, ...validator } as Validator;
}
