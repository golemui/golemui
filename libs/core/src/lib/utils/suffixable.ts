type Suffixable<T, K extends keyof T, TSuffixes extends string> = {
  [P in keyof T as P extends K ? never : P]: T[P];
} & {
  [P in K as P]: T[P];
} & {
  [P in K as `${string & P}.${TSuffixes}`]: T[P];
};

export type SomeSuffixable<
  T extends Record<string, any>,
  P extends Partial<keyof T>,
  TSuffixes extends string = string,
> = Suffixable<T, P, TSuffixes>;

export type AllSuffixable<
  T extends Record<string, any>,
  TSuffixes extends string,
> = Suffixable<T, keyof T, TSuffixes>;

/**
 * Takes a type T and an exclusion set E
 * @example
 * type OnExceptFocus = AllSuffixableExcept<On, 'focus'>;
 */
export type AllSuffixableExcept<
  T extends Record<string, any>,
  E extends keyof T,
  TSuffixes extends string,
> = Suffixable<T, Exclude<keyof T, E>, TSuffixes>;
