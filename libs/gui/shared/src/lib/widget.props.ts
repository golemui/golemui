import { type Localizable, type WidgetPropertyFunctionParams } from '@golemui/core';

export interface DateRange {
  start: string;
  end?: string;
}

/**
 * A selected date-time range value. Both ends are local ISO date-time strings
 * (`YYYY-MM-DDTHH:mm:ss`).
 */
export interface DateTimeRange {
  start: string;
  end: string;
}

export type AccordionProps = {
  singleOpen?: boolean;
  defaultOpen?: { [key: string]: boolean };
  renderMode?: 'all' | 'activeOnly';
  sections: { label: Localizable; uid: string }[];
};

// TODO: implement this
export type ButtonProps = {
  variant?: 'filled' | 'outlined' | 'link';
  icon?: string;
  iconPosition?: 'left' | 'right';
};

export type Autocomplete = 'on' | 'off' | (string & {});

export type TextinputProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  autocomplete?: Autocomplete;
};

export type TagsSeparator = 'Enter' | ',' | 'Tab' | 'blur' | (string & {});

export type TagsProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  separators?: TagsSeparator[];
  allowDuplicates?: boolean;
  trim?: boolean;
  removeAriaLabel?: string;
  removeIcon?: string;
};

export type PasswordProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  autocomplete?: Autocomplete;
  showPasswordIcon?: string;
  hidePasswordIcon?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export type CurrencyProps = {
  currency?: string;
  step?: number;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  hint?: string;
  placeholder?: string;
  icon?: string;
  autocomplete?: Autocomplete;
};

export type TextareaProps = {
  hint?: string;
  placeholder?: string;
  autocomplete?: Autocomplete;
  counterMode?: 'remaining' | 'current';
  minimumHeight?: number;
  autoGrow?: boolean;
  maxLength?: number;
};

type MarkdownButtons = 'H' | 'B' | 'I' | 'S' | 'Q' | 'L' | 'OL' | 'UL' | '|';
export type MarkdownProps = {
  /**
   * A collection of markdown-style formatting tokens.
   * * @remarks
   * Each token corresponds to a specific text decoration:
   * - **H**: Heading -> `### Title`
   * - **B**: Bold -> `**some text**`
   * - **I**: Italic -> `_some text_`
   * - **S**: Strikethrough -> `~~strikethrough~~`
   * - **Q**: Quote -> `> some text`
   * - **L**: Link -> `[some text](url)`
   * - **NL**: Ordered list -> `1. some text`
   * - **UL**: Unordered list -> `- some text`
   * - **|**: Separator -> `|`
   * * @example
   * ```ts
   * const toolbar = ['H', 'B', 'I', 'S', 'Q', 'L', '|', 'OL', 'UL'];
   * ```
   */
  tools?: MarkdownButtons[];
  headingTitle?: string;
  boldTitle?: string;
  italicTitle?: string;
  strikethroughTitle?: string;
  quoteTitle?: string;
  linkTitle?: string;
  orderedListTitle?: string;
  unorderedListTitle?: string;
  splitViewTitle?: string;
  toolbarAriaLabel?: string;
  defaultOpenPreview?: boolean;
} & TextareaProps;

