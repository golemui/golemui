import { type FormWidget, isActionWidget, isInputWidget } from '../form-widget';
import { isTranslationConfig, type TranslationConfig } from '../i18n';
import { hasWhen } from '../store/reducers/utils';
import { type ExpressionPolicy, isI18nParamExpression } from '../utils/check-expression';
import { forbiddenPathSegmentIssue, isPlainObject } from '../utils/object';
import { compileFormExpression } from './compile-expression';
import {
  type CompiledCandidate,
  type CompiledExpression,
  type CompiledField,
  type CompiledNestedTranslations,
  type CompiledParam,
  type CompiledPropField,
  type CompiledTranslation,
  type CompiledValue,
} from './compiled-form';

/** What the fields of every widget of one form definition share. */
export type FieldCompileContext = {
  policy: ExpressionPolicy;
  /**
   * The position of each declared state in the order in which the keys with a state suffix are
   * tried: the longest state name first, and names of equal length in the order of the
   * declaration.
   */
  stateOrder: Map<string, number>;
  /**
   * The arrays and the objects of props that hold a translation config, each with its compiled
   * form. A definition written as an object can use one array in many props, and the array is
   * then searched one time.
   */
  nestedTranslations: Map<object, CompiledNestedTranslations>;
};

/**
 * Creates the context for the fields of one form definition.
 *
 * @param stateNames - The declared state names, in the order of the declaration.
 * @param policy - Which issues of the expression check make an expression fail.
 * @returns The context.
 */
export function createFieldCompileContext(
  stateNames: string[],
  policy: ExpressionPolicy,
): FieldCompileContext {
  // The sort is stable, so names of equal length keep the order of the declaration.
  const byNameLength = [...stateNames].sort((first, second) => second.length - first.length);
  return {
    policy,
    stateOrder: new Map(byNameLength.map((name, position) => [name, position])),
    nestedTranslations: new Map(),
  };
}

// The fields of each widget kind, in the order in which the computed widget gets them.
const DISPLAY_OR_LAYOUT_FIELDS = ['size', 'include', 'exclude'];
const ACTION_FIELDS = ['size', 'include', 'exclude', 'label', 'disabled', 'actionType'];
const INPUT_FIELDS = [
  'size',
  'include',
  'exclude',
  'label',
  'disabled',
  'readonly',
  'validator',
  'path',
  'defaultValue',
];

/**
 * Compiles the fields that the kind of a widget has, such as `size` and `label`.
 *
 * @param source - The decoded widget.
 * @param context - The expression policy and the declared states of the form definition.
 * @returns One entry for each field of the kind, also for a field that the definition does not
 *   set, because the computed widget has a key for it.
 */
export function compileCoreFields(
  source: FormWidget<string>,
  context: FieldCompileContext,
): CompiledField[] {
  const values: Record<string, unknown> = source;
  const statesOfName = statesWithSuffixedKey(Object.keys(source), context);
  return coreFieldNames(source).map((name) => ({
    key: name,
    candidates:
      name === 'path'
        ? [{ state: undefined, value: { kind: 'path' } }]
        : candidatesOf(values, name, statesOfName.get(name), (value) =>
            compileCoreValue(name, value, context),
          ),
  }));
}

/**
 * Compiles the props of a widget.
 *
 * @param source - The decoded widget.
 * @param isRepeater - True for a repeater. Its prop `template` holds the widgets of a row.
 * @param context - The expression policy and the declared states of the form definition.
 * @returns One entry for each prop name, in the order of the definition. The name of a prop is
 *   its key up to the first dot, and the rest of the key is a state suffix.
 */
export function compilePropFields(
  source: FormWidget<string>,
  isRepeater: boolean,
  context: FieldCompileContext,
): CompiledPropField[] {
  const props: unknown = source.props;
  // `props` can be any value, also an array or a text. Only its keys are read here, because
  // the read of a value can throw.
  const keys = Object.keys(props ?? {});
  const statesOfName = statesWithSuffixedKey(keys, context);
  return namesWithoutSuffix(keys).map((name) => {
    const translatesNestedConfigs = !(isRepeater && name === 'template');
    const field: CompiledPropField = {
      key: name,
      candidates: candidatesOf(
        props as Record<string, unknown>,
        name,
        statesOfName.get(name),
        (value) => compilePropValue(value, translatesNestedConfigs, context),
      ),
      translatesNestedConfigs,
    };
    const nameIssue = forbiddenPathSegmentIssue(`props.${name}`);
    if (nameIssue !== undefined) {
      field.nameError = new Error(nameIssue);
    }
    return field;
  });
}

