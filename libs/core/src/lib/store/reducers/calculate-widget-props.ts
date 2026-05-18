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
import { type I18nParams, type I18nTranslator, isTranslationConfig, type TranslationConfig } from '../../i18n';
import { type $Errors } from '../../shared';
import {
  calculateValidationVariables,
  isPotentialScopedPath,
  resolveScopedPath,
  resolveScopedPaths,
} from '../../utils/form';
import { get, set } from '../../utils/object';
import { type DerivedWidget, type State } from '../model';
import { hasWhen } from './utils';

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

export const calculateWidgetProps =
  (localization: I18nTranslator) =>
  (state: State): State => ({
    ...state,
    calculatedWidgets: calculateAll(state, localization),
  });

// -----------------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------------

function calculateAll(state: State, localization: I18nTranslator): State['calculatedWidgets'] {
  const { $formIsInvalid, $errors } = calculateValidationVariables(state);
  const ctx = makeResolverCtx(state, localization, $formIsInvalid, $errors);
  const result: State['calculatedWidgets'] = {};

  for (const uid of Object.keys(state.calculatedWidgets)) {
    if (state.widgetFlags[uid]?.hidden) {
      continue;
    }

    const prev = state.calculatedWidgets[uid];
    const source = prev.source;

    if (isFunctionWidget(source)) {
      result[uid] = computeFunctionWidget(uid, source, state, localization);
      continue;
    }

    result[uid] = computeNonFunctionWidget(
      prev as DerivedWidget<NonFunctionWidget<string>>,
      source,
      state,
      ctx,
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// FunctionWidget path
// -----------------------------------------------------------------------------

function computeFunctionWidget(
  uid: string,
  source: FunctionWidget<string>,
  state: State,
  localization: I18nTranslator,
): DerivedWidget<FormWidget<string>> {
  const current = source({
    $form: state.data,
    errors: source.path ? state.validations[source.path] : undefined,
    touched: source.path ? state.touchedControls[source.path] : undefined,
    translate: localization.translate,
  });
  current.uid = uid;
  // TODO: structural comparison to preserve ref when equal?
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
  | 'defaultValue';

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

type WidgetFn = (api: { $form: any; translate: I18nTranslator['translate'] }) => unknown;

function resolveFunctionProp(fn: WidgetFn, ctx: ResolverCtx): unknown {
  return fn({ $form: ctx.$form, translate: ctx.localization.translate });
}

function resolveTranslationConfig(tc: TranslationConfig, ctx: ResolverCtx): string {
  return ctx.localization.translate(tc.key, resolveI18nParams(tc.params, ctx), tc.default);
}

function resolveString(input: string, ctx: ResolverCtx): string {
  return resolveScopedPaths(input, {
    resolveFormPath: (p) => get(ctx.$form, p) ?? input,
    resolveMetaPath: (p) => get(ctx.$meta, p) ?? input,
    resolveErrorsPath: (p) => get(ctx.$errors, p) ?? input,
    resolveFormIsInvalid: () => String(ctx.$formIsInvalid),
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

/**
 * Resolves i18n interpolation parameters to concrete values.
 *
 * Each parameter value is either a literal (string or number) or a scoped
 * path that is looked up in `$form`, `$meta`, `$errors`, or `$formIsInvalid`.
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
    if (isPotentialScopedPath(param)) {
      acc[key] = resolveScopedPath(param, {
        resolveFormPath: (p) => get(ctx.$form, p) ?? param,
        resolveMetaPath: (p) => get(ctx.$meta, p) ?? param,
        resolveErrorsPath: (p) => get(ctx.$errors, p) ?? param,
        resolveFormIsInvalid: () => ctx.$formIsInvalid,
      });
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
    set(this.current as Record<string, unknown>, dotPath, value);
    // TODO: only primitive-level reference equality; structurally equivalent
    // objects/arrays will still trip `changed`.
    const prev = get(this.previous as Record<string, unknown>, dotPath);
    if (prev !== value) {
      this._changed = true;
    }
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
}

function makeResolverCtx(
  state: State,
  localization: I18nTranslator,
  $formIsInvalid: boolean,
  $errors: $Errors,
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

/** `"abc[0][1]"` -> `[0, 1]`, `"abc"` -> `[]`. */
const extractRepeaterIndexes = (uid: string): number[] =>
  [...uid.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10));