export type CalendarProps = {
  /**
   * An optional descriptive text providing guidance or information about the associated field or functionality.
   */
  hint?: string;
  /**
   * A string representing the icon for navigating to the previous month.
   * This variable is optional and may define a custom icon as a CSS class
   * that will be used to visually represent the "previous month" navigation button.
   */
  prevMonthIcon?: string;
  /**
   * A string representing the icon for navigating to the previous month.
   * This variable is optional and may define a custom icon as a CSS class
   * that will be used to visually represent the "next month" navigation button.
   */
  nextMonthIcon?: string;
  /**
   * An optional string that represents the ARIA label for the previous month's navigation button.
   * This label is used to improve accessibility by providing screen readers with descriptive text.
   */
  prevMonthAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the next month's navigation button.
   * This label is used to improve accessibility by providing screen readers with descriptive text.
   */
  nextMonthAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the year-selector toggle button in the
   * calendar header. The current year is appended to it. Defaults to 'Select year'.
   */
  selectYearAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the year-selector grid.
   * Defaults to 'Year selection'.
   */
  yearGridAriaLabel?: string;
  /**
   * Specifies the formatting style for displaying the day portion of a date.
   *
   * The variable `dayFormat` can accept one of the following values:
   * - 'numeric': Displays the day as a numeric value without leading zeros (e.g., 1, 15, 31).
   * - '2-digit': Displays the day as a two-digit value with leading zeros if necessary (e.g., 01, 15, 31).
   *
   * This is typically used to configure date formatting options for internationalization purposes.
   */
  dayFormat?: 'numeric' | '2-digit';
  /**
   * Specifies the format of the weekday to be used.
   * Acceptable values are:
   * - 'short': Abbreviated format of the weekday (e.g., Mon, Tue).
   * - 'long': Full name of the weekday (e.g., Monday, Tuesday).
   * - 'narrow': Minimal format of the weekday, typically a single letter (e.g., M, T).
   * This property is typically used to customize the presentation of weekday names.
   */
  weekdayFormat?: 'short' | 'long' | 'narrow';
  /**
   * Specifies the format style to use when displaying month values.
   *
   * The accepted formats are:
   * - 'numeric': Displays the month as a number without leading zeros (e.g., "1" for January).
   * - '2-digit': Displays the month as a two-digit number with leading zeros as necessary (e.g., "01" for January).
   * - 'long': Displays the month as a full name (e.g., "January").
   * - 'short': Displays the month as an abbreviated name (e.g., "Jan").
   * - 'narrow': Displays a single letter representation of the month (e.g., "J" for January).
   *
   * This property is optional. When not specified, the default formatting behavior may depend on the context or implementation.
   */
  monthFormat?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /**
   * Represents the earliest allowable date in the calendar.
   * The value is optional and can be assigned as a string in an ISO date format.
   */
  minDate?: string;
  /**
   * Represents the latest allowable date in the calendar.
   * The value is optional and can be assigned as a string in an ISO date format.
   */
  maxDate?: string;
  /**
   * Represents an optional property that defines a set of date ranges
   * which are disabled or unavailable for selection.
   *
   * @type {DateRange[] | undefined}
   */
  disabledRanges?: DateRange[];
  /**
   * Specifies the number of months to be displayed in the calendar.
   * Default is 1.
   */
  numberOfMonths?: number;
};

/** Shared by every typed date/time widget that can be left half-filled. */
export type IncompleteMessageProps = {
  incompleteMessage?: Localizable;
};

/**
 * The opt-in select → edit → confirm flow on the range widgets' pills:
 * clicking a pill selects it and reveals in-pill action icons; Edit (icon, or
 * F2/E on the focused pill) loads it back into the compose surface, and
 * Confirm commits the replacement (Escape cancels) while the pill's label
 * live-previews the working value. `{label}` tokens are interpolated with the
 * range's display label at interaction time.
 */
export type RangeEditProps = {
  /** Enables selecting and editing pills in place. Defaults to false. */
  allowEdit?: boolean;
  /** Tooltip label of the pill's Edit icon. Defaults to 'Edit'. */
  editLabel?: Localizable;
  /** Edit hint joined into the pill's aria-description; `{label}` carries the range. Defaults to 'Edit range {label}'. */
  editAriaLabel?: Localizable;
  /** Tooltip label of the pill's Confirm icon. Defaults to 'Confirm'. */
  confirmEditLabel?: Localizable;
  /** Tooltip label of the pill's Cancel icon. Defaults to 'Cancel'. */
  cancelEditLabel?: Localizable;
  /** aria-live announcement when an edit starts. Defaults to 'Editing range {label}.'. */
  editStartedMessage?: Localizable;
  /** aria-live announcement when an edit commits. Defaults to 'Range updated to {label}.'. */
  editCommittedMessage?: Localizable;
  /** aria-live announcement when an edit is cancelled. Defaults to 'Edit cancelled.'. */
  editCancelledMessage?: Localizable;
};

