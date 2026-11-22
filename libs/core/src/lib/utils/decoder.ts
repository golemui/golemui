import { Decoder, err, ok } from 'ts.data.json';

/** The message of the issue for a function inside a form definition. */
export const functionInDefinitionMessage =
  'A form definition is JSON and cannot contain a function. Write a widget as an object, a computed text as a "{{ }}" template, a condition as a "when" rule, a value for one state as a key with a state suffix, and an event handler as an event name.';

/**
 * Wraps a decoder of a form definition value. A function gives the issue for a function in a
 * definition, and every other value goes to the wrapped decoder.
 *
 * @param decoder - The decoder of the value.
 * @returns A decoder that rejects a function with {@link functionInDefinitionMessage}.
 *
 * @example
 * ```typescript
 * noFunction(optional(string())).decode(() => 'Name'); // Err with functionInDefinitionMessage
 * noFunction(optional(string())).decode('Name'); // Ok('Name')
 * ```
 */
export function noFunction<A>(decoder: Decoder<A>): Decoder<A> {
  return new Decoder<A>((json: unknown) => {
    if (typeof json === 'function') {
      return err<A>([{ message: functionInDefinitionMessage, path: [] }]);
    }
    return decoder.decode(json);
  });
}

export type KeySpec<A> = Record<
  string,
  {
    suffixed?: boolean;
    decoder: Decoder<A>;
  }
>;

/**
 * Creates a JSON decoder for objects whose keys are validated against a
 * specification map.
 *
 * Each entry in `specs` defines:
 * - the base key name
 * - whether the key may appear with dot-suffixed variants
 * - the decoder used to validate the corresponding values
 *
 * Matching rules:
 * - If `suffixed` is `false`, only the exact key is decoded.
 * - If `suffixed` is `true`, both the base key and any keys starting with
 *   `<key>.` are decoded.
 * - Object keys that do not match any specification are silently stripped
 *   from the decoded output.
 *
 * All values are decoded independently using the decoder associated with the
 * matched key. Decoded values are returned under their original object keys
 * (including suffixes).
 *
 * A value of a matched key that is a function gives the issue for a function in a
 * form definition (see {@link noFunction}). An array gives an issue, as every value that is
 * not an object literal.
 *
 * @typeParam T - The resulting object shape after successful decoding.
 *
 * @param specs - A map of base keys to their decoding specification.
 *
 * @returns A `jd.Decoder` that validates and decodes objects according to the
 *          provided key specifications.
 *
 * @example
 * ```ts
 * const decoder = objectWithSuffix<Record<string, string>>({
 *   label: { suffixed: true, decoder: jd.string() },
 *   title: { suffixed: false, decoder: jd.string() },
 * });
 *
 * decoder.decode({
 *   label: 'Submit',
 *   'label.register': 'Register',
 *   title: 'Form',
 * });
 * ```
 */

export function objectWithSuffix<T extends Record<string, any>>(specs: KeySpec<any>): Decoder<T> {
  const guardedSpecs = Object.entries(specs).map(
    ([specKey, spec]) => [specKey, { ...spec, decoder: noFunction(spec.decoder) }] as const,
  );

  return new Decoder<T>((json: any) => {
    if (typeof json !== 'object' || json === null) {
      return err<T>([{ message: `Expected object literal, got "${typeof json}"`, path: [] }]);
    }
    // An array has inherited keys that a key of the specification can name, for example `filter`.
    if (Array.isArray(json)) {
      return err<T>([{ message: 'Expected object literal, got "array"', path: [] }]);
    }

    const out: Record<string, any> = {};

    for (const [specKey, spec] of guardedSpecs) {
      // decode normal properties (without state)
      const res = spec.decoder.decode(json[specKey]);
      if (!res.isOk()) {
        return err<T>(
          res.issues.map((issue) => ({
            message: issue.message,
            path: [specKey, ...issue.path],
          })),
        );
      }
      out[specKey] = res.value;

      // decode properties with state
      if (spec.suffixed) {
        for (const [jsonKey, jsonValue] of Object.entries(json)) {
          if (jsonKey.startsWith(specKey + '.')) {
            const res = spec.decoder.decode(jsonValue);
            if (!res.isOk()) {
              return err<T>(
                res.issues.map((issue) => ({
                  message: issue.message,
                  path: [jsonKey, ...issue.path],
                })),
              );
            }
            out[jsonKey] = res.value;
          }
        }
      }
    }

    return ok<T>(out as T);
  });
}
