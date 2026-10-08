import type {
  BuildContext,
  BuildResult,
  FormWidgetJson,
  GroupOptions,
  Localizable,
  Preset,
  Rule,
  SchemaNode,
  WidgetBuilder,
} from '@golemui/schemas/json-schema';
import { guiValidator } from './gui-validator.js';

/** Options of {@link guiPreset}. */
export type GuiPresetOptions = {
  /** Appends a submit button. Defaults to `true`. */
  submitAction?: boolean;
  /** Label of the submit button. Defaults to `Submit`. */
  submitLabel?: Localizable;
  /** Layout of the top-level widgets. Defaults to `vertical`, one widget per row. */
  rootLayout?: 'vertical' | 'horizontal' | 'grid';
  /**
   * Choice widgets by option count: up to `radio` options a `radiogroup` (default 0, so never),
   * up to `select` a `select` (default 6), more a `dropdown`. Arrays of choices use `multiList`
   * up to `select`, `multiDropdown` above.
   */
  enumThresholds?: { radio?: number; select?: number };
  /**
   * How an object title is shown above its properties: not at all (the default), as a
   * `markdownText` heading, or as an `alert`. A `markdownText` needs the host to pass
   * `dependencies.markdown`, otherwise it renders nothing.
   */
  objectTitle?: 'none' | 'markdownText' | 'alert';
  /** Written to `$schema`. Defaults to `https://golemui.com/schemas/form.schema.json`. */
  schemaUrl?: string;
};

const DEFAULT_SCHEMA_URL = 'https://golemui.com/schemas/form.schema.json';
const DEFAULT_SELECT_THRESHOLD = 6;
const LONG_TEXT_MIN_LENGTH = 200;
// Property names that hold a secret, also without `format: password`.
const SECRET_NAME = /(password|secret|api[_-]?key|token)/i;
const DATE_AND_TIME_WIDGETS: Record<string, string> = {
  date: 'dateInput',
  'date-time': 'dateTimePicker',
  time: 'timeInput',
};
// Keywords of an array item that the `tags` widget does not check.
const TAG_CONSTRAINTS = ['format', 'pattern', 'minLength', 'maxLength', 'minimum', 'maximum'];

/**
 * The preset of the gui widget set for `fromJsonSchema`. It maps each schema node to a gui
 * widget and a gui validator:
 *
 * - `enum`, or `oneOf`/`anyOf` of `const`: `select`, `dropdown` above 6 options, `radiogroup`
 *   when `enumThresholds.radio` allows it.
 * - strings: `dateInput`, `dateTimePicker` and `timeInput` by `format`, `password` for secrets,
 *   `markdown` for `contentMediaType: text/markdown`, `textarea` from `maxLength` 200,
 *   `textinput` otherwise. A `const` becomes a read-only input.
 * - `number`/`integer`: `number`. `boolean`: `checkbox`.
 * - arrays: `repeater` for objects, `multiList`/`multiDropdown` for choices, `tags` for other
 *   values, a row of widgets for a tuple.
 * - objects: a grid stack.
 *
 * On every input: `title` is the label, `description` the hint, `examples[0]` the placeholder,
 * `readOnly` makes it read-only and `default` (also from a parent object default) is the
 * default value.
 *
 * @example
 * import { fromJsonSchema } from '@golemui/schemas/json-schema';
 * import { guiPreset } from '@golemui/gui-schemas/json-schema';
 *
 * const { formDefinition } = fromJsonSchema(schema, { preset: guiPreset({ submitLabel: 'Save' }) });
 */
