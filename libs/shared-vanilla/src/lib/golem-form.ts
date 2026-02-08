import * as Core from '@golemui/core';
import { Validator } from '@golemui/validators-vanilla';
import { OptionValue } from './components';
import * as Props from './widget.props';

// -------------------
//
// Utils
//
// -------------------

type ExtractStates<S> = S extends Record<string, Core.ReactiveExpression> ? keyof S : never;

type DeepPartialUid<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => DeepPartialUid<R>
  : T extends any[]
    ? _DeepPartialUidArray<T>
    : T extends object
      ? {
          [K in keyof T as K extends 'uid' ? never : K]: DeepPartialUid<T[K]>;
        } & {
          uid?: string;
        }
      : T;

// Avoid circular reference issues in some TS versions
type _DeepPartialUidArray<T extends any[]> = {
  [P in keyof T]: DeepPartialUid<T[P]>;
};

// -------------------
//
// Golem Form Builder
//
// -------------------

class GolemFormBuilder<FormType extends Record<string, any>> {
  public create<States extends Record<string, Core.ReactiveExpression>>(config: {
    states?: States;
    form: DeepPartialUid<GolemWidget<FormType, ExtractStates<States>, Validator>>[];
  }): Core.Form<ExtractStates<States>, FormType> {
    return {
      states: config.states,
      form: {
        uid: 'gui-root-uid',
        type: 'stack',
        kind: 'layout',
        children: config.form,
      } as Core.LayoutWidget<ExtractStates<States>, FormType>,
    };
  }
}

export function golemForm<FormType extends Record<string, any>>() {
  return new GolemFormBuilder<FormType>();
}

// ---
// Example
// ---

/*
type FormType = { name: string; registerMode: boolean };

export const myDemoForm = golemForm<FormType>().create({
  states: {
    registering: '$form.register === true',
  },
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'name',
      label: 'Label',
      'label.registering': '',
      props: { placeholder: (api) => api.$form.name, 'placeholder.registering': 'asas' },
    },
    (api) => ({
      kind: 'input',
      type: 'textinput',
      path: 'something',
      label: api?.$form.name ? api?.$form.name : 'No name yet',
    }),
    {
      kind: 'layout',
      type: 'stack',
      props: { direction: 'horizontal' },
      children: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'surname',
          props: { hint: 'not type safe' },
        },
        {
          kind: 'layout',
          type: 'stack',
          children: [
            {
              kind: 'input',
              type: 'checkbox',
              path: 'yay',

              props: {
                hint: 'not type safe',
                checkboxPosition: ({ $form }) => {
                  return $form.registerMode ? 'left' : 'right';
                },
              },
            },
            { kind: 'action', type: 'button' },
          ],
        },
      ],
    },
  ],
});
*/

// -------------------
//
// Golem Widgets
//
// -------------------

type GolemWidget<FormType extends Record<string, any>, States extends string, V> =
  | GuiAccordion<FormType, States>
  | GuiAlert<FormType, States>
  | GuiButton<FormType, States>
  | GuiCalendar<FormType, States, V>
  | GuiCheckbox<FormType, States, V>
  | GuiCurrency<FormType, States, V>
  | GuiDateinput<FormType, States, V>
  | GuiDatePicker<FormType, States, V>
  | GuiDropdown<FormType, States, V>
  | GuiFunctionWidget<FormType, States>
  | GuiList<FormType, States, V>
  | GuiNumberinput<FormType, States, V>
  | GuiRadiogroup<FormType, States, V>
  | GuiRangeCalendar<FormType, States, V>
  //| GuiRenderer<FormType, States>
  | GuiRepeater<FormType, States, V>
  | GuiSelect<FormType, States, V>
  | GuiStack<FormType, States>
  | GuiTabs<FormType, States>
  | GuiTextarea<FormType, States, V>
  | GuiTextInput<FormType, States, V>
  | GuiToggle<FormType, States, V>;

type GuiAccordion<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.AccordionProps,
  GolemWidget<FormType, States, Validator>[]
> & { type: 'accordion' };

type GuiAlert<FormType extends Record<string, any>, States extends string> = Core.DisplayWidget<
  States,
  FormType,
  Props.AlertProps
> & { type: 'alert' };

type GuiButton<FormType extends Record<string, any>, States extends string> = Core.ActionWidget<
  States,
  FormType,
  never
> & { type: 'button' };

type GuiCalendar<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.CalendarProps,
  V
> & { type: 'calendar' };

type GuiCheckbox<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  boolean,
  States,
  FormType,
  Props.CheckboxProps,
  V
> & { type: 'checkbox' };

type GuiCurrency<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  number,
  States,
  FormType,
  Props.CurrencyProps,
  V
> & { type: 'currency' };

type GuiDateinput<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<string, States, FormType, Props.DateinputProps, V> & { type: 'dateInput' };

type GuiDatePicker<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<string, States, FormType, Props.DatePickerProps, V> & { type: 'datePicker' };

type GuiDropdown<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.DropdownProps<unknown>,
  V
> & { type: 'dropdown' };

type GuiFunctionWidget<FormType extends Record<string, any>, States extends string> = (
  api?: Core.FunctionWidgetParams<FormType>,
) => Exclude<GolemWidget<FormType, States, Validator>, () => any>;

type GuiList<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.ListProps<unknown>,
  V
> & { type: 'list' };

type GuiNumberinput<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<number, States, FormType, Props.NumberinputProps, V> & { type: 'number' };

type GuiRadiogroup<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<OptionValue, States, FormType, Props.RadiogroupProps, V> & {
  type: 'radiogroup';
};

type GuiRangeCalendar<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<string, States, FormType, Props.RangeCalendarProps, V> & {
  type: 'rangeCalendar';
};

// TODO: how to do this one?
// type GuiRenderer<FormType extends Record<string, any>=any, States extends string> = Core.DisplayWidget<
//   States,
//   FormType,
//   Props.RangeCalendarProps
// > & { type: 'renderer' };

type GuiRepeater<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  Record<string, unknown>[],
  States,
  FormType,
  Props.RepeaterProps,
  V
> & { type: 'repeater' };

type GuiSelect<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.SelectProps,
  V
> & { type: 'select' };

type GuiStack<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.StackProps,
  GolemWidget<FormType, States, Validator>[]
> & { type: 'stack' };

type GuiTabs<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.TabsProps,
  GolemWidget<FormType, States, Validator>[]
> & { type: 'tabs' };

type GuiTextarea<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.TextareaProps,
  V
> & { type: 'textarea' };

type GuiTextInput<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = Core.InputWidget<string, States, FormType, Props.TextinputProps, V> & { type: 'textinput' };

type GuiToggle<FormType extends Record<string, any>, States extends string, V> = Core.InputWidget<
  boolean,
  States,
  FormType,
  Props.ToggleProps,
  V
> & { type: 'toggle' };