/**
 * Compiles the event names of an action or an input.
 *
 * @param source - The decoded widget.
 * @param context - The expression policy and the declared states of the form definition.
 * @returns One entry for each event of the widget. Empty for a display and for a layout, whose
 *   computed widgets have no `on`.
 */
export function compileOnFields(
  source: FormWidget<string>,
  context: FieldCompileContext,
): CompiledField[] {
  const on: Record<string, unknown> | undefined =
    isActionWidget(source) || isInputWidget(source) ? source.on : undefined;
  if (on === undefined) {
    return [];
  }
  const keys = Object.keys(on);
  const statesOfName = statesWithSuffixedKey(keys, context);
  // An event name is never a text with `{{ }}`.
  return namesWithoutSuffix(keys).map((name) => ({
    key: name,
    candidates: candidatesOf(on, name, statesOfName.get(name), constant),
  }));
}

function coreFieldNames(source: FormWidget<string>): string[] {
  if (isActionWidget(source)) {
    return ACTION_FIELDS;
  }
  if (isInputWidget(source)) {
    return INPUT_FIELDS;
  }
  return DISPLAY_OR_LAYOUT_FIELDS;
}

function namesWithoutSuffix(keys: string[]): string[] {
  return Array.from(new Set(keys.map((key) => key.split('.')[0])));
}

/**
 * Finds the keys with a state suffix, `name.<state>`.
 *
 * @returns For each name, the declared states that have such a key, in the order in which the
 *   states are tried. A suffix with a state that is not declared never applies, so it is left out.
 */
function statesWithSuffixedKey(
  keys: string[],
  context: FieldCompileContext,
): Map<string, string[]> {
  const statesOfName = new Map<string, string[]>();
  for (const key of keys) {
    const dot = key.indexOf('.');
    const state = key.slice(dot + 1);
    if (dot === -1 || !context.stateOrder.has(state)) {
      continue;
    }
    const name = key.slice(0, dot);
    statesOfName.set(name, [...(statesOfName.get(name) ?? []), state]);
  }
  const position = (state: string): number => context.stateOrder.get(state) as number;
  for (const states of statesOfName.values()) {
    states.sort((first, second) => position(first) - position(second));
  }
  return statesOfName;
}

function candidatesOf(
  values: Record<string, unknown>,
  name: string,
  statesWithValue: string[] | undefined,
  compileValue: (value: unknown) => CompiledValue,
): CompiledCandidate[] {
  const candidates: CompiledCandidate[] = [];
  for (const state of statesWithValue ?? []) {
    const value = compileValueOfKey(values, `${name}.${state}`, compileValue);
    if (value !== undefined) {
      candidates.push({ state, value });
    }
  }
  const valueWithoutSuffix = compileValueOfKey(values, name, compileValue);
  candidates.push({ state: undefined, value: valueWithoutSuffix ?? constant(undefined) });
  return candidates;
}

/**
 * @returns The compiled value of the key, or `undefined` when the key has no value. A read of
 *   the definition can throw, for example a getter of a prop. The result is then a `failure`,
 *   and the form reports the error when a widget uses the value.
 */
function compileValueOfKey(
  values: Record<string, unknown>,
  key: string,
  compileValue: (value: unknown) => CompiledValue,
): CompiledValue | undefined {
  try {
    const value = values[key];
    return value === undefined ? undefined : compileValue(value);
  } catch (error) {
    return { kind: 'failure', error };
  }
}

// -----------------------------------------------------------------------------
// The kind of a value
// -----------------------------------------------------------------------------

function constant(value: unknown): CompiledValue {
  return { kind: 'constant', value };
}

function compileCoreValue(
  name: string,
  value: unknown,
  context: FieldCompileContext,
): CompiledValue {
  if (name === 'disabled' || name === 'readonly') {
    return hasWhen(value) ? { kind: 'flag', flag: name } : constant(value);
  }
  if (name === 'defaultValue') {
    return constant(value);
  }
  return compileTextOrTranslation(value, context);
}

function compilePropValue(
  value: unknown,
  translatesNestedConfigs: boolean,
  context: FieldCompileContext,
): CompiledValue {
  const compiled = compileTextOrTranslation(value, context);
  if (compiled.kind !== 'constant' || !translatesNestedConfigs || !canHoldTranslations(value)) {
    return compiled;
  }
  return compileNestedTranslations(value, context) ?? compiled;
}

