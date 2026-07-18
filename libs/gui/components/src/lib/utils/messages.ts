/**
 * Shared user-facing validation messages for the segmented date/time inputs.
 */

/** Default inputError message for a complete but impossible date (e.g. Feb 31). **/
export const INVALID_DATE_MESSAGE =
  'Invalid date: day is greater than the maximum valid day for the month and year.';

/** Default inputError message for a time before the minTime bound. **/
export const INVALID_MIN_TIME_MESSAGE = 'Invalid time: time is before the minimum allowed time.';

/** Default inputError message for a time after the maxTime bound. **/
export const INVALID_MAX_TIME_MESSAGE = 'Invalid time: time is after the maximum allowed time.';

/** Default inputError message for a time after the start time. **/
export const INVALID_TIME_RANGE_ORDER_MESSAGE = 'Invalid range: end time must be after start time.';

/** Default inputError message for a time within a disabled range **/
export const INVALID_DISABLED_TIME_RANGE_MESSAGE = 'Invalid time: time is within a disabled range.';
