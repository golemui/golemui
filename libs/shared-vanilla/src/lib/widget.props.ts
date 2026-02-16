import * as Core from '@golemui/core';
import { WidgetPropertyFunctionParams } from '@golemui/core';
import { OptionValue } from './components';
import { DateRange } from './utils/date';

export type AccordionProps = {
  singleOpen?: boolean;
  defaultOpen?: { [key: string]: boolean };
  renderMode?: 'all' | 'activeOnly';
  sections: { label: string; uid: string }[];
};

export type TextinputProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
};

export type CurrencyProps = {
  currency?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  hint?: string;
  placeholder?: string;
  icon?: string;
};

export type TextareaProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  counterMode?: 'remaining' | 'current';
  minimumHeight?: number;
  autoGrow?: boolean;
  maxLength?: number;
};

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

export type RangeCalendarProps = {
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

export type DateinputProps = {
  hint?: string;
  icon?: string;
};

export type DatePickerProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  prevMonthIcon?: string;
  nextMonthIcon?: string;
  prevMonthAriaLabel?: string;
  nextMonthAriaLabel?: string;
  dayFormat?: 'numeric' | '2-digit';
  weekdayFormat?: 'short' | 'long' | 'narrow';
  monthFormat?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
};

export type NumberinputProps = {
  placeholder?: string;
  hint?: string;
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

export type RepeaterProps = {
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  template: Core.LayoutWidget<string>;
};

export type Option = {
  label: string;
  value: OptionValue;
};

export type SelectProps = {
  hint?: string;
  icon?: string;
  options: Option[];
  placeholder?: string;
  labelField?: string;
  valueField?: string;
};

export type ListItem<T> = {
  template: T;
  value: OptionValue;
};

type ItemKeys<T> = T extends Record<string, any> ? keyof T : string;
export type DropdownProps<T> = {
  placeholder?: string;
  hint?: string;
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
  valueField?: string;
  height?: number;
  itemHeight?: number;
  /**
   * Should match with one of the provided itemRenderer keys
   */
  itemRenderer?: string;
};

export type RadiogroupProps = {
  hint?: string;
  options: Option[];
  labelField?: string;
  valueField?: string;
};

export type OneOfProps = {
  labelField?: string;
  valueField?: string;
};

export type StackProps = {
  direction?: 'horizontal' | 'vertical';
};

export type TabsProps = {
  defaultOpen?: string;
  renderMode: 'all' | 'activeOnly';
  tabs: { label: string; uid: string }[];
};