/** An object with a text `key` is a translation config, and a text can hold `{{ }}`. */
function compileTextOrTranslation(value: unknown, context: FieldCompileContext): CompiledValue {
  if (isTranslationConfig(value)) {
    return compileTranslation(value, context);
  }
  if (typeof value === 'string') {
    return compileText(value, context);
  }
  return constant(value);
}

// `[^}]` ends a slot at its first closing brace, so a slot cannot hold an object literal.
const TEXT_SLOT = /\{\{([^}]+)\}\}/g;

function compileText(text: string, context: FieldCompileContext): CompiledValue {
  const parts: (string | CompiledExpression)[] = [];
  let endOfLastSlot = 0;
  for (const slot of text.matchAll(TEXT_SLOT)) {
    parts.push(text.slice(endOfLastSlot, slot.index));
    parts.push(compileFormExpression(slot[1].trim(), context.policy));
    endOfLastSlot = slot.index + slot[0].length;
  }
  if (parts.length === 0) {
    return constant(text);
  }
  parts.push(text.slice(endOfLastSlot));
  return { kind: 'interpolation', parts };
}

function compileTranslation(
  config: TranslationConfig,
  context: FieldCompileContext,
): CompiledTranslation {
  return { kind: 'translation', config, params: compileParams(config.params, context) };
}

function compileParams(
  params: TranslationConfig['params'],
  context: FieldCompileContext,
): CompiledParam[] | undefined {
  if (!params) {
    return undefined;
  }
  return Object.keys(params).map((name): CompiledParam => {
    const value: unknown = params[name];
    // The test reads the start of the text, so `$formatted` is an expression too.
    return typeof value === 'string' && isI18nParamExpression(value)
      ? { name, expression: compileFormExpression(value, context.policy) }
      : { name, value };
  });
}

// -----------------------------------------------------------------------------
// Translation configs inside the arrays and the objects of a prop
// -----------------------------------------------------------------------------

/**
 * The arrays and the objects that hold no translation config. A value of a definition is
 * searched one time, also when many props or many forms use the same object.
 */
const holdsNoTranslation = new WeakSet<object>();

function canHoldTranslations(value: unknown): value is unknown[] | Record<string, unknown> {
  return Array.isArray(value) || isPlainObject(value);
}

/**
 * True for a translation config inside a prop. An object inside a prop is often data, so it is
 * a config only when it has no key other than `key`, `params` and `default`. `{ key: 'a',
 * label: 'A' }` stays an object.
 */
function isNestedTranslationConfig(value: Record<string, unknown>): value is TranslationConfig {
  if (typeof value['key'] !== 'string') {
    return false;
  }
  if (value['default'] !== undefined && typeof value['default'] !== 'string') {
    return false;
  }
  const params = value['params'];
  if (params !== undefined && !isPlainObject(params)) {
    return false;
  }
  return Object.keys(value).every((key) => key === 'key' || key === 'params' || key === 'default');
}

/**
 * @returns The entries of the value that hold a translation config at any depth, or `undefined`
 *   when the value holds none. A text inside the value is never a text with `{{ }}`.
 */
function compileNestedTranslations(
  value: unknown[] | Record<string, unknown>,
  context: FieldCompileContext,
): CompiledNestedTranslations | undefined {
  if (holdsNoTranslation.has(value)) {
    return undefined;
  }
  const alreadyCompiled = context.nestedTranslations.get(value);
  if (alreadyCompiled !== undefined) {
    return alreadyCompiled;
  }

  const entries: [string | number, unknown][] = Array.isArray(value)
    ? value.map((item, index) => [index, item])
    : Object.entries(value);

  const translated: CompiledNestedTranslations['entries'] = [];
  for (let position = 0; position < entries.length; position++) {
    try {
      // An empty place of an array has no entry, and the read of it throws.
      const [key, item] = entries[position];
      if (!canHoldTranslations(item)) {
        continue;
      }
      const compiled =
        !Array.isArray(item) && isNestedTranslationConfig(item)
          ? compileTranslation(item, context)
          : compileNestedTranslations(item, context);
      if (compiled !== undefined) {
        translated.push({ key, value: compiled });
      }
    } catch (error) {
      // The entries before this one are computed first, so an error of one of them comes first.
      translated.push({ key: position, value: { kind: 'failure', error } });
      break;
    }
  }

  if (translated.length === 0) {
    holdsNoTranslation.add(value);
    return undefined;
  }
  const compiled: CompiledNestedTranslations = {
    kind: 'nested',
    source: value,
    entries: translated,
  };
  context.nestedTranslations.set(value, compiled);
  return compiled;
}
