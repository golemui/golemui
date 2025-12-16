import * as jd from 'ts.data.json';

type KeySpec<A> = Record<
  string,
  {
    suffixed: boolean;
    decoder: jd.Decoder<A>;
  }
>;

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