export function guiPreset(options: GuiPresetOptions = {}): Preset {
  const radioThreshold = options.enumThresholds?.radio ?? 0;
  const selectThreshold = options.enumThresholds?.select ?? DEFAULT_SELECT_THRESHOLD;
  const objectTitle = options.objectTitle ?? 'none';

  const group = (children: FormWidgetJson[], groupOptions: GroupOptions): FormWidgetJson =>
    layout({ gap: 'sm' }, withTitle(children, groupOptions.title), {
      uid: groupOptions.uid,
      include: groupOptions.include,
    });

  const withTitle = (children: FormWidgetJson[], title: Localizable | undefined) => {
    if (typeof title !== 'string' || title === '' || objectTitle === 'none') {
      return children;
    }
    const heading: FormWidgetJson =
      objectTitle === 'markdownText'
        ? { kind: 'display', type: 'markdownText', props: { md: `### ${title}` } }
        : { kind: 'display', type: 'alert', props: { text: title, level: 'info' } };
    return [heading, ...children];
  };

  const choice = (node: SchemaNode, context: BuildContext, forcedType?: string): BuildResult => {
    const options = context.enumOptions(node) ?? [];
    const type =
      forcedType ??
      (options.length <= radioThreshold
        ? 'radiogroup'
        : options.length <= selectThreshold
          ? 'select'
          : 'dropdown');
    if (type === 'dropdown') {
      return input(type, node, context, {
        items: options,
        labelField: 'label',
        valueField: 'value',
        placeholder: exampleOf(node),
      });
    }
    return input(type, node, context, {
      options,
      placeholder: type === 'select' ? exampleOf(node) : undefined,
    });
  };

  const multipleChoice = (
    node: SchemaNode,
    context: BuildContext,
    forcedType?: string,
  ): BuildResult => {
    const item = context.item(node);
    const options = (item && context.enumOptions(item)) ?? [];
    const type = forcedType ?? (options.length <= selectThreshold ? 'multiList' : 'multiDropdown');
    return input(type, node, context, { items: options, labelField: 'label', valueField: 'value' });
  };

  const repeater = (node: SchemaNode, context: BuildContext): BuildResult => {
    const item = context.item(node);
    if (item === undefined) {
      return undefined;
    }
    const built = context.build(item);
    const template =
      !Array.isArray(built) && built?.kind === 'layout'
        ? built
        : layout({ gap: 'sm' }, built ? [built].flat() : []);
    if (template.children?.length === 0) {
      context.diagnostic({
        severity: 'error',
        code: 'empty-repeater',
        message: 'The array items have no property the form can render, so the array is left out.',
      });
      return null;
    }
    const label = context.label(node);
    const itemTitle = typeof item.schema['title'] === 'string' ? item.schema['title'] : undefined;
    const itemName = itemTitle ?? (typeof label === 'string' ? singular(label) : undefined);
    return {
      kind: 'input',
      type: 'repeater',
      path: node.path,
      label,
      defaultValue: defaultValueOf(node),
      validator: context.validator(node),
      props: {
        title: itemTitle,
        addLabel: itemName !== undefined ? `Add ${itemName.toLowerCase()}` : 'Add',
        removeLabel: 'Remove',
        limit: typeof node.schema['maxItems'] === 'number' ? node.schema['maxItems'] : undefined,
        template,
      },
    };
  };

  const tags = (node: SchemaNode, context: BuildContext): BuildResult => {
    const item = context.item(node);
    if (item !== undefined && item.type !== 'string') {
      context.diagnostic({
        severity: 'warning',
        code: 'item-type-mismatch',
        message: `The tags widget writes strings, and the schema expects ${item.type ?? 'another type'} items.`,
      });
    }
    if (item !== undefined && TAG_CONSTRAINTS.some((keyword) => keyword in item.schema)) {
      context.diagnostic({
        severity: 'info',
        code: 'item-constraints-dropped',
        message: 'The tags widget does not check the constraints of each item.',
      });
    }
    return input('tags', node, context, { placeholder: exampleOf(node) ?? 'Add and press Enter' });
  };

  const tuple = (node: SchemaNode, context: BuildContext): BuildResult => {
    const children = context.buildChildren(node);
    if (children.length === 0) {
      return null;
    }
    if (node.schema['items'] !== false && node.schema['items'] !== undefined) {
      context.diagnostic({
        severity: 'info',
        code: 'tuple-extra-items',
        message:
          'The form edits the fixed positions only. Extra items the schema allows are not editable.',
      });
    }
    return layout({ direction: 'row', gap: 'sm' }, withTitle(children, context.label(node)));
  };

  // A stack of the object's fields, or with `columns` as many columns of them as fit.
  const object = (node: SchemaNode, context: BuildContext, columns = false): BuildResult => {
    const children = context.buildChildren(node);
    if (children.length === 0) {
      context.diagnostic({
        severity: 'warning',
        code: 'empty-object',
        message: 'The object has no property the form can render, so it is left out.',
      });
      return null;
    }
    // An array item gets the array title on the repeater instead.
    const title = isArrayItem(node) ? undefined : context.label(node);
    return columns
      ? layout({ columns: 'auto', gap: 'sm' }, withTitle(children, title))
      : group(children, { title });
  };

  const rules: Rule[] = [
    {
      name: 'gui constant',
      when: (node) => 'const' in node.schema && (node.type === 'string' || isNumeric(node)),
      build: (node, context) => ({
        ...input(node.type === 'string' ? 'textinput' : 'number', node, context),
        readonly: true,
        defaultValue: node.schema['const'],
      }),
    },
    {
      name: 'gui choice',
      when: (node) => !isContainer(node) && isEnumeration(node.schema),
      build: (node, context) => choice(node, context),
    },
    {
      name: 'gui date and time',
      when: (node) => node.type === 'string' && formatOf(node) in DATE_AND_TIME_WIDGETS,
      build: (node, context) => {
        if (formatOf(node) === 'date-time') {
          context.diagnostic({
            severity: 'info',
            code: 'local-datetime',
            message:
              'The date-time widget writes the local date and time without a UTC offset, which a strict `date-time` check rejects.',
          });
        }
        return input(DATE_AND_TIME_WIDGETS[formatOf(node)], node, context);
      },
    },
    {
      name: 'gui secret',
      when: (node) =>
        node.type === 'string' &&
        (formatOf(node) === 'password' ||
          node.schema['writeOnly'] === true ||
          SECRET_NAME.test(node.name ?? '')),
      build: (node, context) => textInput('password', node, context),
    },
    {
      name: 'gui markdown',
      when: (node) => node.type === 'string' && node.schema['contentMediaType'] === 'text/markdown',
      build: (node, context) => textInput('markdown', node, context),
    },
    {
      name: 'gui long text',
      when: (node) =>
        node.type === 'string' &&
        typeof node.schema['maxLength'] === 'number' &&
        node.schema['maxLength'] >= LONG_TEXT_MIN_LENGTH,
      build: (node, context) => textInput('textarea', node, context),
    },
    {
      name: 'gui text',
      when: (node) => node.type === 'string',
      build: (node, context) => textInput('textinput', node, context),
    },
    {
      name: 'gui number',
      when: isNumeric,
      build: (node, context) => textInput('number', node, context),
    },
    {
      name: 'gui boolean',
      when: (node) => node.type === 'boolean',
      build: (node, context) => booleanInput('checkbox', node, context),
    },
    {
      name: 'gui array',
      when: (node) => node.type === 'array',
      build: (node, context) => {
        if (Array.isArray(node.schema['prefixItems'])) {
          return tuple(node, context);
        }
        const item = context.item(node);
        if (item === undefined) {
          return undefined;
        }
        if (!isContainer(item) && isEnumeration(item.schema)) {
          return multipleChoice(node, context);
        }
        if (item.type === 'object') {
          return repeater(node, context);
        }
        if (item.type === 'string' || isNumeric(item)) {
          return tags(node, context);
        }
        return undefined;
      },
    },
    {
      name: 'gui object',
      when: (node) => node.type === 'object',
      build: (node, context) => object(node, context),
    },
  ];

  const widgets: Record<string, WidgetBuilder> = {
    textinput: (node, context) => textInput('textinput', node, context),
    textarea: (node, context) => textInput('textarea', node, context),
    password: (node, context) => textInput('password', node, context),
    markdown: (node, context) => textInput('markdown', node, context),
    number: (node, context) => textInput('number', node, context),
    currency: (node, context) => input('currency', node, context),
    checkbox: (node, context) => booleanInput('checkbox', node, context),
    toggle: (node, context) => booleanInput('toggle', node, context),
    select: (node, context) => choice(node, context, 'select') as FormWidgetJson,
    radiogroup: (node, context) => choice(node, context, 'radiogroup') as FormWidgetJson,
    dropdown: (node, context) => choice(node, context, 'dropdown') as FormWidgetJson,
    multiList: (node, context) => multipleChoice(node, context, 'multiList') as FormWidgetJson,
    multiDropdown: (node, context) =>
      multipleChoice(node, context, 'multiDropdown') as FormWidgetJson,
    tags: (node, context) => tags(node, context) as FormWidgetJson,
    repeater: (node, context) => repeater(node, context) as FormWidgetJson,
    // `flex` is deprecated: the layout it named renders as a grid stack.
    flex: (node, context) => object(node, context) as FormWidgetJson,
    grid: (node, context) => object(node, context, true) as FormWidgetJson,
    ...Object.fromEntries(
      [
        'dateInput',
        'datePicker',
        'calendar',
        'dateTimeInput',
        'dateTimePicker',
        'dateTimeCalendar',
        'timeInput',
        'timePicker',
      ].map((type): [string, WidgetBuilder] => [
        type,
        (node, context) => input(type, node, context),
      ]),
    ),
  };

  const root = (children: FormWidgetJson[]): FormWidgetJson[] => {
    const widgets =
      options.submitAction === false
        ? children
        : [
            ...children,
            {
              kind: 'action',
              type: 'button',
              actionType: 'submit',
              label: options.submitLabel ?? 'Submit',
              props: { variant: 'filled' },
            } satisfies FormWidgetJson,
          ];
    // A layout needs at least one child.
    if (
      widgets.length === 0 ||
      options.rootLayout === undefined ||
      options.rootLayout === 'vertical'
    ) {
      return widgets;
    }
    return [
      options.rootLayout === 'grid'
        ? layout({ columns: 'auto', gap: 'sm' }, widgets)
        : layout({ direction: 'row', gap: 'sm' }, widgets),
    ];
  };

  return {
    name: 'gui',
    rules,
    widgets,
    validator: guiValidator,
    group,
    root,
    schemaUrl: options.schemaUrl ?? DEFAULT_SCHEMA_URL,
  };
}

