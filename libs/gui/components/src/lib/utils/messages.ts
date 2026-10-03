/**
 * The user-facing strings of GolemUI Components: validation messages, accessible names and
 * announcements. Every element resolves a string in this order:
 *
 * 1. the element's own prop for it, when set (`toggleAriaLabel`, `invalidDateMessage`…);
 * 2. the app's translate function, see {@link configureMessages};
 * 3. the English default below.
 *
 * Runtime values are `{token}`s in single braces (`{min}`, `{name}`, `{count}`): the translate
 * function receives them as params, and any token still in its result is filled in afterwards.
 * Single braces keep them clear of the `{{…}}` interpolation of most i18n libraries.
 *
 * A string with a `{count}` has an English default per plural category: the translate function
 * receives the one for that count, and does its own language's plurals from `params.count`.
 *
 * The keys are public API: apps use them in their translation files.
 */
export const DEFAULT_MESSAGES = {
  // ─── Native form validation ───
  valueMissing: 'Please fill out this field.',
  rangeUnderflow: 'Value must be greater than or equal to {min}.',
  rangeOverflow: 'Value must be less than or equal to {max}.',

  // ─── Date and time errors (`gui-input-error`) ───
  invalidDate: 'Invalid date: day is greater than the maximum valid day for the month and year.',
  minDate: 'Invalid date: date is before the minimum allowed date.',
  maxDate: 'Invalid date: date is after the maximum allowed date.',
  disabledDateRange: 'Invalid date: date is within a disabled range.',
  minTime: 'Invalid time: time is before the minimum allowed time.',
  maxTime: 'Invalid time: time is after the maximum allowed time.',
  timeRangeOrder: 'Invalid range: end time must be after start time.',
  disabledTimeRange: 'Invalid time: time is within a disabled range.',
  minDateTime: 'Invalid date-time: date-time is before the minimum allowed date-time.',
  maxDateTime: 'Invalid date-time: date-time is after the maximum allowed date-time.',
  incompleteDate: 'Incomplete date: fill in all date parts.',
  incompleteTime: 'Incomplete time: fill in all time parts.',
  incompleteDateTime: 'Incomplete date-time: fill in all date and time parts.',
  noAvailableTimes: 'No available times',
  invalidOption: "Invalid selection: '{value}' is not a valid option.",

  // ─── Date and time parts ───
  day: 'Day',
  month: 'Month',
  year: 'Year',
  hour: 'Hour',
  minute: 'Minute',
  second: 'Second',
  dayPeriod: 'AM/PM',

  // ─── Calendars and pickers ───
  calendar: 'Calendar',
  showCalendar: 'Show calendar',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  selectYear: 'Select year',
  yearSelection: 'Year selection',
  timeList: 'Time list',
  showTimeList: 'Show time list',
  startTime: 'Start time',
  endTime: 'End time',

  // ─── Ranges ───
  startDate: 'Start date',
  endDate: 'End date',
  startDateTime: 'Start date-time',
  endDateTime: 'End date-time',
  removeDate: 'Remove date',
  removeTime: 'Remove time',
  removeDateTime: 'Remove date-time',
  selectedDateRanges: 'Selected date ranges',
  selectedTimeRanges: 'Selected time ranges',
  selectedDateTimeRanges: 'Selected date-time ranges',
  dateRangeCount: { one: '{count} date range', other: '{count} date ranges' },
  timeRangeCount: { one: '{count} time range', other: '{count} time ranges' },
  dateTimeRangeCount: { one: '{count} date-time range', other: '{count} date-time ranges' },
  dayRangeCount: { one: '{count} range', other: '{count} ranges' },
  disabledTimeRangeCount: { one: '{count} disabled range', other: '{count} disabled ranges' },

  // ─── In-place range editing: `{label}` is the range's display label ───
  editRange: 'Edit',
  confirmEditRange: 'Confirm',
  cancelEditRange: 'Cancel',
  editRangeHint: 'Edit range {label}',
  editRangeStarted: 'Editing range {label}.',
  editRangeCommitted: 'Range updated to {label}.',
  editRangeCancelled: 'Edit cancelled.',

  // ─── Pills, tags and multi-select ───
  selectedItems: 'Selected items',
  itemCount: { one: '{count} item', other: '{count} items' },
  remove: 'Remove',
  removeTag: 'Remove tag',
  tagCount: { one: '{count} tag', other: '{count} tags' },
  selectedTags: 'Selected tags',
  selectedOptions: 'Selected options',
  removeOption: 'Remove option',
  selectedCount: '{count} selected',

  // ─── Select and radio group ───
  selectAnOption: 'Select an option',
  loading: 'Loading...',

  // ─── Password ───
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  show: 'Show',
  hide: 'Hide',

  // ─── Markdown editor ───
  textFormatting: 'Text formatting',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  heading: 'Heading',
  link: 'Link',
  quote: 'Quote',
  orderedList: 'Ordered List',
  unorderedList: 'Unordered List',
  splitView: 'Split View',

  // ─── File upload: `{name}` is the file name ───
  uploadFile: 'Upload file',
  uploadFiles: 'Upload files',
  uploadedFiles: 'Uploaded files',
  fileCount: { one: '{count} file', other: '{count} files' },
  removeFile: 'Remove {name}',
  cancelFile: 'Cancel {name}',
  retryFile: 'Retry {name}',
  fileTooLarge: 'File exceeds the maximum size',
  fileTypeNotAccepted: 'File type not accepted',
  uploadFailed: 'Upload failed',
  uploadInterrupted: '{name} was not uploaded. Remove it and pick the file again.',
  removeFailed: 'Could not remove the file',
  missingUploadService: 'File uploads are not configured',
  fileUploaded: '{name} uploaded.',
  fileRemoved: '{name} removed.',
  fileFailed: '{name} failed to upload.',
} as const;

