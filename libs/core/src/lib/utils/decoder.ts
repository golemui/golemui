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
 * - If `suffixed` is `false`, only the exact key is accepted.
 * - If `suffixed` is `true`, both the base key and any keys starting with
 *   `<key>.` are accepted.
 * - Any object key that does not match one of the specifications causes
 *   decoding to fail.
 *
 * All values are decoded independently using the decoder associated with the
 * matched key. Decoded values are returned under their original object keys
 * (including suffixes).
 *
 * @typeParam T - The resulting object shape after successful decoding.
 *
 * @param specs - A map of base keys to their decoding specification.
 * @param decoderName - Human-readable name used in error messages.
 *
 * @returns A `jd.Decoder` that validates and decodes objects according to the
 *          provided key specifications.
 *
 * @example
 * ```ts
 * const decoder = objectWithSuffix<Record<string, string>>(
 *   {
 *     label: { suffixed: true, decoder: jd.string() },
 *     title: { suffixed: false, decoder: jd.string() },
 *   },
 *   'MyObj',
 * );
 *
 * decoder.decode({
 *   label: 'Submit',
 *   'label.register': 'Register',
 *   title: 'Form',
 * });
 * ```
 */

export function objectWithSuffix<T extends Record<string, any>>(
  specs: KeySpec<any>,
  decoderName: string,
): Decoder<T> {
  return new Decoder<T>((json: any) => {
    if (typeof json !== 'object' || json === null) {
      return err<T>(`<${decoderName}> failed. Expected object literal, got "${typeof json}"`);
    }

    const out: Record<string, any> = {};

    for (const [specKey, spec] of Object.entries(specs)) {
      // decode normal properties (without state)
      const res = spec.decoder.decode(json[specKey]);
      if (!res.isOk()) {
        return err<T>(`<${decoderName}> failed at "${specKey}" with ${res.error}`);
      }
      out[specKey] = res.value;

      // decode properties with state
      if (spec.suffixed) {
        for (const [jsonKey, jsonValue] of Object.entries(json)) {
          if (jsonKey.startsWith(specKey + '.')) {
            const res = spec.decoder.decode(jsonValue);
            if (!res.isOk()) {
              return err<T>(`<${decoderName}> failed at "${jsonKey}" with ${res.error}`);
            }
            out[jsonKey] = res.value;
          }
        }
      }
    }

    return ok<T>(out as T);
  });
}