/** An input with the fields every gui input takes from the schema. */
function input(
  type: string,
  node: SchemaNode,
  context: BuildContext,
  props: Record<string, unknown> = {},
): FormWidgetJson {
  return {
    kind: 'input',
    type,
    path: node.path,
    label: context.label(node),
    readonly: node.schema['readOnly'] === true ? true : undefined,
    defaultValue: defaultValueOf(node),
    validator: context.validator(node),
    props: definedOnly({ hint: descriptionOf(node), ...props }),
  };
}

/** A text-like input, which also shows `examples[0]` as placeholder. */
function textInput(type: string, node: SchemaNode, context: BuildContext): FormWidgetJson {
  return input(type, node, context, { placeholder: exampleOf(node) });
}

/** A required boolean starts as `false`, so the value is present as JSON Schema requires. */
function booleanInput(type: string, node: SchemaNode, context: BuildContext): FormWidgetJson {
  const widget = input(type, node, context);
  if (widget['defaultValue'] === undefined && node.required) {
    widget['defaultValue'] = false;
  }
  return widget;
}

function layout(
  props: Record<string, unknown>,
  children: FormWidgetJson[],
  fields: Partial<FormWidgetJson> = {},
): FormWidgetJson {
  return { kind: 'layout', type: 'grid', ...fields, props, children };
}