/**
 * Calendar with an embedded time picker. The value is a local ISO date-time
 * (YYYY-MM-DDTHH:mm:ss), emitted only when both the day and the time are
 * selected; picking a different day clears the time and emits null. With
 * numberOfMonths > 1 the time row and grid render on the first panel only.
 */
export type DateTimeCalendarProps = CalendarProps &
  IncompleteMessageProps & {
    /** '12' or '24'. Defaults to the locale's hour cycle. */
    hourFormat?: '12' | '24';
    /** Minutes between selectable slots. Defaults to 30. */
    minuteStep?: number;
    /** First selectable time (ISO time, inclusive). Defaults to '00:00:00'. */
    minTime?: string;
    /** Last selectable time (ISO time, inclusive). Defaults to '23:59:59'. */
    maxTime?: string;
    /** Times inside these ranges render disabled; entries can scope per day. */
    disabledTimeRanges?: DisabledTimeRange[];
    /** Allows typing a time in the input; when false (default) times come only from the grid. */
    allowCustomTime?: boolean;
    minTimeMessage?: Localizable;
    maxTimeMessage?: Localizable;
    disabledTimeRangeMessage?: Localizable;
    /** Shown in the time grid when the bounds yield no slots. Defaults to 'No available times'. */
    noAvailableTimesMessage?: Localizable;
  };

export type RangeCalendarProps = RangeEditProps & {
  /**
   * An optional descriptive text providing guidance or information about the associated widget or functionality.
   */
  hint?: string;
  /**
   * A string representing the icon for navigating to the previous month.
   * This variable is optional and may define a custom icon as a CSS class
   * that will be used to visually represent the "previous month" navigation button.
   */
  prevMonthIcon?: string;
  /**
   * A string representing the icon for navigating to the previous month.
   * This variable is optional and may define a custom icon as a CSS class
   * that will be used to visually represent the "next month" navigation button.
   */
  nextMonthIcon?: string;
  /**
   * An optional string that represents the ARIA label for the previous month's navigation button.
   * This label is used to improve accessibility by providing screen readers with descriptive text.
   */
  prevMonthAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the next month's navigation button.
   * This label is used to improve accessibility by providing screen readers with descriptive text.
   */
  nextMonthAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the year-selector toggle button in the
   * calendar header. The current year is appended to it. Defaults to 'Select year'.
   */
  selectYearAriaLabel?: string;
  /**
   * An optional string that represents the ARIA label for the year-selector grid.
   * Defaults to 'Year selection'.
   */
  yearGridAriaLabel?: string;
  /**
   * Specifies the formatting style for displaying the day portion of a date.
   *
   * The variable `dayFormat` can accept one of the following values:
   * - 'numeric': Displays the day as a numeric value without leading zeros (e.g., 1, 15, 31).
   * - '2-digit': Displays the day as a two-digit value with leading zeros if necessary (e.g., 01, 15, 31).
   *
   * This is typically used to configure date formatting options for internationalization purposes.
   */
  dayFormat?: 'numeric' | '2-digit';
  /**
   * Specifies the format of the weekday to be used.
   * Acceptable values are:
   * - 'short': Abbreviated format of the weekday (e.g., Mon, Tue).
   * - 'long': Full name of the weekday (e.g., Monday, Tuesday).
   * - 'narrow': Minimal format of the weekday, typically a single letter (e.g., M, T).
   * This property is typically used to customize the presentation of weekday names.
   */
  weekdayFormat?: 'short' | 'long' | 'narrow';
  /**
   * Specifies the format style to use when displaying month values.
   *
   * The accepted formats are:
   * - 'numeric': Displays the month as a number without leading zeros (e.g., "1" for January).
   * - '2-digit': Displays the month as a two-digit number with leading zeros as necessary (e.g., "01" for January).
   * - 'long': Displays the month as a full name (e.g., "January").
   * - 'short': Displays the month as an abbreviated name (e.g., "Jan").
   * - 'narrow': Displays a single letter representation of the month (e.g., "J" for January).
   *
   * This property is optional. When not specified, the default formatting behavior may depend on the context or implementation.
   */
  monthFormat?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /**
   * Represents the earliest allowable date in the calendar.
   * The value is optional and can be assigned as a string in an ISO date format.
   */
  minDate?: string;
  /**
   * Represents the latest allowable date in the calendar.
   * The value is optional and can be assigned as a string in an ISO date format.
   */
  maxDate?: string;
  /**
   * Represents an optional property that defines a set of date ranges
   * which are disabled or unavailable for selection.
   *
   * @type {DateRange[] | undefined}
   */
  disabledRanges?: DateRange[];
  /**
   * Error surfaced when a selected range spans one or more disabled days. The
   * whole range is rejected (no pill added), rather than split around the
   * disabled days — consistent with the time pickers. Defaults to
   * "Invalid date: date is within a disabled range."
   */
  disabledDateRangeMessage?: Localizable;
  /**
   * Specifies the number of months to be displayed in the calendar.
   * Default is 1.
   */
  numberOfMonths?: number;
  /**
   * An optional string used as the ARIA label prefix for the remove button on each date range pill.
   */
  removePillAriaLabel?: string;
};

