import commonSchema from './data/common.schema.json';
import formSchema from './data/form.schema.json';
import layoutWidgetSchema from './data/layout-widget.schema.json';
import validatorsSchema from './data/validators.schema.json';

import accordion from './data/components/accordion.schema.json';
import alert from './data/components/alert.schema.json';
import button from './data/components/button.schema.json';
import calendar from './data/components/calendar.schema.json';
import checkbox from './data/components/checkbox.schema.json';
import currency from './data/components/currency.schema.json';
import dateinput from './data/components/dateinput.schema.json';
import datepicker from './data/components/datepicker.schema.json';
import dropdown from './data/components/dropdown.schema.json';
import flex from './data/components/flex.schema.json';
import grid from './data/components/grid.schema.json';
import list from './data/components/list.schema.json';
import markdown from './data/components/markdown.schema.json';
import markdowntext from './data/components/markdowntext.schema.json';
import numberWidget from './data/components/number.schema.json';
import password from './data/components/password.schema.json';
import radiogroup from './data/components/radiogroup.schema.json';
import rangecalendar from './data/components/rangecalendar.schema.json';
import rangedateinput from './data/components/rangedateinput.schema.json';
import rangedatepicker from './data/components/rangedatepicker.schema.json';
import repeater from './data/components/repeater.schema.json';
import select from './data/components/select.schema.json';
import tabs from './data/components/tabs.schema.json';
import textarea from './data/components/textarea.schema.json';
import textinput from './data/components/textinput.schema.json';
import toggle from './data/components/toggle.schema.json';

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
 * Component schemas, keyed by their widget `type` constant (the value of `properties.type.const`
 * in each schema). These keys match the literal string a user puts in `type: '...'`.
 */
export const COMPONENT_SCHEMAS: Record<string, WidgetSchema> = {
  accordion: accordion as WidgetSchema,
  alert: alert as WidgetSchema,
  button: button as WidgetSchema,
  calendar: calendar as WidgetSchema,
  checkbox: checkbox as WidgetSchema,
  currency: currency as WidgetSchema,
  dateInput: dateinput as WidgetSchema,
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
  rangeDatePicker: rangedatepicker as WidgetSchema,
  repeater: repeater as WidgetSchema,
  select: select as WidgetSchema,
  tabs: tabs as WidgetSchema,
  textarea: textarea as WidgetSchema,
  textinput: textinput as WidgetSchema,
  toggle: toggle as WidgetSchema,
};

export const ALL_SCHEMAS: WidgetSchema[] = [
  COMMON_SCHEMA,
  VALIDATORS_SCHEMA,
  LAYOUT_WIDGET_SCHEMA,
  ...Object.values(COMPONENT_SCHEMAS),
  FORM_SCHEMA,
];
