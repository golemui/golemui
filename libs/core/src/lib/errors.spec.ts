import { describe, expect, it } from 'vitest';
import { errorCodes } from './errors';

describe('errorCodes', () => {
  // errorCodes is public and the bindings set code 30, so a changed number is a breaking change.
  it('keeps the number of every error code', () => {
    expect(errorCodes).toEqual({
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
    });
  });
});
