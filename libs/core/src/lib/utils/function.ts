/**
 * A function type that transforms a value of type A to type B
 */
type Func<A, B> = (arg: A) => B;

/**
 * Performs left-to-right function composition (pipeline).
 * The output of each function is passed as input to the next function.
 *
 * @typeParam A - The initial value type
 * @param value - The initial value to pipe through the functions
 * @param fns - Functions to apply in sequence
 * @returns The result after applying all functions
 *
 * @example
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * const double = (x: number) => x * 2;
 * const toString = (x: number) => `Result: ${x}`;
 *
 * const result = pipe(5, addOne, double, toString); // 5 -> 6 -> 12 -> "Result: 12"
 * ```
 */
function pipe<A>(value: A): A;
/** @see {@link pipe} */
function pipe<A, B>(value: A, fn1: Func<A, B>): B;
/** @see {@link pipe} */
function pipe<A, B, C>(value: A, fn1: Func<A, B>, fn2: Func<B, C>): C;
/** @see {@link pipe} */
function pipe<A, B, C, D>(value: A, fn1: Func<A, B>, fn2: Func<B, C>, fn3: Func<C, D>): D;
/** @see {@link pipe} */
function pipe<A, B, C, D, E>(
  value: A,
  fn1: Func<A, B>,
  fn2: Func<B, C>,
  fn3: Func<C, D>,
  fn4: Func<D, E>,
): E;
/** @see {@link pipe} */
function pipe<A, B, C, D, E, F>(
  value: A,
  fn1: Func<A, B>,
  fn2: Func<B, C>,
  fn3: Func<C, D>,
  fn4: Func<D, E>,
  fn5: Func<E, F>,
): F;
/** @see {@link pipe} */
function pipe<A, B, C, D, E, F, G>(
  value: A,
  fn1: Func<A, B>,
  fn2: Func<B, C>,
  fn3: Func<C, D>,
  fn4: Func<D, E>,
  fn5: Func<E, F>,
  fn6: Func<F, G>,
): G;
/** @see {@link pipe} */
function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  fn1: Func<A, B>,
  fn2: Func<B, C>,
  fn3: Func<C, D>,
  fn4: Func<D, E>,
  fn5: Func<E, F>,
  fn6: Func<F, G>,
  fn7: Func<G, H>,
): H;
function pipe(value: any, ...fns: Func<any, any>[]): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}

/**
 * Performs right-to-left function composition.
 * The output of each function is passed as input to the previous function.
 *
 * @typeParam A - The input type of the composed function
 * @returns A new function that applies all the given functions from right to left
 *
 * @example
 * Basic composition
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * const double = (x: number) => x * 2;
 * const toString = (x: number) => `Result: ${x}`;
 *
 * const transform = compose(toString, double, addOne); // Applies: addOne -> double -> toString
 * console.log(transform(5)); // "Result: 12"
 * ```
 */
function compose<A>(fn1: Func<A, A>): Func<A, A>;
/** @see {@link compose} */
function compose<A, B>(fn1: Func<A, B>, fn2: Func<B, A>): Func<B, B>;
/** @see {@link compose} */
function compose<A, B, C>(fn1: Func<B, C>, fn2: Func<A, B>): Func<A, C>;
/** @see {@link compose} */
function compose<A, B, C, D>(fn1: Func<C, D>, fn2: Func<B, C>, fn3: Func<A, B>): Func<A, D>;
/** @see {@link compose} */
function compose<A, B, C, D, E>(
  fn1: Func<D, E>,
  fn2: Func<C, D>,
  fn3: Func<B, C>,
  fn4: Func<A, B>,
): Func<A, E>;
/** @see {@link compose} */
function compose<A, B, C, D, E, F>(
  fn1: Func<E, F>,
  fn2: Func<D, E>,
  fn3: Func<C, D>,
  fn4: Func<B, C>,
  fn5: Func<A, B>,
): Func<A, F>;
/** @see {@link compose} */
function compose<A, B, C, D, E, F, G>(
  fn1: Func<F, G>,
  fn2: Func<E, F>,
  fn3: Func<D, E>,
  fn4: Func<C, D>,
  fn5: Func<B, C>,
  fn6: Func<A, B>,
): Func<A, G>;
/** @see {@link compose} */
function compose<A, B, C, D, E, F, G, H>(
  fn1: Func<G, H>,
  fn2: Func<F, G>,
  fn3: Func<E, F>,
  fn4: Func<D, E>,
  fn5: Func<C, D>,
  fn6: Func<B, C>,
  fn7: Func<A, B>,
): Func<A, H>;
function compose(...fns: Func<any, any>[]): Func<any, any> {
  return (value: any) => fns.reduceRight((acc, fn) => fn(acc), value);
}

export { compose, pipe };
