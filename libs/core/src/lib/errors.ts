/**
 * Errors in the < 1000 range are core
 */
export const errorCodes = {
  calculateCurrentStateError: 10,
  calculateWidgetFlagsError: 11,
  calculateWidgetPropsError: 12,
  initializeParseError: 20,
  initializeUidCollisionError: 21,
  initializeUnknownError: 22,
  initializeMalformedFormShapeError: 23,
  widgetCouldNotBeLoaded: 30,
  resolveStringInterpolationError: 40,
  expressionRejectedError: 50,
  validationError: 60,
};

/**
 * Reads the message of a caught value. Code outside core can throw a value that is not an `Error`.
 *
 * @param error - The caught value.
 * @returns The message of an `Error`, otherwise the value as a string.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
