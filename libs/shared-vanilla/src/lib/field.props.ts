import * as Core from '@golemui/core';
import { OptionValue } from './components/select';

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

export type TextareaProps = {
  hint?: string;
  placeholder?: string;
  icon?: string;
  counterMode?: 'remaining' | 'current';
  minimumHeight?: number;
  autoGrow?: boolean;
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

export type RepeaterProps = {
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  template: Core.FormField<string>;
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

export type RadiogroupProps = {
  hint?: string;
  options: Option[];
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
