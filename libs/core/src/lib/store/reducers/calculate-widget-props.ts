import {
  type ActionWidget,
  type FormWidget,
  type FunctionWidget,
  type InputWidget,
  isActionWidget,
  isDisplayWidget,
  isFunctionWidget,
  isInputWidget,
  isLayoutWidget,
  type LayoutWidget,
  type NonFunctionWidget,
} from '../../form-widget';
import {
  type I18nParams,
  type I18nTranslator,
  isTranslationConfig,
  type TranslationConfig,
} from '../../i18n';
import { compile, parse } from 'subscript/justin';
import { type $Errors, type ExpressionFunctions } from '../../shared';
import { calculateValidationVariables, type ValidationVariables } from '../../utils/form';
import { normalizeArrayIndexes } from '../../utils/justin';
import { get, set } from '../../utils/object';
import { extractRepeaterIndexes } from '../../utils/repeater';
import { type DerivedWidget, type RepeaterItemScope, type State } from '../model';
import { deepEqual, hasWhen } from './utils';
import { errorCodes } from '../../errors';

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

/**
 * Resolves the props of every visible entry in `calculatedWidgets`.
 *
 * @param validationVariables - Pass them when already computed for this pass, otherwise they are computed here.
 */
export const calculateWidgetProps =
  (localization: I18nTranslator, functions: ExpressionFunctions) =>
  (state: State, validationVariables?: ValidationVariables): State => {
    try {
      const variables = validationVariables ?? calculateValidationVariables(state);
      return {
        ...state,
        calculatedWidgets: calculateAll(state, localization, functions, variables),
      };
    } catch (err) {
      const error = err as Error & { code?: number };
      const code = error.code ?? errorCodes.calculateWidgetPropsError;
      return {
        ...state,
        formHealth: {
          status: 'errored',
          message: `[${code}] ${error.message}`,
          code,
        },
      };
    }
  };

// -----------------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------------

