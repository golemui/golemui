/**
 * Shared user-facing validation messages for the segmented date/time inputs.
 */

/** Default inputError message for a complete but impossible date (e.g. Feb 31). **/
export const INVALID_DATE_MESSAGE =
  'Invalid date: day is greater than the maximum valid day for the month and year.';

/** Default inputError message for a date before the minDate bound. **/
export const INVALID_MIN_DATE_MESSAGE = 'Invalid date: date is before the minimum allowed date.';

/** Default inputError message for a date before the maxDate bound. **/
export const INVALID_MAX_DATE_MESSAGE = 'Invalid date: date is after the maximum allowed date.';

/** Default error when a selected range spans one or more disabled days/spans. */
export const DISABLED_DATE_RANGE_MESSAGE = 'Invalid date: date is within a disabled range.';

/** Default inputError message for a time before the minTime bound. **/
export const INVALID_MIN_TIME_MESSAGE = 'Invalid time: time is before the minimum allowed time.';

/** Default inputError message for a time after the maxTime bound. **/
export const INVALID_MAX_TIME_MESSAGE = 'Invalid time: time is after the maximum allowed time.';

/** Default inputError message for a time after the start time. **/
export const INVALID_TIME_RANGE_ORDER_MESSAGE = 'Invalid range: end time must be after start time.';

/** Default inputError message for a time within a disabled range **/
export const INVALID_DISABLED_TIME_RANGE_MESSAGE = 'Invalid time: time is within a disabled range.';

/** Default inputError message for a date-time before the minDateTime bound. **/
export const INVALID_MIN_DATE_TIME_MESSAGE =
  'Invalid date-time: date-time is before the minimum allowed date-time.';
/** Default inputError message for a date-time before the maxDateTime bound. **/
export const INVALID_MAX_DATE_TIME_MESSAGE =
  'Invalid date-time: date-time is after the maximum allowed date-time.';

/** Default inputError message for a partially filled date left behind on focus leave. **/
export const INCOMPLETE_DATE_MESSAGE = 'Incomplete date: fill in all date parts.';

/** Default inputError message for a partially filled time left behind on focus leave. **/
export const INCOMPLETE_TIME_MESSAGE = 'Incomplete time: fill in all time parts.';

/** Default inputError message for a partially filled date-time left behind on focus leave. **/
export const INCOMPLETE_DATE_TIME_MESSAGE =
  'Incomplete date-time: fill in all date and time parts.';

// ─── allowEdit (in-place pill editing) strings ─────────────────────────────
// `{label}` is the range's display label, interpolated at interaction time
// via formatEditMessage — single braces on purpose, so the form layer's
// `{{…}}` localization interpolation cannot consume the token.

/** Default tooltip label of the pill's Edit action. **/
export const EDIT_RANGE_LABEL = 'Edit';

/** Default tooltip label of the pill's Confirm action. **/
export const CONFIRM_EDIT_RANGE_LABEL = 'Confirm';

/** Default tooltip label of the pill's Cancel action. **/
export const CANCEL_EDIT_RANGE_LABEL = 'Cancel';

/** Default edit hint joined into the pill's aria-description. **/
export const EDIT_RANGE_ARIA_LABEL = 'Edit range {label}';

/** Default aria-live announcement when an edit session starts. **/
export const EDIT_RANGE_STARTED_MESSAGE = 'Editing range {label}.';

/** Default aria-live announcement when an edit commits its replacement. **/
export const EDIT_RANGE_COMMITTED_MESSAGE = 'Range updated to {label}.';

/** Default aria-live announcement when an edit session is cancelled. **/
export const EDIT_RANGE_CANCELLED_MESSAGE = 'Edit cancelled.';

/**
 * Interpolates the runtime `{label}` token of the allowEdit strings.
 *
 * @param {string} template - The message or aria-label template.
 * @param {string} label - The range's display label.
 * @return {string} The interpolated text.
 */
export function formatEditMessage(template: string, label: string): string {
  return template.split('{label}').join(label);
}

// ─── fileUpload / multiFileUpload strings ──────────────────────────────────
// `{name}` is the file name, interpolated at interaction time via
// formatFileMessage — single braces on purpose, same reasoning as `{label}`.

/** Default text of the single file upload button. **/
export const FILE_UPLOAD_BUTTON_LABEL = 'Upload file';

/** Default text of the multi file upload button. **/
export const MULTI_FILE_UPLOAD_BUTTON_LABEL = 'Upload files';

/** Default accessible name of the remove button of an uploaded or failed file. **/
export const FILE_REMOVE_ARIA_LABEL = 'Remove {name}';

/** Default accessible name of the cancel button of an in-progress upload. **/
export const FILE_CANCEL_ARIA_LABEL = 'Cancel {name}';

/** Default accessible name of the retry button of a failed file. **/
export const FILE_RETRY_ARIA_LABEL = 'Retry {name}';

/** Default per-file error when the file exceeds `maxSize`. **/
export const FILE_TOO_LARGE_MESSAGE = 'File exceeds the maximum size';

/** Default per-file error when the file does not match `accept`. **/
export const FILE_TYPE_NOT_ACCEPTED_MESSAGE = 'File type not accepted';

/** Default per-file error when the upload rejected without a message. **/
export const FILE_UPLOAD_FAILED_MESSAGE = 'Upload failed';

/** Default per-file error for a restored item whose upload never finished **/
export const FILE_UPLOAD_INTERRUPTED_MESSAGE =
  '{name} was not uploaded. Remove it and pick the file again.';

/** Default per-file error when `uploadService.remove` rejected without a message. **/
export const FILE_REMOVE_FAILED_MESSAGE = 'Could not remove the file';

/** Shown inside the disabled box when the host provided no `uploadService`. **/
export const MISSING_UPLOAD_SERVICE_MESSAGE = 'File uploads are not configured';

/** Default aria-live announcement after a successful upload. **/
export const FILE_UPLOADED_MESSAGE = '{name} uploaded.';

/** Default aria-live announcement after a removal. **/
export const FILE_REMOVED_MESSAGE = '{name} removed.';

/** Default aria-live announcement after a failed upload. **/
export const FILE_FAILED_MESSAGE = '{name} failed to upload.';

/**
 * Interpolates the runtime `{name}` token of the file upload strings.
 *
 * @param {string} template - The message or aria-label template.
 * @param {string} name - The file name.
 * @return {string} The interpolated text.
 */
export function formatFileMessage(template: string, name: string): string {
  return template.split('{name}').join(name);
}
