import { Decoder, err, ok } from 'ts.data.json';

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
  return new Decoder<T>((json: any) => {
    if (typeof json !== 'object' || json === null) {
      return err<T>([{ message: `Expected object literal, got "${typeof json}"`, path: [] }]);
    }

    const out: Record<string, any> = {};

    for (const [specKey, spec] of Object.entries(specs)) {
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
