import type {
  ActionWidget,
  DisplayWidget,
  Form,
  FormWidget,
  FunctionWidgetParams,
  InputWidget,
  LayoutWidget,
  ReactiveExpression,
} from '@golemui/core';
import { type Validator } from '@golemui/gui-validators';
import type {
  AccordionProps,
  AlertProps,
  ButtonProps,
  CalendarProps,
  CheckboxProps,
  CurrencyProps,
  DatePickerProps,
  DateRange,
  DateinputProps,
  DropdownProps,
  FlexProps,
  GridProps,
  ListProps,
  MarkdownProps,
  MarkdownTextProps,
  NumberinputProps,
  OptionValue,
  PasswordProps,
  RadiogroupProps,
  RangeCalendarProps,
  RangeDateInputProps,
  RangeDatePickerProps,
  RepeaterProps,
  SelectProps,
  TabsProps,
  DateTimeInputProps,
  TextareaProps,
  TextinputProps,
  TimeInputProps,
  ToggleProps,
} from './widget.props';

// -------------------
//
// Utils
//
// -------------------

type ExtractStates<S> = S extends Record<string, ReactiveExpression> ? keyof S : never;

/**
 * Make the uid propery optional on all widgets
 */
type DeepPartialUid<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => DeepPartialUid<R>
  : T extends any[]
    ? DeepPartialUidArray<T>
    : T extends object
      ? {
          [K in keyof T as K extends 'uid' ? never : K]: DeepPartialUid<T[K]>;
        } & {
          uid?: string;
        }
      : T;

type DeepPartialUidArray<T extends any[]> = {
  [P in keyof T]: DeepPartialUid<T[P]>;
};

// -------------------
//
// Golem Form Builder
//
// -------------------

class GolemFormBuilder<
  FormType extends Record<string, any>,
  CustomWidget extends FormWidget<any, FormType> = never,
> {
  public create<States extends Record<string, ReactiveExpression>>(config: {
    states?: States;
    form: DeepPartialUid<GolemWidget<FormType, ExtractStates<States>, Validator, CustomWidget>>[];
  }): Form<ExtractStates<States>, FormType> {
    return {
      states: config.states,
      form: {
        uid: 'gui-root-uid',
        type: 'flex',
        kind: 'layout',
        children: config.form as any,
      } as LayoutWidget<ExtractStates<States>, FormType>,
    };
  }
}
/**
 * Creates a new GolemFormBuilder instance for building type-safe forms.
 *
 * @template FormType - The shape of the form data object
 * @template CustomWidget - Custom form widget type that extends Core.FormWidget, defaults to never
 *
 * @returns {GolemFormBuilder<FormType, CustomWidget>} A new GolemFormBuilder instance configured for the specified form type and custom widgets
 *
 * @example
 * ```typescript
 * type CustomHeadingWidget = {
 *   uid: string;
 *   kind: 'display';
 *   type: 'heading';
 *   props: {
 *     text: string;
 *     level?: number;
 *   };
 * };
 *
 * type FormType = { name: string; registerMode: boolean };
 *
 * // 1. Pass CustomHeadingWidget here.
 * // 2. Do NOT pass anything for States (it will be inferred in .create)
 * export const myDemoForm = golemForm<FormType, CustomHeadingWidget>().create({
 *   states: {
 *     registering: '$form.register === true',
 *   },
 *   form: [
 *     {
 *       kind: 'input',
 *       type: 'textinput',
 *       path: 'name',
 *       label: 'Label',
 *       'label.registering': '',
 *       props: { placeholder: (api) => api.$form.name, 'placeholder.registering': 'asas' },
 *     },
 *     // Custom widget usage
 *     {
 *       kind: 'display',
 *       type: 'heading',
 *       props: { text: 'User Details', level: 1 },
 *     },
 *     (api) => ({
 *       kind: 'input',
 *       type: 'textinput',
 *       path: 'something',
 *       label: api?.$form.name ? api?.$form.name : 'No name yet',
 *     }),
 *     {
 *       kind: 'layout',
 *       type: 'flex',
 *       props: { direction: 'row' },
 *       children: [
 *         {
 *           kind: 'input',
 *           type: 'textinput',
 *           path: 'surname',
 *           props: { hint: 'not type safe' },
 *         },
 *         // Nested custom widget
 *         {
 *           kind: 'display',
 *           type: 'heading',
 *           props: { text: 'Nested Heading', level: 2 },
 *         },
 *       ],
 *     },
 *   ],
 * });
 * ```
 */
export function golemForm<
  FormType extends Record<string, any>,
  CustomWidget extends FormWidget<any, FormType> = never,
>(): GolemFormBuilder<FormType, CustomWidget> {
  return new GolemFormBuilder<FormType, CustomWidget>();
}

// -------------------
//
// Golem Widgets
//
// -------------------

