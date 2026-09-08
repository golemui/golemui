import type {
  InputWidget,
  JsonSchemaFragment,
  Localizable,
  ValueSchemaResolver,
  WidgetValueSchema,
} from '@golemui/core';
import { isTranslationConfig } from '@golemui/core/internals';
import { validatorToJsonSchema } from '@golemui/gui-validators';
import { updateListItems } from './utils/list-items';
import { updateOptions } from './utils/one-of';
import type { ListItem, ListProps, OneOfProps, Option } from './widget.props';
import type { GolemInputWidget } from './widgets';

// ===================================================
// guiValueSchemas - the gui widget set's implementation of the core
// `ValueSchemaResolver` contract: what value each input widget type holds,
// which widgets offer a closed set of choices, which values a program cannot
// write (upload envelopes) and which must never be echoed back (passwords).
//
// Wired into the core form config by every gui-* form component factory, next
// to the widget loaders and the validators. Consumed by plugins that describe a
// form to the outside, such as `@golemui/webmcp`. The core never reads it.
// ===================================================

type Choice = { label: string; value: unknown };

type AnyInputWidget = InputWidget<any, string>;

/** The value shapes shared by several widget types. */
const shapes = {
  string: (): JsonSchemaFragment => ({ type: 'string' }),
  date: (): JsonSchemaFragment => ({
    type: 'string',
    format: 'date',
    description: 'ISO date, YYYY-MM-DD',
  }),
  time: (): JsonSchemaFragment => ({
    type: 'string',
    format: 'time',
    description: 'Time of day on a 24-hour clock, HH:MM:SS',
  }),
  dateTime: (): JsonSchemaFragment => ({
    type: 'string',
    format: 'date-time',
    description: 'Local ISO date-time without offset, YYYY-MM-DDTHH:mm:ss',
  }),
  number: (): JsonSchemaFragment => ({ type: 'number' }),
  boolean: (): JsonSchemaFragment => ({ type: 'boolean' }),
  optionValue: (): JsonSchemaFragment => ({ type: ['string', 'number'] }),
  range: (bound: JsonSchemaFragment, endRequired: boolean): JsonSchemaFragment => ({
    type: 'array',
    items: {
      type: 'object',
      properties: { start: bound, end: bound },
      required: endRequired ? ['start', 'end'] : ['start'],
    },
  }),
  fileItem: (): JsonSchemaFragment => ({
    type: 'object',
    description: 'Upload envelope produced by the host upload service',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      size: { type: 'number' },
      type: { type: 'string' },
      status: { type: 'string', enum: ['uploading', 'uploaded', 'error'] },
      error: { type: 'string' },
      data: {},
    },
    required: ['id', 'name', 'size', 'type', 'status'],
  }),
};

const plain = (schema: JsonSchemaFragment): WidgetValueSchema => ({ schema });

/** `select` / `radiogroup`: an `options` prop normalized the way the widgets normalize it. */
function choicesFromOptions(widget: AnyInputWidget): Choice[] | undefined {
  const props = (widget.props ?? {}) as OneOfProps & { options?: unknown };
  if (!Array.isArray(props.options)) {
    return undefined;
  }
  try {
    return updateOptions(props.options as Option[], props).map(({ label, value }) => ({
      label: String(label),
      value,
    }));
  } catch {
    return undefined;
  }
}

/** `dropdown` / `list` and their multi variants: an `items` prop, disabled items left out. */
function choicesFromItems(widget: AnyInputWidget): Choice[] | undefined {
  const props = (widget.props ?? {}) as {
    items?: unknown;
    labelField?: string;
    valueField?: string;
  };
  if (!Array.isArray(props.items)) {
    return undefined;
  }
  try {
    return updateListItems(props.items as ListItem<any>[], props as ListProps<any>)
      .filter((item) => item.disabled !== true)
      .map((item) => ({ label: itemLabel(item, props.labelField), value: item.value }));
  } catch {
    return undefined;
  }
}

function itemLabel(item: ListItem<any>, labelField: string | undefined): string {
  const template = item.template;
  if (template !== null && typeof template === 'object') {
    const labelled = labelField ? (template as Record<string, unknown>)[labelField] : undefined;
    return String(labelled ?? item.value);
  }
  return String(template ?? item.value);
}

