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
  valueType?: 'string' | 'number' | 'boolean';
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
