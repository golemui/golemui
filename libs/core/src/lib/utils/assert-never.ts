/**
 * Ensures exhaustiveness in compile-time checks and throws at runtime
 * if an unhandled case is encountered.
 */
export const assertNever = (value: never): never => {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
};
