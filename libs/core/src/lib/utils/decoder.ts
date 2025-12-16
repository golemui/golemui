import * as jd from 'ts.data.json';

export type KeySpec<A> = Record<
  string,
  {
    suffixed: boolean;
    decoder: jd.Decoder<A>;
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
): jd.Decoder<T> {
  return new jd.Decoder<T>((json: any) => {
    if (typeof json !== 'object' || json === null) {
      return jd.err<T>(`${decoderName} failed. Expected object literal, got ${typeof json}`);
    }

    const out: Record<string, any> = {};

    for (const [rawKey, value] of Object.entries(json)) {
      const specEntry = Object.entries(specs).find(([key, spec]) =>
        spec.suffixed ? rawKey === key || rawKey.startsWith(key + '.') : rawKey === key,
      );

      if (!specEntry) {
        return jd.err<T>(`${decoderName} failed. Unexpected object key "${rawKey}"`);
      }

      const [, spec] = specEntry;
      const res = spec.decoder.decode(value);

      if (!res.isOk()) {
        return jd.err<T>(`${decoderName} failed with ${res.error}`);
      }

      out[rawKey] = res.value;
    }

    return jd.ok<T>(out as T);
  });
}