type GolemWidget<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType> = never,
> =
  | GuiAccordion<FormType, States, V, CustomWidget>
  | GuiAlert<FormType, States>
  | GuiButton<FormType, States>
  | GuiCalendar<FormType, States, V>
  | GuiCheckbox<FormType, States, V>
  | GuiCurrency<FormType, States, V>
  | GuiDateinput<FormType, States, V>
  | GuiDatePicker<FormType, States, V>
  | GuiDateTimeInput<FormType, States, V>
  | GuiDropdown<FormType, States, V>
  | GuiFunctionWidget<FormType, States, V, CustomWidget>
  | GuiList<FormType, States, V>
  | GuiMarkdown<FormType, States, V>
  | GuiMarkdownText<FormType, States>
  | GuiNumberinput<FormType, States, V>
  | GuiPassword<FormType, States, V>
  | GuiRadiogroup<FormType, States, V>
  | GuiRangeCalendar<FormType, States, V>
  | GuiRangeDateInput<FormType, States, V>
  | GuiRangeDatePicker<FormType, States, V>
  // | GuiRenderer<FormType, States>
  | GuiRepeater<FormType, States, V, CustomWidget>
  | GuiSelect<FormType, States, V>
  | GuiFlex<FormType, States, V, CustomWidget>
  | GuiGrid<FormType, States, V, CustomWidget>
  | GuiTabs<FormType, States, V, CustomWidget>
  | GuiTextarea<FormType, States, V>
  | GuiTextInput<FormType, States, V>
  | GuiTimeInput<FormType, States, V>
  | GuiToggle<FormType, States, V>
  | CustomWidget;

type GuiAccordion<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = LayoutWidget<
  States,
  FormType,
  AccordionProps,
  GolemWidget<FormType, States, V, CustomWidget>[]
> & { type: 'accordion' };

type GuiAlert<FormType extends Record<string, any>, States extends string> = DisplayWidget<
  States,
  FormType,
  AlertProps
> & { type: 'alert' };

type GuiButton<FormType extends Record<string, any>, States extends string> = ActionWidget<
  States,
  FormType,
  ButtonProps
> & { type: 'button' };

type GuiCalendar<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  CalendarProps,
  V
> & { type: 'calendar' };

type GuiCheckbox<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  boolean,
  States,
  FormType,
  CheckboxProps,
  V
> & { type: 'checkbox' };

type GuiCurrency<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  number,
  States,
  FormType,
  CurrencyProps,
  V
> & { type: 'currency' };

type GuiDateinput<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  DateinputProps,
  V
> & { type: 'dateInput' };

type GuiDatePicker<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  DatePickerProps,
  V
> & { type: 'datePicker' };

type GuiDropdown<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  OptionValue,
  States,
  FormType,
  DropdownProps<unknown>,
  V
> & { type: 'dropdown' };

type GuiFunctionWidget<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = (
  api?: FunctionWidgetParams<FormType>,
) => Exclude<GolemWidget<FormType, States, V, CustomWidget>, () => any>;

type GuiList<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  OptionValue,
  States,
  FormType,
  ListProps<unknown>,
  V
> & { type: 'list' };

type GuiMarkdown<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  number,
  States,
  FormType,
  MarkdownProps,
  V
> & { type: 'markdown' };

type GuiMarkdownText<FormType extends Record<string, any>, States extends string> = DisplayWidget<
  States,
  FormType,
  MarkdownTextProps
> & { type: 'markdownText' };

type GuiNumberinput<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  number,
  States,
  FormType,
  NumberinputProps,
  V
> & { type: 'number' };

type GuiRadiogroup<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  OptionValue,
  States,
  FormType,
  RadiogroupProps,
  V
> & {
  type: 'radiogroup';
};

type GuiRangeCalendar<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  RangeCalendarProps,
  V
> & {
  type: 'rangeCalendar';
};

type GuiRangeDateInput<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = InputWidget<DateRange[], States, FormType, RangeDateInputProps, V> & {
  type: 'rangeDateInput';
};

type GuiRangeDatePicker<
  FormType extends Record<string, any>,
  States extends string,
  V,
> = InputWidget<DateRange[], States, FormType, RangeDatePickerProps, V> & {
  type: 'rangeDatePicker';
};

// TODO: how to do this one?
// type GuiRenderer<FormType extends Record<string, any>=any, States extends string> = Core.DisplayWidget<
//   States,
//   FormType,
//   Props.RangeCalendarProps
// > & { type: 'renderer' };

type GuiRepeater<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = InputWidget<
  Record<string, unknown>[],
  States,
  FormType,
  RepeaterProps<
    LayoutWidget<States, FormType, AccordionProps, GolemWidget<FormType, States, V, CustomWidget>[]>
  >,
  V
> & { type: 'repeater' };

type GuiSelect<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  OptionValue,
  States,
  FormType,
  SelectProps,
  V
> & { type: 'select' };

type GuiFlex<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = LayoutWidget<States, FormType, FlexProps, GolemWidget<FormType, States, V, CustomWidget>[]> & {
  type: 'flex';
};

type GuiGrid<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = LayoutWidget<States, FormType, GridProps, GolemWidget<FormType, States, V, CustomWidget>[]> & {
  type: 'grid';
};

type GuiTabs<
  FormType extends Record<string, any>,
  States extends string,
  V,
  CustomWidget extends FormWidget<any, FormType>,
> = LayoutWidget<States, FormType, TabsProps, GolemWidget<FormType, States, V, CustomWidget>[]> & {
  type: 'tabs';
};

type GuiTextarea<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  TextareaProps,
  V
> & { type: 'textarea' };

type GuiTextInput<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  TextinputProps,
  V
> & { type: 'textinput' };

type GuiPassword<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  PasswordProps,
  V
> & { type: 'password' };

type GuiTimeInput<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  TimeInputProps,
  V
> & { type: 'timeInput' };

type GuiDateTimeInput<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  string,
  States,
  FormType,
  DateTimeInputProps,
  V
> & { type: 'dateTimeInput' };

type GuiToggle<FormType extends Record<string, any>, States extends string, V> = InputWidget<
  boolean,
  States,
  FormType,
  ToggleProps,
  V
> & { type: 'toggle' };