export type DateinputProps = IncompleteMessageProps & {
  hint?: string;
  icon?: string;
  dayAriaLabel?: string;
  monthAriaLabel?: string;
  yearAriaLabel?: string;
  invalidDateMessage?: Localizable;
  /** Earliest allowed date (ISO date, inclusive). */
  minDate?: string;
  /** Latest allowed date (ISO date, inclusive). */
  maxDate?: string;
  minDateMessage?: Localizable;
  maxDateMessage?: Localizable;
};

export type DateTimeInputProps = IncompleteMessageProps & {
  hint?: string;
  icon?: string;
  dayAriaLabel?: string;
  monthAriaLabel?: string;
  yearAriaLabel?: string;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  dayPeriodAriaLabel?: string;
  hourFormat?: '12' | '24';
  minuteStep?: number;
  invalidDateMessage?: Localizable;
  /** Earliest allowed date (ISO date, inclusive). */
  minDate?: string;
  /** Latest allowed date (ISO date, inclusive). */
  maxDate?: string;
  /** First allowed time (ISO time, inclusive). */
  minTime?: string;
  /** Last allowed time (ISO time, inclusive). */
  maxTime?: string;
  minDateMessage?: Localizable;
  maxDateMessage?: Localizable;
  minTimeMessage?: Localizable;
  maxTimeMessage?: Localizable;
};

export type TimeInputProps = IncompleteMessageProps & {
  hint?: string;
  icon?: string;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  dayPeriodAriaLabel?: string;
  hourFormat?: '12' | '24';
  minuteStep?: number;
  /** First allowed time (ISO time, inclusive). */
  minTime?: string;
  /** Last allowed time (ISO time, inclusive). */
  maxTime?: string;
  minTimeMessage?: Localizable;
  maxTimeMessage?: Localizable;
};

/**
 * A time range value (also the base of {@link DisabledTimeRange}).
 */
export type TimeRange = {
  start: string;
  end: string;
};

export type DisabledTimeRange = TimeRange & {
  /** ISO date (YYYY-MM-DD): the range only applies on that date. */
  date?: string;
  /** Weekday numbers as returned by Date.prototype.getDay(): 0=Sunday … 6=Saturday. */
  weekdays?: number[];
};

export type TimePickerProps = TimeInputProps &
  PickerToggleProps & {
    /** Times inside these ranges (both ends inclusive) render disabled. */
    disabledRanges?: TimeRange[];
    /** Allows typing a time in the input; when false (default) values come only from the list. */
    allowCustomTime?: boolean;
    height?: number;
    itemHeight?: number;
    disabledRangeMessage?: Localizable;
    noAvailableTimesMessage?: Localizable;
  };

