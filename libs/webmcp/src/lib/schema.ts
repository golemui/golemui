import type {
  DotPath,
  FormPluginContext,
  FormWidget,
  InputWidget,
  JsonSchemaFragment,
  NonFunctionWidget,
  State,
  Uid,
  WidgetValueSchema,
} from '@golemui/core';
import {
  flattenForm,
  isFunctionWidget,
  isInputWidget,
  isRepeaterWidget,
  get,
} from '@golemui/core/internals';
import { resolveValidatorSchema, resolveValueSchema } from './field-schema';
import { FIELD_DESCRIPTION_LIMIT, joinText, resolveText, truncate } from './text';
import type { WebmcpOptions } from './types';

/** Above this many choices the enum is dropped and the value is described as free text. */
const MAX_ENUM_CHOICES = 50;

/** Soft cap on the serialized input schema, above which a warning is logged. */
const SCHEMA_SIZE_WARNING = 32_000;

/**
 * One input widget as the tools see it.
 */
export type FieldEntry = {
  /** The data path. Absolute for a top-level field, relative to the row for a repeater child. */
  path: DotPath;
  uid: Uid;
  /** The widget as authored, before state suffixes and expressions are resolved. */
  widget: InputWidget<any, string>;
  /** The value description this field was built from. */
  value: WidgetValueSchema;
  required: boolean;
  /** Whether an agent may write this field: writable, not sensitive, not read-only, not excluded. */
  fillable: boolean;
  /** The JSON Schema of this field, as placed in the tool's input schema. */
  property: JsonSchemaFragment;
  /** A repeater's row fields, with paths relative to the row. */
  children?: FieldEntry[];
};

export type FormSchema = {
  /** The input schema of the fill and submit tools: the fillable fields as a nested object tree. */
  inputSchema: JsonSchemaFragment;
  /** Every declared top-level input field, fillable or not. */
  fields: FieldEntry[];
  /** Widget types that were described by inference only. */
  inferredTypes: string[];
};

type Built = { fields: FieldEntry[]; inferredTypes: Set<string> };

/**
 * Describes the form for an agent: walks every declared input (repeater templates included),
 * describes each value, and assembles the fillable ones into one JSON Schema object tree that
 * mirrors the form data.
 *
 * Texts come from the widgets as authored (labels, hints), never from the calculated widgets:
 * a calculated label can embed form data, which would put user-entered text in front of the
 * agent and change the schema on every keystroke. Choices come from the calculated widgets,
 * because asynchronously loaded options only exist there.
 */
export function buildFormSchema(
  state: State,
  context: FormPluginContext,
  options: WebmcpOptions,
): FormSchema {
  const built: Built = { fields: [], inferredTypes: new Set() };
  const excluded = new Set(options.exclude ?? []);

  for (const source of Object.values(state.flatForm)) {
    const current = state.calculatedWidgets[source.uid as Uid]?.current;
    const resolved = current ?? materialize(source, state, context);
    if (resolved === undefined || !isInputWidget(resolved)) {
      continue;
    }
    const entry = describeField(source, resolved, resolved.path, state, context, options, built);
    if (entry !== undefined) {
      entry.fillable = entry.fillable && !excluded.has(entry.path);
      built.fields.push(entry);
    }
  }

  const inputSchema: JsonSchemaFragment = { type: 'object', properties: {} };
  for (const field of built.fields) {
    if (field.fillable) {
      place(inputSchema, field.path, field.property, field.required);
    }
  }

  const serialized = JSON.stringify(inputSchema).length;
  if (serialized > SCHEMA_SIZE_WARNING) {
    console.warn(
      `[GolemUI webmcp] The "${options.name}" form describes as ${serialized} characters of JSON Schema. Agents handle large schemas poorly; consider excluding fields.`,
    );
  }

  return { inputSchema, fields: built.fields, inferredTypes: [...built.inferredTypes] };
}

/**
 * The widget a function widget produces, when the store has not calculated it (it is hidden).
 * Called the way the reducer calls it, so a function that reads its arguments still works.
 */
function materialize(
  source: FormWidget<string>,
  state: State,
  context: FormPluginContext,
): NonFunctionWidget<string> | undefined {
  if (!isFunctionWidget(source)) {
    return source;
  }
  try {
    const produced = source({
      $form: state.data,
      errors: source.path ? state.validations[source.path] : undefined,
      touched: source.path ? state.touchedControls[source.path] : undefined,
      translate: context.localization.translate,
    });
    return { ...produced, uid: source.uid, path: source.path ?? (produced as InputWidget<any, string>).path } as NonFunctionWidget<string>;
  } catch {
    return undefined;
  }
}

