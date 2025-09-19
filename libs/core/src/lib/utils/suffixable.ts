// TODO: Make suffixable also take the available state suffixes that can be used
type Suffixable<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
} & {
  [P in K as P]: T[P];
} & {
  [P in K as `${string & P}.${string}`]: T[P];
};

export type SomeSuffixable<
  T extends Record<string, any>,
  P extends Partial<keyof T>
> = Suffixable<T, P>;

export type AllSuffixable<T extends Record<string, any>> = Suffixable<
  T,
  keyof T
>;

/**
 * Takes a type T and an exclusion set E
 * @example
 * type OnExceptFocus = AllSuffixableExcept<On, 'focus'>;
 */
export type AllSuffixableExcept<
  T extends Record<string, any>,
  E extends keyof T
> = Suffixable<T, Exclude<keyof T, E>>;