/** An English default that depends on `{count}`, by `Intl.PluralRules` category. */
type PluralDefault = { readonly one: string; readonly other: string };

const englishPlurals = new Intl.PluralRules('en');

/** The English default of a string, picked by `params.count` when it has plural forms. */
function englishDefault(key: GuiMessageKey, params?: GuiMessageParams): string {
  const text: string | PluralDefault = DEFAULT_MESSAGES[key];
  if (typeof text === 'string') return text;
  return englishPlurals.select(Number(params?.['count'])) === 'one' ? text.one : text.other;
}

/** The key of a GolemUI string, see {@link DEFAULT_MESSAGES}. */
export type GuiMessageKey = keyof typeof DEFAULT_MESSAGES;

/** The runtime values of a string, by `{token}` name. */
export type GuiMessageParams = Record<string, string | number>;

/**
 * Translates a GolemUI string, typically by delegating to the app's i18n library. Returning
 * `undefined` or `null` falls back to the English default.
 */
export type GuiTranslate = (
  key: GuiMessageKey,
  defaultText: string,
  params?: GuiMessageParams,
) => string | null | undefined;

interface MessagesState {
  translate: GuiTranslate | null;
  /** The connected elements, re-rendered when the translate function changes. */
  elements: Set<{ requestUpdate(): void }>;
}

// On globalThis, so every copy of the package shares one configuration (see safeDefine).
const STATE_KEY = Symbol.for('golemui.messages');
const state: MessagesState = ((globalThis as Record<symbol, MessagesState | undefined>)[
  STATE_KEY
] ??= { translate: null, elements: new Set() });

/**
 * Plugs the app's i18n library into every GolemUI element. Call it again, for example on a
 * language change, to re-render the connected elements with the new strings; `null` restores the
 * English defaults.
 *
 * @param translate - Resolves a string from its key, English default and params.
 * @example
 * configureMessages((key, defaultText, params) =>
 *   i18next.t(`ui.${key}`, { defaultValue: defaultText, ...params }),
 * );
 */
export function configureMessages(translate: GuiTranslate | null): void {
  state.translate = translate;
  for (const element of state.elements) {
    element.requestUpdate();
  }
}

/** Keeps an element in sync with {@link configureMessages} while it is connected. */
export function trackMessages(element: { requestUpdate(): void }, connected: boolean): void {
  if (connected) {
    state.elements.add(element);
  } else {
    state.elements.delete(element);
  }
}

/** Fills in the `{token}`s of a string. */
export function interpolate(text: string, params?: GuiMessageParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (token, name: string) =>
    name in params ? String(params[name]) : token,
  );
}

/**
 * Resolves a string: the element's own `override` when set, else the app's translation, else the
 * English default, with its `{token}`s filled in from `params`.
 */
export function message(
  key: GuiMessageKey,
  override?: string | null,
  params?: GuiMessageParams,
): string {
  const defaultText = englishDefault(key, params);
  const text = override ?? state.translate?.(key, defaultText, params) ?? defaultText;
  return interpolate(text, params);
}

/**
 * Resolves the accessible name of a control that can't do without one, such as an icon button, a
 * date part or a dialog. An empty override or translation falls back like a missing one: an
 * unnamed control fails WCAG 4.1.2.
 */
export function requiredName(
  key: GuiMessageKey,
  override?: string | null,
  params?: GuiMessageParams,
): string {
  const defaultText = englishDefault(key, params);
  const text = override || state.translate?.(key, defaultText, params) || defaultText;
  return interpolate(text, params);
}

/**
 * Resolves the accessible name of a part that only adds context, such as the start of a range or a
 * toolbar. An empty override removes it, since such a part needs no name.
 */
export function optionalName(
  key: GuiMessageKey,
  override?: string | null,
  params?: GuiMessageParams,
): string | undefined {
  return override === '' ? undefined : requiredName(key, override, params);
}

/**
 * Interpolates the runtime `{label}` token of the range editing strings.
 *
 * @param {string} template - The message or aria-label template.
 * @param {string} label - The range's display label.
 * @return {string} The interpolated text.
 */
export function formatEditMessage(template: string, label: string): string {
  return interpolate(template, { label });
}