function calculateAll(
  state: State,
  localization: I18nTranslator,
  functions: ExpressionFunctions,
  { $formIsInvalid, $errors }: ValidationVariables,
): State['calculatedWidgets'] {
  const ctx = makeResolverCtx(state, localization, $formIsInvalid, $errors, functions);
  const result: State['calculatedWidgets'] = {};

  for (const uid of Object.keys(state.calculatedWidgets)) {
    if (state.widgetFlags[uid]?.hidden) {
      continue;
    }

    const prev = state.calculatedWidgets[uid];
    const source = prev.source;
    const itemScope = state.repeaterItemScopes[uid];

    if (isFunctionWidget(source)) {
      result[uid] = computeFunctionWidget(prev, uid, source, state, localization, itemScope);
      continue;
    }

    // Widgets inside a repeater item see that item through $item / $index
    const widgetCtx = itemScope
      ? { ...ctx, $item: get(ctx.$form, itemScope.itemPath), $index: itemScope.index }
      : ctx;

    result[uid] = computeNonFunctionWidget(
      prev as DerivedWidget<NonFunctionWidget<string>>,
      source,
      state,
      widgetCtx,
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// FunctionWidget path
// -----------------------------------------------------------------------------

function computeFunctionWidget(
  prev: DerivedWidget<FormWidget<string>>,
  uid: string,
  source: FunctionWidget<string>,
  state: State,
  localization: I18nTranslator,
  itemScope?: RepeaterItemScope,
): DerivedWidget<FormWidget<string>> {
  // The function may return a cached object. Copy it before writing uid and path,
  // so the write never reaches the object the function owns.
  const current = {
    ...source({
      $form: state.data,
      errors: source.path ? state.validations[source.path] : undefined,
      touched: source.path ? state.touchedControls[source.path] : undefined,
      translate: localization.translate,
      $item: itemScope ? get(state.data, itemScope.itemPath) : undefined,
      $index: itemScope?.index,
    }),
  };
  current.uid = uid;
  // A row function widget returns the template path, the source carries the row path.
  if (source.path !== undefined) {
    (current as InputWidget<unknown, string>).path = source.path;
  }

  // An override wins over the value the function returned, the same precedence `applyPropsField`
  // gives it for every other widget.
  const overrides = state.widgetPropOverrides[uid];
  if (overrides !== undefined) {
    current.props = { ...current.props, ...overrides };
  }

  // A function widget builds a new config object on every call, so compare the content
  // to avoid handing subscribers a new reference for an unchanged widget.
  if (prev.current && deepEqual(prev.current, current)) {
    return prev;
  }

  return { source, current };
}

// -----------------------------------------------------------------------------
// NonFunctionWidget (compute by kind)
// -----------------------------------------------------------------------------

function computeNonFunctionWidget(
  prev: DerivedWidget<NonFunctionWidget<string>>,
  source: NonFunctionWidget<string>,
  state: State,
  ctx: ResolverCtx,
): DerivedWidget<NonFunctionWidget<string>> {
  const tracker = new ChangeTracker(source, prev.current);

  // Identity fields never come from expressions/overrides/suffixes, copy directly.
  tracker.write('uid', source.uid);
  tracker.write('type', source.type);
  tracker.write('kind', source.kind);

  if (isDisplayWidget(source)) {
    computeDisplayFields(tracker, ctx);
  } else if (isActionWidget(source)) {
    computeActionFields(tracker, ctx);
  } else if (isInputWidget(source)) {
    computeInputFields(tracker, ctx);
  } else if (isLayoutWidget(source)) {
    computeLayoutFields(tracker, ctx);
  }

  computePropsFields(source, tracker, ctx, state);

  // TODO: `on` is NOT computed for LayoutWidget. Should we implement it?
  if (isActionWidget(source) || isInputWidget(source)) {
    computeOnFields(source, tracker, ctx);
  }

  if (isLayoutWidget(source)) {
    computeChildren(source, tracker, state);
  }

  return tracker.changed ? { source: prev.source, current: tracker.current } : prev;
}

// -----------------------------------------------------------------------------
// Core field computations by kind.
// Each kind lists exactly the fields it can have.
// -----------------------------------------------------------------------------

function computeDisplayFields(t: ChangeTracker, ctx: ResolverCtx): void {
  applyCoreField(t, ctx, 'size');
  applyCoreField(t, ctx, 'include');
  applyCoreField(t, ctx, 'exclude');
}

function computeActionFields(t: ChangeTracker, ctx: ResolverCtx): void {
  applyCoreField(t, ctx, 'size');
  applyCoreField(t, ctx, 'include');
  applyCoreField(t, ctx, 'exclude');
  applyCoreField(t, ctx, 'label');
  applyCoreField(t, ctx, 'disabled');
  applyCoreField(t, ctx, 'actionType');
}

function computeInputFields(t: ChangeTracker, ctx: ResolverCtx): void {
  applyCoreField(t, ctx, 'size');
  applyCoreField(t, ctx, 'include');
  applyCoreField(t, ctx, 'exclude');
  applyCoreField(t, ctx, 'label');
  applyCoreField(t, ctx, 'disabled');
  applyCoreField(t, ctx, 'readonly');
  applyCoreField(t, ctx, 'validator');
  applyCoreField(t, ctx, 'path');
  applyCoreField(t, ctx, 'defaultValue');
}

function computeLayoutFields(t: ChangeTracker, ctx: ResolverCtx): void {
  applyCoreField(t, ctx, 'size');
  applyCoreField(t, ctx, 'include');
  applyCoreField(t, ctx, 'exclude');
}

// -----------------------------------------------------------------------------
// Category helpers: props, on, children
// -----------------------------------------------------------------------------

function computePropsFields(
  source: NonFunctionWidget<string>,
  tracker: ChangeTracker,
  ctx: ResolverCtx,
  state: State,
): void {
  const overrides = state.widgetPropOverrides[source.uid] ?? {};
  const merged = { ...(source.props ?? {}), ...overrides };
  for (const prop of unsuffixedUniqueKeys(Object.keys(merged))) {
    applyPropsField(tracker, ctx, prop);
  }
}

function computeOnFields(
  source: ActionWidget<string> | InputWidget<any, string>,
  tracker: ChangeTracker,
  ctx: ResolverCtx,
): void {
  const on = source.on ?? {};
  for (const prop of unsuffixedUniqueKeys(Object.keys(on))) {
    applyOnField(tracker, ctx, prop);
  }
}

function computeChildren(source: LayoutWidget<string>, tracker: ChangeTracker, state: State): void {
  const repeaterIndexes = extractRepeaterIndexes(source.uid);
  const visible = resolveVisibleChildren(source.children, repeaterIndexes, state.widgetFlags);

  (tracker.current as LayoutWidget<string>).children = visible;

  const prevChildren = (tracker.previous as LayoutWidget<string>).children ?? [];
  const structurallyEqual =
    prevChildren.length === visible.length &&
    visible.every((_, i) => prevChildren[i] && prevChildren[i].uid === visible[i].uid);

  if (!structurallyEqual) {
    tracker.markChanged();
  }
}

// -----------------------------------------------------------------------------
// Apply wrappers - pick raw value, pass to the right value-type resolver,
// write into `current` with change tracking.
// -----------------------------------------------------------------------------

type CoreField =
  | 'size'
  | 'include'
  | 'exclude'
  | 'label'
  | 'disabled'
  | 'readonly'
  | 'validator'
  | 'path'
  | 'defaultValue'
  | 'actionType';

function applyCoreField(t: ChangeTracker, ctx: ResolverCtx, field: CoreField): void {
  const source = t.source as Record<string, unknown>;
  if (!sourceHasField(source, field)) {
    return;
  }

  const raw = pickSuffixedValue(source, field, ctx.sortedStates);
  let resolved: unknown;

  switch (field) {
    case 'disabled':
    case 'readonly':
      resolved = resolveBoolOrWhen(raw, ctx, t.source.uid, field);
      break;
    case 'defaultValue':
      resolved = raw;
      break;
    default:
      resolved = resolveValue(raw, ctx);
  }

  t.write(field, resolved);
}

function applyPropsField(t: ChangeTracker, ctx: ResolverCtx, subProp: string): void {
  const sourceProps = (t.source as { props?: Record<string, unknown> }).props;
  const raw = pickSuffixedValue(sourceProps, subProp, ctx.sortedStates);
  let resolved = resolveValue(raw, ctx);

  // widgetPropOverrides takes precedence over everything - applied AFTER function evaluation,
  // i18n translation, and template substitution.
  const override = ctx.widgetPropOverrides[t.source.uid]?.[subProp];
  if (override !== undefined) {
    resolved = override;
  }

  t.write(`props.${subProp}`, resolved);
}

function applyOnField(t: ChangeTracker, ctx: ResolverCtx, subProp: string): void {
  const sourceOn = (t.source as { on?: Record<string, unknown> }).on;
  const raw = pickSuffixedValue(sourceOn, subProp, ctx.sortedStates);
  t.write(`on.${subProp}`, resolveOnValue(raw, ctx));
}

// -----------------------------------------------------------------------------
// Value-type resolvers - pure: (value, ctx) -> value.
// -----------------------------------------------------------------------------

type WidgetFn = (api: {
  $form: any;
  translate: I18nTranslator['translate'];
  $item?: any;
  $index?: number;
}) => unknown;

function resolveFunctionProp(fn: WidgetFn, ctx: ResolverCtx): unknown {
  return fn({
    $form: ctx.$form,
    translate: ctx.localization.translate,
    $item: ctx.$item,
    $index: ctx.$index,
  });
}

function resolveTranslationConfig(tc: TranslationConfig, ctx: ResolverCtx): string {
  return ctx.localization.translate(tc.key, resolveI18nParams(tc.params, ctx), tc.default);
}

const STRING_INTERPOLATION_REGEX = /\{\{([^}]+)\}\}/g;

function resolveString(input: string, ctx: ResolverCtx): string {
  if (!input.includes('{{')) {
    return input;
  }

  return input.replace(STRING_INTERPOLATION_REGEX, (_match, rawExpr: string) => {
    const expr = normalizeArrayIndexes(rawExpr.trim());
    try {
      const result = compile(parse(expr))({
        $form: ctx.$form,
        $meta: ctx.$meta,
        $errors: ctx.$errors,
        $formIsInvalid: ctx.$formIsInvalid,
        $item: ctx.$item,
        $index: ctx.$index,
        $fn: ctx.$fn,
      });
      return result == null ? '' : String(result);
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new StringInterpolationError(`Failed to evaluate '{{${rawExpr.trim()}}}': ${cause}`);
    }
  });
}

/** function | TranslationConfig | string-template | passthrough. */
function resolveValue(value: unknown, ctx: ResolverCtx): unknown {
  if (typeof value === 'function') {
    return resolveFunctionProp(value as WidgetFn, ctx);
  }
  if (isTranslationConfig(value)) {
    return resolveTranslationConfig(value, ctx);
  }
  if (typeof value === 'string') {
    return resolveString(value, ctx);
  }
  return value;
}

/** For `disabled` / `readonly` - function | {when}->widgetFlags | string | passthrough. */
function resolveBoolOrWhen(
  value: unknown,
  ctx: ResolverCtx,
  uid: string,
  field: 'disabled' | 'readonly',
): unknown {
  if (typeof value === 'function') {
    return resolveFunctionProp(value as WidgetFn, ctx);
  }
  if (hasWhen(value)) {
    return ctx.widgetFlags[uid]?.[field];
  }
  if (typeof value === 'string') {
    return resolveString(value, ctx);
  }
  return value;
}

/**
 * For `on.<handler>` - function | passthrough.
 *
 * Event handler strings (e.g. `"submit"`) are never scoped-path templates,
 * so no resolution is needed beyond calling a function value if present.
 */
function resolveOnValue(value: unknown, ctx: ResolverCtx): unknown {
  if (typeof value === 'function') {
    return resolveFunctionProp(value as WidgetFn, ctx);
  }
  return value;
}

// -----------------------------------------------------------------------------
// Suffix picking + i18n params
// -----------------------------------------------------------------------------

/**
 * Picks the longest matching state suffix for `baseKey` on `fieldSource`; falls back
 * to the base key when no state matches. `sortedStates` is expected to be
 * pre-sorted longest-first (see `makeResolverCtx`).
 */
function pickSuffixedValue<V = unknown>(
  fieldSource: Record<string, unknown> | undefined,
  baseKey: string,
  sortedStates: string[],
): V | undefined {
  if (!fieldSource) {
    return undefined;
  }
  for (const s of sortedStates) {
    const suffixed = fieldSource[`${baseKey}.${s}`];
    if (suffixed !== undefined) {
      return suffixed as V;
    }
  }
  return fieldSource[baseKey] as V | undefined;
}

function isPotentialExpression(value: string): boolean {
  return (
    value.startsWith('$form') ||
    value.startsWith('$meta') ||
    value.startsWith('$errors') ||
    value.startsWith('$item') ||
    value.startsWith('$index') ||
    value.startsWith('$fn') ||
    value === '$formIsInvalid'
  );
}

/**
 * Resolves i18n interpolation parameters to concrete values.
 *
 * Each parameter value is either a literal (string or number) or a subscript
 * expression starting with a scope prefix ($form, $meta, $errors, $formIsInvalid).
 */
function resolveI18nParams(
  params: I18nParams | undefined,
  ctx: ResolverCtx,
): I18nParams | undefined {
  if (!params) {
    return params;
  }
  return Object.keys(params).reduce((acc, key) => {
    const param = String(params[key]);
    if (isPotentialExpression(param)) {
      try {
        const result = compile(parse(normalizeArrayIndexes(param)))({
          $form: ctx.$form,
          $meta: ctx.$meta,
          $errors: ctx.$errors,
          $formIsInvalid: ctx.$formIsInvalid,
          $item: ctx.$item,
          $index: ctx.$index,
          $fn: ctx.$fn,
        });
        acc[key] = result ?? param;
      } catch (err) {
        const cause = err instanceof Error ? err.message : String(err);
        throw new StringInterpolationError(`Failed to evaluate i18n param '${param}': ${cause}`);
      }
    } else {
      acc[key] = param;
    }
    return acc;
  }, {} as I18nParams);
}

// -----------------------------------------------------------------------------
// ChangeTracker - accumulates writes into `current`, compares against
// `previous` for change detection.
// -----------------------------------------------------------------------------

class ChangeTracker<F extends NonFunctionWidget<string> = NonFunctionWidget<string>> {
  readonly source: F;
  readonly previous: F;
  readonly current: F;
  private _changed = false;
  get changed() {
    return this._changed;
  }

  constructor(source: F, previous: F) {
    this.source = source;
    this.previous = previous;
    this.current = {} as F;
  }

  markChanged(): void {
    this._changed = true;
  }

  write(dotPath: string, value: unknown): void {
    const prev = get(this.previous as Record<string, unknown>, dotPath);

    // An expression that rebuilds an equal object or array must not count as a change,
    // so keep the previous reference and leave `changed` alone.
    if (deepEqual(prev, value)) {
      set(this.current as Record<string, unknown>, dotPath, prev);
      return;
    }

    set(this.current as Record<string, unknown>, dotPath, value);
    this._changed = true;
  }
}

// -----------------------------------------------------------------------------
// ResolverCtx + small helpers
// -----------------------------------------------------------------------------

interface ResolverCtx {
  /** `currentStates` pre-sorted longest-first, so `pickSuffixedValue` can iterate directly. */
  sortedStates: string[];
  widgetPropOverrides: State['widgetPropOverrides'];
  widgetFlags: State['widgetFlags'];
  $form: State['data'];
  $meta: State['meta'];
  $formIsInvalid: boolean;
  $errors: $Errors;
  localization: I18nTranslator;
  /** Host-provided pure functions, exposed to expressions as `$fn`. */
  $fn: ExpressionFunctions;
  /** Set only for widgets inside a repeater item: the item object itself */
  $item?: unknown;
  /** Set only for widgets inside a repeater item: the item's position. */
  $index?: number;
}

function makeResolverCtx(
  state: State,
  localization: I18nTranslator,
  $formIsInvalid: boolean,
  $errors: $Errors,
  functions: ExpressionFunctions,
): ResolverCtx {
  return {
    sortedStates: [...state.currentStates].sort((a, b) => b.length - a.length),
    widgetPropOverrides: state.widgetPropOverrides,
    widgetFlags: state.widgetFlags,
    $form: state.data,
    $meta: state.meta,
    $formIsInvalid,
    $errors,
    localization,
    $fn: functions,
  };
}

/** True when `field` itself or any `field.<state>` variant is present on source. */
function sourceHasField(source: Record<string, unknown>, field: string): boolean {
  if (field in source) {
    return true;
  }
  const prefix = `${field}.`;
  return Object.keys(source).some((k) => k.startsWith(prefix));
}

function unsuffixedUniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.split('.')[0])));
}

function resolveVisibleChildren<C extends { uid?: string }>(
  children: C[],
  repeaterIndexes: number[],
  widgetFlags: State['widgetFlags'],
): C[] {
  const suffix = repeaterIndexes.map((i) => `[${i}]`).join('');
  return children.filter((child) => {
    const actualUid = (child.uid as string) + suffix;
    const flags = widgetFlags[actualUid];
    return !flags || flags.hidden !== true;
  });
}

// -----------------------------------------------------------------------------
// Custom errors
// -----------------------------------------------------------------------------

class StringInterpolationError extends Error {
  readonly code = errorCodes.resolveStringInterpolationError;
  override name = 'StringInterpolationError';
}