export type RangeDateInputProps = IncompleteMessageProps &
  RangeEditProps & {
    hint?: string;
    icon?: string;
    separator?: string;
    removePillAriaLabel?: string;
    startDateAriaLabel?: string;
    endDateAriaLabel?: string;
    dayAriaLabel?: string;
    monthAriaLabel?: string;
    yearAriaLabel?: string;
    invalidDateMessage?: Localizable;
  };

export type DateBoundsMessageProps = {
  minDateMessage?: Localizable;
  maxDateMessage?: Localizable;
  disabledDateRangeMessage?: Localizable;
};

/** The popup toggle button shared by the six pickers and the two dropdowns. */
export type PickerToggleProps = {
  toggleAriaLabel?: string;
};

export type DatePickerProps = CalendarProps &
  DateinputProps &
  DateBoundsMessageProps &
  PickerToggleProps;

export type DateTimePickerProps = DateTimeCalendarProps &
  DateTimeInputProps &
  DateBoundsMessageProps &
  PickerToggleProps;

export type RangeDatePickerProps = RangeCalendarProps &
  RangeDateInputProps &
  DateBoundsMessageProps &
  PickerToggleProps;

export type RangeDateTimeCalendarProps = Omit<
  RangeCalendarProps,
  'minDate' | 'maxDate' | 'disabledRanges' | 'disabledDateRangeMessage'
> &
  IncompleteMessageProps & {
    hourFormat?: '12' | '24';
    minuteStep?: number;
    /** Allows typing a time in each picker; when false (default) times come only from the grid. */
    allowCustomTime?: boolean;
    /** Visible heading on the start time picker. Defaults to "Start time". */
    startTimeLabel?: Localizable;
    /** Visible heading on the end time picker. Defaults to "End time". */
    endTimeLabel?: Localizable;
    /** Earliest allowed instant (ISO date-time, inclusive). */
    minDateTime?: string;
    /** Latest allowed instant (ISO date-time, inclusive). */
    maxDateTime?: string;
    minDateTimeMessage?: Localizable;
    maxDateTimeMessage?: Localizable;
    /** Disabled instant spans. Blocking a whole day is a span of 00:00:00–23:59:59. */
    disabledRanges?: DateTimeRange[];
    /** Error surfaced when a selected range steps over, or overlaps, a disabled span. */
    disabledRangeMessage?: Localizable;
    /** Shown in a time grid when the bounds yield no slots. Defaults to 'No available times'. */
    noAvailableTimesMessage?: Localizable;
    /**
     * ARIA label template for the per-day count badge; a `{count}` token is
     * substituted with the number of ranges on that day. Defaults to '{count} ranges'.
     */
    dayCountAriaLabel?: Localizable;
    /**
     * ARIA label template for the grey per-day disabled-spans badge shown on
     * partially-blocked days; a `{count}` token is substituted with the number of
     * disabled spans on that day. Defaults to '{count} disabled ranges'.
     */
    disabledDayCountAriaLabel?: Localizable;
  };

export type RangeTimeInputProps = IncompleteMessageProps &
  RangeEditProps & {
    hint?: string;
    icon?: string;
    separator?: string;
    removePillAriaLabel?: string;
    startTimeAriaLabel?: string;
    endTimeAriaLabel?: string;
    hourAriaLabel?: string;
    minuteAriaLabel?: string;
    dayPeriodAriaLabel?: string;
    hourFormat?: '12' | '24';
    minuteStep?: number;
    /** First allowed time (ISO time, inclusive). */
    minTime?: string;
    /** Last allowed time (ISO time, inclusive). */
    maxTime?: string;
    minTimeMessage?: Localizable;
    maxTimeMessage?: Localizable;
    /** Shown when the entered "time out" is not strictly after "time in". */
    rangeOrderMessage?: Localizable;
  };