/** The node `default`, otherwise the value an enclosing object `default` has for it. */
function defaultValueOf(node: SchemaNode): unknown {
  if ('default' in node.schema) {
    return node.schema['default'];
  }
  if (node.parent !== undefined && node.name !== undefined) {
    const parentDefault = defaultValueOf(node.parent);
    if (isRecord(parentDefault) && node.name in parentDefault) {
      return parentDefault[node.name];
    }
  }
  return undefined;
}

function descriptionOf(node: SchemaNode): string | undefined {
  const description = node.schema['description'];
  return typeof description === 'string' && description !== '' ? description : undefined;
}

function exampleOf(node: SchemaNode): string | undefined {
  const examples = node.schema['examples'];
  const first = Array.isArray(examples) ? examples[0] : undefined;
  return typeof first === 'string' || typeof first === 'number' ? String(first) : undefined;
}

function formatOf(node: SchemaNode): string {
  return typeof node.schema['format'] === 'string' ? node.schema['format'] : '';
}

function isNumeric(node: SchemaNode): boolean {
  return node.type === 'number' || node.type === 'integer';
}

function isContainer(node: SchemaNode): boolean {
  return node.type === 'object' || node.type === 'array';
}

function isArrayItem(node: SchemaNode): boolean {
  return node.parent?.type === 'array' && node.name === undefined;
}

/** An `enum`, or a `oneOf`/`anyOf` whose branches are all `const`. */
function isEnumeration(schema: Record<string, unknown>): boolean {
  if (Array.isArray(schema['enum'])) {
    return true;
  }
  return ['oneOf', 'anyOf'].some((keyword) => {
    const branches = schema[keyword];
    return (
      Array.isArray(branches) &&
      branches.length > 0 &&
      branches.every((branch) => isRecord(branch) && 'const' in branch)
    );
  });
}

function definedOnly(props: Record<string, unknown>): Record<string, unknown> | undefined {
  const defined = Object.entries(props).filter(([, value]) => value !== undefined);
  return defined.length > 0 ? Object.fromEntries(defined) : undefined;
}

/** A plural label in the singular, for the add button: `Addresses` -> `Address`. */
function singular(label: string): string {
  if (label.endsWith('ies') && label.length > 3) {
    return `${label.slice(0, -3)}y`;
  }
  // `Addresses`, `Boxes`, `Batches`, `Wishes` add `es`. `Cases` and `Sizes` only add `s`.
  if (/(ss|x|ch|sh)es$/.test(label)) {
    return label.slice(0, -2);
  }
  if (label.endsWith('s') && !label.endsWith('ss')) {
    return label.slice(0, -1);
  }
  return label;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
