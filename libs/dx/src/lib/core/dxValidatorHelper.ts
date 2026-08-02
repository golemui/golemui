import type { CustomValidator, Validator } from '@golemui/gui-validators';

type ValidatorFn = (api: any) => Partial<Validator>;

/**
 * Validator shape accepted by a DX widget whose value type is fixed (e.g.
 * a `textInput`'s value is always a string). The user may either:
 *   - omit the `type` discriminator and write only the rules for that fixed
 *     kind (`{ minLength: 5 }`), which `buildTypedValidator` will tag with the
 *     correct `type` at form-def construction time, or
 *   - opt out and supply a fully-typed `CustomValidator`
 *     (`{ type: 'custom', <validatorName>: <config> }`), which the engine
 *     resolves against `customValidators` at validation time.
 *
 * The two branches are discriminated by the presence of `type: 'custom'`.
 */
export type DxValidator<T extends Validator> = Omit<T, 'type'> | CustomValidator;

/**
 * Build a fixed-type validator from a user-supplied partial validator and a
 * known JSON-schema type. The DX layer uses this for widgets whose value
 * shape is fixed (e.g. password is always string, currency always number,
 * calendar always string-with-format, repeater always array).
 *
 * Runtime-function validators are passed through unchanged — the function's
 * return value is responsible for setting `type` itself. The function is
 * evaluated by the engine on every form-data change.
 *
 * When `validator` is `undefined`, returns a no-op typed validator
 * (`{ type }` with no rules). Callers can still gate the call with a null
 * check when they only want to emit `validator` if the user supplied one.
 */
export function buildTypedValidator(
  validator: Record<string, unknown> | ValidatorFn | undefined,
  type: Validator['type'],
): Validator | ValidatorFn {
  if (typeof validator === 'function') return validator;
  return { type, ...(validator ?? {}) } as Validator;
}