const withChoices = (base: JsonSchemaFragment, choices: Choice[] | undefined): WidgetValueSchema =>
  choices ? { schema: base, choices } : { schema: base };

const arrayOf = (items: JsonSchemaFragment): JsonSchemaFragment => ({ type: 'array', items });

/**
 * One entry per gui input widget type. Typed as a `Record` over the widget type union, so
 * adding a widget type without describing its value does not compile.
 */
const valueSchemaByType: Record<GolemInputWidget, (widget: AnyInputWidget) => WidgetValueSchema> = {
  textinput: () => plain(shapes.string()),
  textarea: () => plain(shapes.string()),
  markdown: () => plain({ type: 'string', description: 'Markdown text' }),
  password: () => ({ schema: shapes.string(), sensitive: true }),

  calendar: () => plain(shapes.date()),
  dateInput: () => plain(shapes.date()),
  datePicker: () => plain(shapes.date()),
  timeInput: () => plain(shapes.time()),
  timePicker: () => plain(shapes.time()),
  dateTimeInput: () => plain(shapes.dateTime()),
  dateTimePicker: () => plain(shapes.dateTime()),
  dateTimeCalendar: () => plain(shapes.dateTime()),

  number: () => plain(shapes.number()),
  currency: () => plain(shapes.number()),

  checkbox: () => plain(shapes.boolean()),
  toggle: () => plain(shapes.boolean()),

  select: (widget) => withChoices(shapes.optionValue(), choicesFromOptions(widget)),
  radiogroup: (widget) => withChoices(shapes.optionValue(), choicesFromOptions(widget)),
  dropdown: (widget) => withChoices(shapes.optionValue(), choicesFromItems(widget)),
  list: (widget) => withChoices(shapes.optionValue(), choicesFromItems(widget)),
  multiDropdown: (widget) => withChoices(arrayOf(shapes.optionValue()), choicesFromItems(widget)),
  multiList: (widget) => withChoices(arrayOf(shapes.optionValue()), choicesFromItems(widget)),

  tags: () => plain(arrayOf(shapes.string())),

  rangeCalendar: () => plain(shapes.range(shapes.date(), false)),
  rangeDateInput: () => plain(shapes.range(shapes.date(), false)),
  rangeDatePicker: () => plain(shapes.range(shapes.date(), false)),
  rangeTimeInput: () => plain(shapes.range(shapes.time(), true)),
  rangeTimePicker: () => plain(shapes.range(shapes.time(), true)),
  rangeDateTimeInput: () => plain(shapes.range(shapes.dateTime(), false)),
  rangeDateTimeCalendar: () => plain(shapes.range(shapes.dateTime(), false)),
  rangeDateTimePicker: () => plain(shapes.range(shapes.dateTime(), false)),

  // The rows' shape comes from `props.template`; a consumer that walks the form builds it.
  repeater: (widget) => {
    const limit = (widget.props as { limit?: unknown } | undefined)?.limit;
    return plain({
      type: 'array',
      items: { type: 'object' },
      ...(typeof limit === 'number' ? { maxItems: limit } : {}),
    });
  },

  fileUpload: () => ({
    schema: { oneOf: [shapes.fileItem(), { type: 'null' }] },
    writable: false,
  }),
  multiFileUpload: () => ({ schema: arrayOf(shapes.fileItem()), writable: false }),
};

/**
 * The human text the gui widgets show next to the value: the hint, or the placeholder when
 * there is no hint. Left untranslated, the consumer holds the form's translator.
 */
function describeProps(widget: AnyInputWidget): Localizable | undefined {
  const props = (widget.props ?? {}) as { hint?: unknown; placeholder?: unknown };
  const text = props.hint ?? props.placeholder;
  return typeof text === 'string' || isTranslationConfig(text) ? text : undefined;
}

/**
 * The gui widget set's `ValueSchemaResolver`. Unknown widget types (custom widgets) resolve
 * to `undefined`, so a consumer can fall back to its own inference.
 */
export const guiValueSchemas: ValueSchemaResolver = {
  valueSchema(widget) {
    const describe = valueSchemaByType[widget.type as GolemInputWidget];
    if (!describe) {
      return undefined;
    }
    const described = describe(widget);
    const description = describeProps(widget);
    return description === undefined ? described : { ...described, description };
  },
  validatorSchema: validatorToJsonSchema,
};
