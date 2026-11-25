import { compileNestedTranslationsOf } from '../compile/compile-fields';
import {
  type CompiledCandidate,
  type CompiledExpression,
  type CompiledField,
  type CompiledNestedTranslations,
  type CompiledPropField,
  type CompiledTranslation,
  type CompiledValue,
  type CompiledWidget,
  type ExpressionScope,
} from '../compile/compiled-form';
import { errorCodes, errorMessage } from '../errors';
import { type FormWidget, isLayoutWidget, type LayoutWidget } from '../form-widget';
import { type I18nParams, type I18nTranslator } from '../i18n';
import { type DerivedWidget } from '../store/model';
import { deepEqual } from '../store/reducers/utils';
import { type ExpressionPolicy } from '../utils/check-expression';
import { ExpressionRejectedError } from '../utils/justin';
import { forbiddenPathSegmentIssue, get, set, setOwnKey } from '../utils/object';
import { scopeOfRow } from './row-scope';
import {
  previousIfSameInstances,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

/** What the computation of the widgets needs next to the scope of the expressions. */
export type ComputeWidgetsContext = {
  /** The form data. A row reads its `$item` from it. */
  data: Record<string, any>;
  /** The names of the states that are active now. */
  activeStates: ReadonlySet<string>;
  translator: I18nTranslator;
  /** The prop overrides of the host, by the uid of the widget and by the name of the prop. */
  overrides: Record<string, Record<string, any>>;
  /** For the translation configs that a translator returns inside its result. */
  expressionPolicy: ExpressionPolicy;
  /**
   * True for a language change. Then only the widgets that are computed already are computed
   * again, and a widget that was not computed stays so.
   */
  onlyComputedWidgets: boolean;
};

/**
 * Computes every visible widget: the values of its fields and of its props for the active
 * states, with each text with `{{ }}` evaluated and each translation config translated.
 *
 * A hidden widget is not computed, and it loses its previous computed widget.
 *
 * @param tree - The widget instances, with their flags and with their previous computed widgets.
 * @param compiledRoot - The compiled root layout that the tree was built from.
 * @param scope - The values that an expression reads outside a repeater row, for example `$form`.
 * @param context - The data, the active states, the translator and the prop overrides.
 * @returns The tree with the computed widgets. An instance whose computed widget did not change,
 *   and that has no changed instance below it, is the previous object.
 * @throws The error of the first value that fails, in the order of the document.
 *
 * @example
 * ```ts
 * const computed = computeWidgets(tree, compiled.root, scope, context);
 * // computed.root.children[0].calculated.current.label is the label for the active states
 * ```
 */
export function computeWidgets(
  tree: WidgetInstanceTree,
  compiledRoot: CompiledWidget | undefined,
  scope: ExpressionScope,
  context: ComputeWidgetsContext,
): WidgetInstanceTree {
  if (tree.root === undefined || compiledRoot === undefined) {
    return tree;
  }
  const root = withComputedWidget(tree.root, compiledRoot, scope, context, false);
  return root === tree.root ? tree : { root };
}

function withComputedWidget(
  instance: WidgetInstance,
  widget: CompiledWidget,
  scope: ExpressionScope,
  context: ComputeWidgetsContext,
  isBelowHidden: boolean,
): WidgetInstance {
  if (context.onlyComputedWidgets && instance.calculated === undefined) {
    // No instance below one that is not computed is computed.
    return instance;
  }
  const isHidden = isBelowHidden || instance.flags?.hidden === true;
  const calculated = isHidden ? undefined : computeWidget(instance, widget, scope, context);

  const children = previousIfSameInstances(
    instance.children,
    instance.children.map((child, position) =>
      withComputedWidget(child, widget.children[position], scope, context, isHidden),
    ),
  );
  const rows = previousIfSameInstances(
    instance.rows,
    rowsWithComputedWidgets(instance, widget, scope, context, isHidden),
  );

  if (
    calculated === instance.calculated &&
    children === instance.children &&
    rows === instance.rows
  ) {
    return instance;
  }
  return { ...instance, calculated, children, rows };
}

function rowsWithComputedWidgets(
  repeater: WidgetInstance,
  widget: CompiledWidget,
  scope: ExpressionScope,
  context: ComputeWidgetsContext,
  isHidden: boolean,
): WidgetInstance[] {
  const rowLayout = widget.repeater?.rowLayout;
  if (rowLayout === undefined) {
    return repeater.rows;
  }
  return repeater.rows.map((row) => {
    // Nothing is evaluated in the rows of a hidden repeater, so they need no scope of their own.
    const scopeOfWidgets = isHidden ? scope : scopeOfRow(scope, row, context.data);
    return withComputedWidget(row, rowLayout, scopeOfWidgets, context, isHidden);
  });
}

// -----------------------------------------------------------------------------
// One widget
// -----------------------------------------------------------------------------

type Values = Record<string, unknown>;

/** The computation of one widget: its inputs, and the widget that is written value by value. */
type Computation = {
  instance: WidgetInstance;
  scope: ExpressionScope;
  context: ComputeWidgetsContext;
  /** The previous computed widget. Empty for a widget that was not computed. */
  previous: Values;
  current: Values;
  hasChanged: boolean;
};

/**
 * @returns The previous computed widget when no value changed, so that a widget that did not
 *   change keeps its object. Else a new one.
 */
function computeWidget(
  instance: WidgetInstance,
  widget: CompiledWidget,
  scope: ExpressionScope,
  context: ComputeWidgetsContext,
): DerivedWidget<FormWidget<string>> {
  const computation: Computation = {
    instance,
    scope,
    context,
    previous: (instance.calculated?.current ?? {}) as Values,
    current: {},
    hasChanged: false,
  };
  const { source } = instance;
  const { current, previous } = computation;

  writeValue(computation, current, previous, 'uid', source.uid);
  writeValue(computation, current, previous, 'type', source.type);
  writeValue(computation, current, previous, 'kind', source.kind);
  for (const field of widget.coreFields) {
    const value = resolve(pickCandidate(field, context.activeStates).value, computation);
    writeValue(computation, current, previous, field.key, value);
  }
  computeProps(computation, widget.propFields);
  computeEvents(computation, widget.onFields);
  if (isLayoutWidget(source)) {
    computeChildren(computation, source);
  }

  if (!computation.hasChanged && instance.calculated !== undefined) {
    return instance.calculated;
  }
  return { source, current: current as FormWidget<string> };
}

/**
 * Writes one value of the computed widget. A value that is equal to the previous value keeps
 * the previous reference, and it does not count as a change.
 */
function writeValue(
  computation: Computation,
  target: Values,
  previousTarget: Values | undefined,
  key: string,
  value: unknown,
): void {
  const previousValue =
    previousTarget !== undefined && Object.prototype.hasOwnProperty.call(previousTarget, key)
      ? previousTarget[key]
      : undefined;
  if (deepEqual(previousValue, value)) {
    target[key] = previousValue;
    return;
  }
  target[key] = value;
  computation.hasChanged = true;
}

/** The candidates are in the order in which they are tried, and the last one has no state. */
function pickCandidate(field: CompiledField, activeStates: ReadonlySet<string>): CompiledCandidate {
  const { candidates } = field;
  for (const candidate of candidates) {
    if (candidate.state !== undefined && activeStates.has(candidate.state)) {
      return candidate;
    }
  }
  return candidates[candidates.length - 1];
}

// -----------------------------------------------------------------------------
// Props, events and children
// -----------------------------------------------------------------------------

function computeProps(computation: Computation, fields: CompiledPropField[]): void {
  const { instance, context, current, previous } = computation;
  const overrides: Values | undefined = context.overrides[instance.uid];

  if (overrides === undefined) {
    for (const field of fields) {
      writeProp(computation, field.key, resolveProp(field, computation), field.nameError);
    }
  } else {
    for (const name of propNamesWithOverrides(instance.source, overrides)) {
      const field = fields.find((candidate) => candidate.key === name);
      // The value of the definition is resolved also when an override replaces it, so an error
      // of that value is still reported.
      let value =
        field === undefined
          ? definitionValueOutsideFields(instance.source, name)
          : resolveProp(field, computation);
      const override = overrides[name];
      if (override !== undefined) {
        value = override;
      }
      writeProp(computation, name, value, errorOfPropName(name));
    }
  }

  // No write sees a prop that only a removed override had set, so the previous widget would stay.
  if (!computation.hasChanged && hasRemovedKey(previous['props'], current['props'])) {
    computation.hasChanged = true;
  }
}

/**
 * The names of the props of a widget that has overrides: the keys of the definition and of the
 * overrides up to their first dot, each one time.
 */
function propNamesWithOverrides(source: FormWidget<string>, overrides: Values): string[] {
  const keys = Object.keys({ ...source.props, ...overrides });
  return Array.from(new Set(keys.map((key) => key.split('.')[0])));
}

/**
 * The value that the definition gives to a prop name that only an override has. The props have
 * no own key with that name. This read also finds a member that every object has, such as
 * `toString`, and the computed widget keeps that value.
 */
function definitionValueOutsideFields(source: FormWidget<string>, name: string): unknown {
  const props: unknown = source.props;
  return props ? (props as Values)[name] : undefined;
}

function errorOfPropName(name: string): Error | undefined {
  const issue = forbiddenPathSegmentIssue(`props.${name}`);
  return issue === undefined ? undefined : new Error(issue);
}

function resolveProp(field: CompiledPropField, computation: Computation): unknown {
  const compiled = pickCandidate(field, computation.context.activeStates).value;
  const value = resolve(compiled, computation);
  if (compiled.kind !== 'translation' || !field.translatesNestedConfigs) {
    return value;
  }
  // A translator can return an array or an object that holds translation configs.
  const nested = compileNestedTranslationsOf(value, computation.context.expressionPolicy);
  return nested === undefined ? value : translateNested(nested, computation);
}

/**
 * Writes one prop of the computed widget.
 *
 * A prop is the value at the path `props.<name>`, and most names are a plain key of `props`.
 * The path helpers write the other names, because they give them a special result: an index as
 * the first name makes `props` an array, and an empty name reads all the previous props.
 *
 * @param nameError - The error of a name that cannot be written, such as `__proto__`.
 */
function writeProp(
  computation: Computation,
  name: string,
  value: unknown,
  nameError: Error | undefined,
): void {
  if (nameError !== undefined) {
    throw nameError;
  }
  const { current, previous } = computation;
  const previousProps = previous['props'];
  // The path helpers read an array by index, also for a name that is no index.
  if (Array.isArray(previousProps) || name === '' || startsWithDigit(name)) {
    writeThroughPath(computation, `props.${name}`, value);
    return;
  }
  let props = current['props'] as Values | undefined;
  if (props === undefined) {
    props = {};
    current['props'] = props;
  }
  writeValue(computation, props, previousProps as Values | undefined, name, value);
}

function startsWithDigit(name: string): boolean {
  const firstCharacterCode = name.charCodeAt(0);
  return firstCharacterCode >= 48 && firstCharacterCode <= 57;
}

function writeThroughPath(computation: Computation, path: string, value: unknown): void {
  const previousValue: unknown = get(computation.previous, path);
  if (deepEqual(previousValue, value)) {
    set(computation.current, path, previousValue);
    return;
  }
  set(computation.current, path, value);
  computation.hasChanged = true;
}

// This runs for every widget on every derive, so it allocates nothing.
function hasRemovedKey(previous: unknown, current: unknown): boolean {
  for (const key in previous as object | undefined) {
    if (current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
      return true;
    }
  }
  return false;
}

function computeEvents(computation: Computation, fields: CompiledField[]): void {
  if (fields.length === 0) {
    return;
  }
  // The decoder keeps only the event names that a widget can have, so a name is a plain key.
  const events: Values = {};
  computation.current['on'] = events;
  const previousEvents = computation.previous['on'] as Values | undefined;
  for (const field of fields) {
    const value = resolve(
      pickCandidate(field, computation.context.activeStates).value,
      computation,
    );
    writeValue(computation, events, previousEvents, field.key, value);
  }
}

/**
 * The children of a layout are the definition widgets of its visible children. While the uids
 * of that list are the uids of the previous list, the layout keeps the previous list, and the
 * children are no change.
 */
function computeChildren(computation: Computation, layout: LayoutWidget<string>): void {
  const { instance, current, previous } = computation;
  const visibleChildren = layout.children.filter(
    (_child, position) => instance.children[position].flags?.hidden !== true,
  );
  const previousChildren = previous['children'] as FormWidget<string>[] | undefined;
  const hasSameUids =
    previousChildren !== undefined &&
    previousChildren.length === visibleChildren.length &&
    visibleChildren.every((child, position) => previousChildren[position].uid === child.uid);
  if (hasSameUids) {
    current['children'] = previousChildren;
    return;
  }
  current['children'] = visibleChildren;
  computation.hasChanged = true;
}

// -----------------------------------------------------------------------------
// Values
// -----------------------------------------------------------------------------

class StringInterpolationError extends Error {
  readonly code = errorCodes.resolveStringInterpolationError;
  override name = 'StringInterpolationError';
}

function resolve(value: CompiledValue, computation: Computation): unknown {
  switch (value.kind) {
    case 'constant':
      return value.value;
    case 'interpolation':
      return interpolate(value.parts, computation.scope);
    case 'translation':
      return translate(value, computation);
    case 'nested':
      return translateNested(value, computation);
    case 'flag':
      return computation.instance.flags?.[value.flag];
    case 'path':
      return computation.instance.path;
    case 'failure':
      throw value.error;
  }
}

function interpolate(parts: (string | CompiledExpression)[], scope: ExpressionScope): string {
  let text = '';
  for (const part of parts) {
    if (typeof part === 'string') {
      text += part;
      continue;
    }
    // The conversion to a text can throw too, for example for an object without a prototype, so
    // it runs inside the same call as the evaluation.
    text += evaluateOrExplain(
      () => {
        const result = part.evaluate(scope);
        return result == null ? '' : String(result);
      },
      (cause) => `Failed to evaluate '{{${part.source}}}': ${cause}`,
    );
  }
  return text;
}

/**
 * Runs the evaluation of an expression of a text or of a translation param. A rejected
 * expression keeps its own error and code. Any other error becomes a `StringInterpolationError`
 * with the message that `explain` writes.
 */
function evaluateOrExplain<Result>(
  evaluate: () => Result,
  explain: (cause: string) => string,
): Result {
  try {
    return evaluate();
  } catch (error) {
    if (error instanceof ExpressionRejectedError) {
      throw error;
    }
    throw new StringInterpolationError(explain(errorMessage(error)));
  }
}

function translate(value: CompiledTranslation, computation: Computation): unknown {
  const { config } = value;
  let params: I18nParams | undefined = config.params;
  if (value.params !== undefined) {
    // No prototype, so a translator that reads a name that is not a param gets `undefined`.
    const resolved: Record<string, unknown> = Object.create(null);
    for (const param of value.params) {
      setOwnKey(
        resolved,
        param.name,
        'expression' in param
          ? evaluateOrExplain(
              () => param.expression.evaluate(computation.scope),
              (cause) => `Failed to evaluate i18n param '${param.expression.source}': ${cause}`,
            )
          : param.value,
      );
    }
    params = resolved as I18nParams;
  }
  return computation.context.translator.translate(config.key, params, config.default);
}

/** Copies the array or the object, with each translation config replaced by its translation. */
function translateNested(value: CompiledNestedTranslations, computation: Computation): unknown {
  const copy = (Array.isArray(value.source) ? [...value.source] : { ...value.source }) as Record<
    string | number,
    unknown
  >;
  for (const entry of value.entries) {
    if (entry.value.kind === 'failure') {
      throw entry.value.error;
    }
    copy[entry.key] =
      entry.value.kind === 'translation'
        ? translate(entry.value, computation)
        : translateNested(entry.value, computation);
  }
  return copy;
}
