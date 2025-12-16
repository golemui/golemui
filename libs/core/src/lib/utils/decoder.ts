import * as jd from 'ts.data.json';

export interface SuffixKeySpec<A> {
  key: string;
  decoder: jd.Decoder<A>;
}

export function objectWithSuffix<T extends Record<string, any>>(
  specs: ReadonlyArray<SuffixKeySpec<any>>,
  decoderName: string,
): jd.Decoder<T> {
  return new jd.Decoder<T>((json: any) => {
    if (typeof json !== 'object' || json === null) {
      return jd.err<T>(`${decoderName} failed. Expected object literal, got ${typeof json}`);
    }

    const out = {} as Record<string, any>;

    for (const [rawKey, value] of Object.entries(json)) {
      const spec = specs.find((s) => rawKey === s.key || rawKey.startsWith(s.key + '.'));

      if (!spec) {
        return jd.err<T>(`${decoderName} failed. Unexpected object key ${rawKey}`);
      }

      const res = spec.decoder.decode(value);
      if (!res.isOk()) {
        return jd.err<T>(`${decoderName} failed with ${res.error}`);
      }

      out[rawKey] = res.value;
    }

    return jd.ok<T>(out as T);
  });
}
