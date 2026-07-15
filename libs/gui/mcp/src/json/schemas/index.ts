import {
  commonSchema,
  formSchema,
  layoutWidgetSchema,
  validatorsSchema,
  accordionSchema as accordion,
  alertSchema as alert,
  buttonSchema as button,
  calendarSchema as calendar,
  datetimecalendarSchema as datetimecalendar,
  datetimepickerSchema as datetimepicker,
  checkboxSchema as checkbox,
  currencySchema as currency,
  customSchema as custom,
  dateinputSchema as dateinput,
  timeinputSchema as timeinput,
  timepickerSchema as timepicker,
  datetimeinputSchema as datetimeinput,
  datepickerSchema as datepicker,
  dropdownSchema as dropdown,
  flexSchema as flex,
  gridSchema as grid,
  listSchema as list,
  markdownSchema as markdown,
  markdowntextSchema as markdowntext,
  numberSchema as numberWidget,
  passwordSchema as password,
  radiogroupSchema as radiogroup,
  rangecalendarSchema as rangecalendar,
  rangedateinputSchema as rangedateinput,
  rangetimeinputSchema as rangetimeinput,
  rangedatepickerSchema as rangedatepicker,
  rangetimepickerSchema as rangetimepicker,
  repeaterSchema as repeater,
  selectSchema as select,
  tabsSchema as tabs,
  tagsSchema as tags,
  textareaSchema as textarea,
  textinputSchema as textinput,
  toggleSchema as toggle,
} from '@golemui/gui-schemas';

export type WidgetSchema = {
  $id: string;
  title?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

export const COMMON_SCHEMA = commonSchema as WidgetSchema;
export const FORM_SCHEMA = formSchema as WidgetSchema;
export const LAYOUT_WIDGET_SCHEMA = layoutWidgetSchema as WidgetSchema;
export const VALIDATORS_SCHEMA = validatorsSchema as WidgetSchema;

/**
 * Fallback schema for user-registered custom components (any `type` not in COMPONENT_SCHEMAS).
 * Referenced by `form.schema.json`'s `formWidget` oneOf, so it must be registered for the form
 * validator to compile. Kept out of COMPONENT_SCHEMAS because it has no single `type` const.
 */
export const CUSTOM_SCHEMA = custom as WidgetSchema;

/**
 * Component schemas, keyed by their widget `type` constant (the value of `properties.type.const`
 * in each schema). These keys match the literal string a user puts in `type: '...'`.
 */
export const COMPONENT_SCHEMAS: Record<string, WidgetSchema> = {
  accordion: accordion as WidgetSchema,
  alert: alert as WidgetSchema,
  button: button as WidgetSchema,
  calendar: calendar as WidgetSchema,
  dateTimeCalendar: datetimecalendar as WidgetSchema,
  dateTimePicker: datetimepicker as WidgetSchema,
  checkbox: checkbox as WidgetSchema,
  currency: currency as WidgetSchema,
  dateInput: dateinput as WidgetSchema,
  timeInput: timeinput as WidgetSchema,
  timePicker: timepicker as WidgetSchema,
  dateTimeInput: datetimeinput as WidgetSchema,
  datePicker: datepicker as WidgetSchema,
  dropdown: dropdown as WidgetSchema,
  flex: flex as WidgetSchema,
  grid: grid as WidgetSchema,
  list: list as WidgetSchema,
  markdown: markdown as WidgetSchema,
  markdownText: markdowntext as WidgetSchema,
  number: numberWidget as WidgetSchema,
  password: password as WidgetSchema,
  radiogroup: radiogroup as WidgetSchema,
  rangeCalendar: rangecalendar as WidgetSchema,
  rangeDateInput: rangedateinput as WidgetSchema,
  rangeTimeInput: rangetimeinput as WidgetSchema,
  rangeDatePicker: rangedatepicker as WidgetSchema,
  rangeTimePicker: rangetimepicker as WidgetSchema,
  repeater: repeater as WidgetSchema,
  select: select as WidgetSchema,
  tabs: tabs as WidgetSchema,
  tags: tags as WidgetSchema,
  textarea: textarea as WidgetSchema,
  textinput: textinput as WidgetSchema,
  toggle: toggle as WidgetSchema,
};

export const ALL_SCHEMAS: WidgetSchema[] = [
  COMMON_SCHEMA,
  VALIDATORS_SCHEMA,
  LAYOUT_WIDGET_SCHEMA,
  ...Object.values(COMPONENT_SCHEMAS),
  CUSTOM_SCHEMA,
  FORM_SCHEMA,
];
