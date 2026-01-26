import * as Core from '@golemui/core';
import { OptionValue } from './components';

export type AccordionProps = {
  singleOpen?: boolean;
  defaultOpen?: { [key: string]: boolean };
  sections: { label: string; uid: string }[];
};

export type TextinputProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
};

export type CurrencyProps = {
  currency?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  hint?: string;
  placeholder?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
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
  hint?: string;
  prevMonthIcon?: string;
  nextMonthIcon?: string;
  dayFormat?: 'numeric' | '2-digit';
  weekdayFormat?: 'short' | 'long' | 'narrow';
  monthFormat?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
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
  dayFormat?: 'numeric' | '2-digit';
  weekdayFormat?: 'short' | 'long' | 'narrow';
  monthFormat?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
};

export type NumberinputProps = {
  placeholder?: string;
  hint?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  step?: number;
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

export type RepeaterProps = {
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  template: Core.LayoutField<string>;
};

export type Option = {
  label: string;
  value: OptionValue;
};

export type SelectProps = {
  hint?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  options: Option[];
  placeholder?: string;
  labelField?: string;
  valueField?: string;
};

export type ListItem<T> = {
  template: T;
  value: OptionValue;
};

export type DropdownProps<T> = {
  placeholder?: string;
  hint?: string;
  items: ListItem<T>[];
  /**
   * Property field used to display in the input when an item option is selected
   */
  labelField?: keyof T;
  valueField?: keyof T;
  searchFields?: (keyof T)[];
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
  tabs: { label: string; uid: string }[];
};