export type RangeDateTimeInputProps = IncompleteMessageProps &
  RangeEditProps & {
    hint?: string;
    icon?: string;
    separator?: string;
    removePillAriaLabel?: string;
    startDateTimeAriaLabel?: string;
    endDateTimeAriaLabel?: string;
    dayAriaLabel?: string;
    monthAriaLabel?: string;
    yearAriaLabel?: string;
    hourAriaLabel?: string;
    minuteAriaLabel?: string;
    dayPeriodAriaLabel?: string;
    hourFormat?: '12' | '24';
    minuteStep?: number;
    invalidDateMessage?: Localizable;
    /**
     * Earliest allowed date-time (ISO date-time, inclusive). Each endpoint of the
     * value is an instant, so the bound is an instant too: a date-only bound
     * cannot say whether its last day is allowed until 00:00 or 23:59.
     */
    minDateTime?: string;
    /** Latest allowed date-time (ISO date-time, inclusive). */
    maxDateTime?: string;
    minDateTimeMessage?: Localizable;
    maxDateTimeMessage?: Localizable;
  };

/**
 * The date-time range picker is the calendar (instant-space bounds, disabled
 * spans, two time pickers, per-day count badge) with the typed range input as
 * its trigger.
 */
export type RangeDateTimePickerProps = RangeDateTimeCalendarProps &
  RangeDateTimeInputProps &
  PickerToggleProps;

export type RangeTimePickerProps = RangeTimeInputProps &
  PickerToggleProps & {
    /** Times inside these ranges (both ends inclusive) render disabled. */
    disabledRanges?: TimeRange[];
    /** Allows typing a time in the input; when false (default) values come only from the lists. */
    allowCustomTime?: boolean;
    height?: number;
    itemHeight?: number;
    /** Visible heading above the "time in" list in the popover. Defaults to "Start time". */
    startTimeLabel?: Localizable;
    /** Visible heading above the "time out" list in the popover. Defaults to "End time". */
    endTimeLabel?: Localizable;
    disabledRangeMessage?: Localizable;
    noAvailableTimesMessage?: Localizable;
  };

export type NumberinputProps = {
  placeholder?: string;
  hint?: string;
  autocomplete?: Autocomplete;
  step?: number;
  minimum?: number;
  maximum?: number;
  autoGrow?: true;
};

export type CheckboxProps = {
  checkboxPosition?: 'left' | 'right';
  hint?: string;
};

export type ToggleProps = {
  togglePosition?: 'left' | 'right';
  hint?: string;
};

export type AlertProps = {
  text: string;
  level?: 'default' | 'info' | 'success' | 'warning' | 'error';
};

export type MarkdownTextProps = {
  md: string;
};

/**
 * Non-serializable component props. Used to render the provided component.
 * @template ComponentType Framework-dependent type for the component. e.g. ReactNode, Type<any>
 */
export type RendererProps<ComponentType = unknown> = {
  render: ComponentType;
};

/**
 * Non-serializable component props for Angular. Used to render the provided component.
 * @template ComponentType Framework-dependent type for the component. e.g. ReactNode, Type<any>
 */
export type ComponentRendererProps<ComponentType = unknown> = {
  render: { component: ComponentType; api: WidgetPropertyFunctionParams<any> };
};

// TODO: do we need an {"minItems": 1} property or can it handled by the validators?
export type RepeaterProps<Template> = {
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  template: Template;
  title?: string;
  addButtonIcon?: string;
  removeButtonIcon?: string;
};

export type OptionValue = string | number;

export type Option = {
  label: string;
  value: OptionValue;
};

export type SelectProps = {
  hint?: string;
  icon?: string;
  autocomplete?: Autocomplete;
  options: Option[];
  placeholder?: string;
  labelField?: string;
  valueField?: string;
  invalidOptionMessage?: Localizable;
};

export type ListItem<T> = {
  template: T;
  value: OptionValue;
  /** Disabled items render greyed out, are skipped by keyboard navigation and cannot be selected */
  disabled?: boolean;
};

type ItemKeys<T> = T extends Record<string, any> ? keyof T : string;
export type DropdownProps<T> = PickerToggleProps & {
  placeholder?: string;
  hint?: string;
  icon?: string;
  autocomplete?: Autocomplete;
  items: ListItem<T>[];
  /**
   * Property widget used to display in the input when an item option is selected
   */
  labelField?: ItemKeys<T>;
  valueField?: ItemKeys<T>;
  searchFields?: ItemKeys<T>[];
  height?: number;
  itemHeight?: number;
  /**
   * Should match with one of the provided itemRenderer keys
   */
  itemRenderer?: string;
  /**
   * Time in milliseconds to wait on each keystroke to trigger the input event. Default: 500
   */
  inputDebounce?: number;
};