function describeField(
  source: FormWidget<string>,
  resolved: InputWidget<any, string>,
  path: DotPath,
  state: State,
  context: FormPluginContext,
  options: WebmcpOptions,
  built: Built,
): FieldEntry | undefined {
  // The authored widget carries the stable texts; a function widget has none, so its produced
  // widget stands in for it.
  const authored = (isFunctionWidget(source) ? resolved : source) as InputWidget<any, string>;
  const currentValue = get(state.data, path);

  const described = resolveValueSchema(resolved, currentValue, context, options);
  if (described.source === 'fallback') {
    built.inferredTypes.add(resolved.type);
  }
  const authoredDescription =
    authored === resolved
      ? described.value.description
      : resolveValueSchema(authored, currentValue, context, options).value.description;

  const validator = resolveValidatorSchema(
    typeof resolved.validator === 'function' ? authored.validator : resolved.validator,
    context,
  );

  const property: JsonSchemaFragment = {
    ...described.value.schema,
    ...(validator?.schema ?? {}),
  };
  applyChoices(property, described.value.choices);

  const description = truncate(
    joinText([
      resolveText(authored.label, context.localization),
      resolveText(authoredDescription, context.localization),
      describeVisibility(authored, state),
    ]),
    FIELD_DESCRIPTION_LIMIT,
  );
  if (description !== '') {
    property['description'] = description;
  }

  const entry: FieldEntry = {
    path,
    uid: resolved.uid as Uid,
    widget: authored,
    value: described.value,
    required: validator?.required === true,
    fillable:
      described.value.writable !== false &&
      described.value.sensitive !== true &&
      authored.readonly !== true &&
      authored.disabled !== true,
    property,
  };

  if (isRepeaterWidget(resolved)) {
    entry.children = describeRows(resolved, path, state, context, options, built);
    property['type'] = 'array';
    property['items'] = rowSchema(entry.children);
  }

  return entry;
}

/** The fields of a repeater's template, with paths relative to one row. */
function describeRows(
  repeater: InputWidget<any, string> & { props: { template: FormWidget<string> } },
  repeaterPath: DotPath,
  state: State,
  context: FormPluginContext,
  options: WebmcpOptions,
  built: Built,
): FieldEntry[] {
  const prefix = `${repeaterPath}.items.`;
  const rows: FieldEntry[] = [];
  for (const templateWidget of flattenForm([repeater.props.template as FormWidget<never>])) {
    const resolved = materialize(templateWidget, state, context);
    if (resolved === undefined || !isInputWidget(resolved)) {
      continue;
    }
    const relative = resolved.path.startsWith(prefix)
      ? resolved.path.slice(prefix.length)
      : resolved.path;
    const entry = describeField(templateWidget, resolved, relative, state, context, options, built);
    if (entry !== undefined) {
      rows.push(entry);
    }
  }
  return rows;
}

function rowSchema(children: FieldEntry[]): JsonSchemaFragment {
  const row: JsonSchemaFragment = { type: 'object', properties: {} };
  for (const child of children) {
    if (child.fillable) {
      place(row, child.path, child.property, child.required);
    }
  }
  return row;
}

/**
 * Places a property into an object schema at a dot path, creating the intermediate objects.
 * A required leaf is listed in its direct parent's `required`.
 */
function place(
  root: JsonSchemaFragment,
  path: DotPath,
  property: JsonSchemaFragment,
  required: boolean,
): void {
  const segments = path.split('.');
  let node = root;
  for (const segment of segments.slice(0, -1)) {
    const properties = (node['properties'] ??= {}) as Record<string, JsonSchemaFragment>;
    node = properties[segment] ??= { type: 'object', properties: {} };
  }
  const leaf = segments[segments.length - 1];
  const properties = (node['properties'] ??= {}) as Record<string, JsonSchemaFragment>;
  properties[leaf] = property;
  if (required) {
    const list = (node['required'] ??= []) as string[];
    if (!list.includes(leaf)) {
      list.push(leaf);
    }
  }
}

/**
 * Expresses a closed set of choices: `enum` when labels and values coincide, `oneOf` with
 * `const` and `title` otherwise so the agent sees both. Applied to the items of an array-typed
 * field (the multi-value widgets).
 */
function applyChoices(
  property: JsonSchemaFragment,
  choices: WidgetValueSchema['choices'],
): void {
  if (choices === undefined || choices.length === 0 || choices.length > MAX_ENUM_CHOICES) {
    return;
  }
  const target =
    property['type'] === 'array'
      ? ((property['items'] ??= {}) as JsonSchemaFragment)
      : property;
  const labelled = choices.some((choice) => choice.label !== String(choice.value));
  if (labelled) {
    delete target['type'];
    target['oneOf'] = choices.map((choice) => ({ const: choice.value, title: choice.label }));
  } else {
    target['enum'] = choices.map((choice) => choice.value);
  }
}

/** The visibility condition of a widget, as authored, for the agent to reason about. */
function describeVisibility(widget: InputWidget<any, string>, state: State): string | undefined {
  const states = state.formDef.states ?? {};
  const expressionOf = (name: string) => states[name] ?? name;
  const include = widget.include as { in?: string[]; when?: string } | undefined;
  const exclude = widget.exclude as { from?: string[]; when?: string } | undefined;
  const parts: string[] = [];
  if (include?.when !== undefined) {
    parts.push(`Shown when ${include.when}`);
  } else if (include?.in !== undefined) {
    parts.push(`Shown when ${include.in.map(expressionOf).join(' or ')}`);
  }
  if (exclude?.when !== undefined) {
    parts.push(`Hidden when ${exclude.when}`);
  } else if (exclude?.from !== undefined) {
    parts.push(`Hidden when ${exclude.from.map(expressionOf).join(' or ')}`);
  }
  return parts.length > 0 ? parts.join('. ') : undefined;
}
