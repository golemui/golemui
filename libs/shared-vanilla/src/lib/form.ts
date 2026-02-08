import * as Core from '@golemui/core';
import { OptionValue } from './components';
import * as Props from './widget.props';

// -------------------
//
// Golem Form Builder
//
// -------------------

type ExtractStates<S> = S extends Record<string, Core.ReactiveExpression> ? keyof S : never;

class GolemFormBuilder<FormType extends Record<string, any>> {
  public create<States extends Record<string, Core.ReactiveExpression>>(config: {
    states?: States;
    form: GolemWidget<FormType, ExtractStates<States>>[];
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

type FormType = { name: string; registerMode: boolean };

export const myDemoForm = golemForm<FormType>().create({
  states: {
    registering: '$form.register === true',
  },
  form: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'name',
      label: 'Label',
      'label.registering': '',
      props: { placeholder: (api) => api.$form.name, 'placeholder.registering': 'asas' },
    },
    (api) => ({
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'something',
      label: api?.$form.name ? api?.$form.name : 'No name yet',
    }),
    {
      uid: '',
      kind: 'layout',
      type: 'stack',
      props: { direction: 'horizontal' },
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'surname',
          props: { hint: 'not type safe' },
        },
        {
          uid: '',
          kind: 'layout',
          type: 'stack',
          children: [
            {
              uid: '',
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
            { uid: '', kind: 'action', type: 'button' },
          ],
        },
      ],
    },
  ],
});

// -------------------
//
// Golem Widgets
//
// -------------------

type GolemWidget<FormType extends Record<string, any>, States extends string> =
  | GuiAccordion<FormType, States>
  | GuiAlert<FormType, States>
  | GuiButton<FormType, States>
  | GuiCalendar<FormType, States>
  | GuiCheckbox<FormType, States>
  | GuiCurrency<FormType, States>
  | GuiDateinput<FormType, States>
  | GuiDatePicker<FormType, States>
  | GuiDropdown<FormType, States>
  | GuiFunctionWidget<FormType, States>
  | GuiList<FormType, States>
  | GuiNumberinput<FormType, States>
  | GuiRadiogroup<FormType, States>
  | GuiRangeCalendar<FormType, States>
  //| GuiRenderer<FormType, States>
  | GuiRepeater<FormType, States>
  | GuiSelect<FormType, States>
  | GuiStack<FormType, States>
  | GuiTabs<FormType, States>
  | GuiTextarea<FormType, States>
  | GuiTextInput<FormType, States>
  | GuiToggle<FormType, States>;

type GuiAccordion<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.AccordionProps,
  GolemWidget<FormType, States>[]
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

type GuiCalendar<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.CalendarProps
> & { type: 'calendar' };

type GuiCheckbox<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  boolean,
  States,
  FormType,
  Props.CheckboxProps
> & { type: 'checkbox' };

type GuiCurrency<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  number,
  States,
  FormType,
  Props.CurrencyProps
> & { type: 'currency' };

type GuiDateinput<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.DateinputProps
> & { type: 'dateInput' };

type GuiDatePicker<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.DatePickerProps
> & { type: 'datePicker' };

type GuiDropdown<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.DropdownProps<unknown>
> & { type: 'dropdown' };

type GuiFunctionWidget<FormType extends Record<string, any>, States extends string> = (
  api?: Core.FunctionWidgetParams<FormType>,
) => Exclude<GolemWidget<FormType, States>, () => any>;

type GuiList<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.ListProps<unknown>
> & { type: 'list' };

type GuiNumberinput<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  number,
  States,
  FormType,
  Props.NumberinputProps
> & { type: 'number' };

type GuiRadiogroup<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.RadiogroupProps
> & { type: 'radiogroup' };

type GuiRangeCalendar<
  FormType extends Record<string, any>,
  States extends string,
> = Core.InputWidget<string, States, FormType, Props.RangeCalendarProps> & {
  type: 'rangeCalendar';
};

// TODO: how to do this one?
// type GuiRenderer<FormType extends Record<string, any>=any, States extends string> = Core.DisplayWidget<
//   States,
//   FormType,
//   Props.RangeCalendarProps
// > & { type: 'renderer' };

type GuiRepeater<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  Record<string, unknown>[],
  States,
  FormType,
  Props.RepeaterProps
> & { type: 'repeater' };

type GuiSelect<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  OptionValue,
  States,
  FormType,
  Props.SelectProps
> & { type: 'select' };

type GuiStack<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.StackProps,
  GolemWidget<FormType, States>[]
> & { type: 'stack' };

type GuiTabs<FormType extends Record<string, any>, States extends string> = Core.LayoutWidget<
  States,
  FormType,
  Props.TabsProps,
  GolemWidget<FormType, States>[]
> & { type: 'tabs' };

type GuiTextarea<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.TextareaProps
> & { type: 'textarea' };

type GuiTextInput<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  string,
  States,
  FormType,
  Props.TextinputProps
> & { type: 'textinput' };

type GuiToggle<FormType extends Record<string, any>, States extends string> = Core.InputWidget<
  boolean,
  States,
  FormType,
  Props.ToggleProps
> & { type: 'toggle' };
