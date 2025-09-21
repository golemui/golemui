type PipeArgs<T extends readonly unknown[], K> = T extends readonly [
  (...args: any[]) => infer U,
  ...infer Rest,
]
  ? Rest extends readonly [(...args: any[]) => any, ...any[]]
    ? readonly [(arg: K) => U, ...PipeArgs<Rest, U>]
    : readonly [(arg: K) => U]
  : never;

type LastReturnType<T extends readonly unknown[]> = T extends readonly [
  ...any[],
  (...args: any[]) => infer R,
]
  ? R
  : never;

export function pipe<T extends readonly [(...args: any[]) => any, ...any[]]>(
  value: Parameters<T[0]>[0],
  ...fns: T & PipeArgs<T, Parameters<T[0]>[0]>
): LastReturnType<T> {
  return fns.reduce((acc, fn) => fn(acc), value) as LastReturnType<T>;
}