export type ListProps<T> = {
  hint?: string;
  items: ListItem<T>[];
  labelField?: ItemKeys<T>;
  valueField?: ItemKeys<T>;
  height?: number;
  itemHeight?: number;
  /**
   * Should match with one of the provided itemRenderer keys
   */
  itemRenderer?: string;
};

export type MultiDropdownProps<T> = DropdownProps<T> & {
  removeAriaLabel?: string;
  removeIcon?: string;
};

export type MultiListProps<T> = ListProps<T>;

/**
 * Shared by `fileUpload` and `multiFileUpload`. The widget is a one-line input:
 * the box is the drop target and holds the upload button; while a file uploads
 * the box itself becomes the progress bar. Message props accept a `{name}`
 * token that is replaced with the file name.
 */
export type FileUploadBaseProps = {
  hint?: string;
  icon?: string;
  /**
   * Accepted file types, e.g. `['image/*', '.pdf']`. Matched by the widget
   * before uploading (drag & drop bypasses the picker's own filter) and also
   * passed to the file picker as a hint.
   */
  accept?: string[];
  /** Maximum size per file, in bytes. Larger files are refused before uploading. */
  maxSize?: number;
  /** Text of the upload button inside the box. Defaults to 'Upload file' / 'Upload files'. */
  buttonLabel?: Localizable;
  /** Accessible name of the remove button. Defaults to 'Remove {name}'. */
  removeAriaLabel?: Localizable;
  /** Accessible name of the cancel button shown while uploading. Defaults to 'Cancel {name}'. */
  cancelAriaLabel?: Localizable;
  /** Accessible name of the retry button shown on a failed file. Defaults to 'Retry {name}'. */
  retryAriaLabel?: Localizable;
  /** Icon class for the remove/cancel button; falls back to the built-in icon. */
  removeIcon?: string;
  /** Icon class for the retry button; falls back to the built-in icon. */
  retryIcon?: string;
  /** Error shown when a file exceeds `maxSize`. Defaults to 'File exceeds the maximum size'. */
  maxSizeMessage?: Localizable;
  /** Error shown when a file does not match `accept`. Defaults to 'File type not accepted'. */
  acceptMessage?: Localizable;
  /** Default per-file error for a restored item whose upload never finished **/
  interruptedMessage?: Localizable;
  /** Shown inside the disabled box when the host provided no `uploadService`. */
  missingServiceMessage?: Localizable;
  /** aria-live announcement after a successful upload. Defaults to '{name} uploaded.'. */
  uploadedMessage?: Localizable;
  /** aria-live announcement after a removal. Defaults to '{name} removed.'. */
  removedMessage?: Localizable;
  /** aria-live announcement after a failed upload. Defaults to '{name} failed to upload.'. */
  failedMessage?: Localizable;
};

export type FileUploadProps = FileUploadBaseProps;

export type MultiFileUploadProps = FileUploadBaseProps;

export type RadiogroupProps = {
  hint?: string;
  options: Option[];
  labelField?: string;
  valueField?: string;
  direction?: 'row' | 'column';
};

export type OneOfProps = {
  labelField?: string;
  valueField?: string;
};

export type FlexProps = {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justify?: 'center' | 'start' | 'end' | 'stretch';
  align?: 'center' | 'start' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: number;
};

export type GridProps = {
  direction?: 'row' | 'column';
  columnGap?: number;
  rowGap?: number;
  autoFit?: boolean;
  align?:
    | 'center'
    | 'start'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch';
  justify?: 'center' | 'start' | 'end' | 'stretch';
};

export type TabsProps = {
  defaultOpen?: string;
  renderMode?: 'all' | 'activeOnly';
  tabs: { label: string; uid: string }[];
};
