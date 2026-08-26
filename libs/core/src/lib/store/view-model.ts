import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { type FormWidget, isLayoutWidget, type NonFunctionWidget } from '../form-widget';
import { type DotPath, type Uid } from '../shared';
import { get } from '../utils/object';
import { extractRepeaterIndexes, isRepeaterWidget, toRepeaterItemUid } from '../utils/repeater';
import { type State } from './model';

/**
 * One render-ready snapshot of everything a widget component needs from the store, so a binding
 * can serve a widget from a single subscription (or a single snapshot read) instead of one
 * subscription per store slice.
 *
 * Hidden widgets are reported as they are: `widget` is `undefined` and `hidden` is `true`. This
 * differs from the calculated-widget lookup, which holds no entry for a hidden widget and
 * therefore leaves subscribers holding the last visible value.
 */
export type WidgetViewModel<T = unknown> = {
  uid: Uid;

  /**
   * The fully calculated widget (`calculatedWidgets[uid].current`), `undefined` while the widget
   * is hidden or absent from the current derive.
   */
  widget: NonFunctionWidget<string> | undefined;

  /**
   * A layout widget's visible children, with repeater row indexes already applied to each child's
   * `uid` and `path`. Empty for non-layout widgets and while hidden. Bindings can hand these nodes
   * straight to their widget renderer without applying the indexes themselves.
   */
  children: FormWidget<string>[];

  /**
   * For a repeater input, one fully indexed row layout node per row of its array value, ready to
   * render. Empty for non-repeater widgets and while hidden. Row order matches the data array, so
   * a row's position in this list is also its index in the value. The one exception is an errored
   * derive, where a row the failed derive never resolved is left out until the form recovers.
   */
  rows: NonFunctionWidget<string>[];

  /** The BCP 47 language tag of the current locale. */
  lang: string;

  /** The form data at the widget's path, `undefined` for widgets without a path. */
  value: T | undefined;

  /**
   * Schema and injected validation messages merged into one list. Empty until the form has been
   * touched, so nothing shows before the user interacts.
   */
  errors: string[];

  /** Whether this control has been touched and may display its errors. */
  touched: boolean;

  /**
   * True when the form has been touched and is currently invalid. This is what action widgets
   * (submit buttons) render as their `invalid` state.
   */
  formInvalid: boolean;

  /** The widget's `hidden` flag for the current derive. */
  hidden: boolean;
};

/**
 * Reads one widget's view model out of a state snapshot. Pure and uncached: every call builds
 * fresh objects. Use {@link createWidgetViewModelReader} when reference stability across calls
 * matters (change detection, `distinctUntilChanged`, React's `useSyncExternalStore`).
 *
 * @param state - A store state snapshot (`store.getState()`).
 * @param uid - The widget's uid, including repeater row indexes when the widget lives inside a
 *   repeater row (e.g. `firstName[0]`).
 * @returns The widget's view model.
 * @example
 * const vm = widgetViewModel<string>(store.getState(), 'firstName');
 * vm.value; // the data at the widget's path
 * vm.errors; // [] until the form is touched
 */
export function widgetViewModel<T = unknown>(state: State, uid: Uid): WidgetViewModel<T> {
  return buildViewModel(state, uid, collectSlices(state, uid), undefined) as WidgetViewModel<T>;
}

/**
 * Creates a memoizing reader over {@link widgetViewModel}: for a given uid it returns the exact
 * same object until one of that widget's state slices changes, and reuses the `children` / `rows`
 * / `errors` arrays while their own inputs are unchanged. Create one reader per store and keep it
 * for the store's lifetime.
 *
 * @returns A reader function over a state snapshot and a uid.
 * @example
 * const readViewModel = createWidgetViewModelReader();
 * const a = readViewModel(store.getState(), 'firstName');
 * // ... an unrelated widget changes ...
 * const b = readViewModel(store.getState(), 'firstName');
 * a === b; // true
 */
export function createWidgetViewModelReader(): <T = unknown>(
  state: State,
  uid: Uid,
) => WidgetViewModel<T> {
  const cacheByUid = new Map<Uid, CacheEntry>();

  return <T = unknown>(state: State, uid: Uid): WidgetViewModel<T> => {
    const slices = collectSlices(state, uid);
    const cached = cacheByUid.get(uid);

    if (cached && sameSlices(cached.slices, slices)) {
      return cached.viewModel as WidgetViewModel<T>;
    }

    const viewModel = buildViewModel(state, uid, slices, cached);
    cacheByUid.set(uid, { slices, viewModel });
    return viewModel as WidgetViewModel<T>;
  };
}

/**
 * RxJS operator form of {@link widgetViewModel} for subscribe-based bindings: maps the store's
 * `state$` to the widget's view model and emits only when the view model actually changed.
 *
 * @param uid - The widget's uid, row indexes included when it lives inside a repeater row.
 * @returns An operator from a state stream to a view model stream.
 * @example
 * store.state$.pipe(widgetViewModel$('firstName')).subscribe((vm) => { ... });
 */
export const widgetViewModel$ =
  <T = unknown>(uid: Uid) =>
  (state$: Observable<State>): Observable<WidgetViewModel<T>> => {
    const readViewModel = createWidgetViewModelReader();
    return state$.pipe(
      map((state) => readViewModel<T>(state, uid)),
      // The reader returns the same object while nothing changed, so reference equality is enough.
      distinctUntilChanged(),
    );
  };

// -----------------------------------------------------------------------------
//
// Internals
//
// -----------------------------------------------------------------------------

type CacheEntry = {
  slices: Slices;
  viewModel: WidgetViewModel;
};

/**
 * The state slices a widget's view model is built from, in a fixed order so two collections can be
 * compared position by position with `Object.is`.
 */
type Slices = [
  derived: State['calculatedWidgets'][Uid] | undefined,
  lang: string,
  value: unknown,
  validation: State['validations'][DotPath] | null,
  injectedValidation: State['injectedValidations'][DotPath] | null,
  touched: boolean,
  formInvalid: boolean,
  hidden: boolean,
];

const NO_CHILDREN: FormWidget<string>[] = [];
const NO_ROWS: NonFunctionWidget<string>[] = [];
const NO_ERRORS: string[] = [];

function collectSlices(state: State, uid: Uid): Slices {
  const path = widgetPath(state, uid);
  return [
    state.calculatedWidgets[uid],
    state.lang,
    path === undefined ? undefined : get(state.data, path),
    path !== undefined && state.touched ? state.validations[path] : null,
    path !== undefined && state.touched ? state.injectedValidations[path] : null,
    path !== undefined && state.touchedControls[path] === true,
    state.touched && !state.isFormValid,
    state.widgetFlags[uid]?.hidden === true,
  ];
}

function sameSlices(previous: Slices, next: Slices): boolean {
  return previous.every((slice, index) => Object.is(slice, next[index]));
}

function buildViewModel(
  state: State,
  uid: Uid,
  slices: Slices,
  cached: CacheEntry | undefined,
): WidgetViewModel {
  const [derived, lang, value, validation, injectedValidation, touched, formInvalid, hidden] =
    slices;

  const derivedChanged = cached === undefined || !Object.is(cached.slices[0], derived);
  const valueChanged = cached === undefined || !Object.is(cached.slices[2], value);
  const validationChanged =
    cached === undefined ||
    !Object.is(cached.slices[3], validation) ||
    !Object.is(cached.slices[4], injectedValidation);

  const current = derived?.current;

  return {
    uid,
    widget: current,
    children: derivedChanged
      ? stampedChildren(state, uid, current)
      : (cached as CacheEntry).viewModel.children,
    rows:
      derivedChanged || valueChanged
        ? repeaterRows(state, uid, current, value)
        : (cached as CacheEntry).viewModel.rows,
    lang,
    value,
    errors: validationChanged
      ? mergedErrors(validation, injectedValidation)
      : (cached as CacheEntry).viewModel.errors,
    touched,
    formInvalid,
    hidden,
  };
}

function widgetPath(state: State, uid: Uid): DotPath | undefined {
  const source = state.resolvedSources[uid] as { path?: DotPath } | undefined;
  return source?.path;
}

/**
 * A layout's calculated `children` hold the raw template nodes, whose uids carry no repeater row
 * indexes. Widgets inside a repeater row need the indexed nodes, which `expandSources` already
 * produced into `resolvedSources`, so this looks them up by appending the layout's own row indexes
 * to each child uid. Outside a repeater the suffix is empty and the calculated children pass
 * through unchanged (the same array reference the calculated layout widget holds).
 */
function stampedChildren(
  state: State,
  uid: Uid,
  current: NonFunctionWidget<string> | undefined,
): FormWidget<string>[] {
  if (current === undefined || !isLayoutWidget(current)) {
    return NO_CHILDREN;
  }
  const children = current.children as FormWidget<string>[];
  const rowIndexes = extractRepeaterIndexes(uid);
  if (rowIndexes.length === 0) {
    return children;
  }
  const suffix = rowIndexes.map((index) => `[${index}]`).join('');
  // The indexed node always exists because `resolvedSources` and the calculated children come from
  // the same derive. The fallback only guards a reader holding an older snapshot.
  return children.map((child) => state.resolvedSources[`${child.uid}${suffix}`] ?? child);
}

/**
 * Builds the list of row layout nodes for a repeater input: one per entry of its array value, each
 * looked up in `resolvedSources` by the template uid plus the full row index chain. A nested
 * repeater's own row indexes are read back from its uid, which is what makes the chain line up
 * with the keys `expandSources` writes.
 *
 * A row with no node is dropped. That happens on an errored derive, which publishes the new `data`
 * with the previous derive's `resolvedSources`, so the value array can be longer than the rows the
 * store knows. The next successful derive lists them all again.
 */
function repeaterRows(
  state: State,
  uid: Uid,
  current: NonFunctionWidget<string> | undefined,
  value: unknown,
): NonFunctionWidget<string>[] {
  if (current === undefined || !Array.isArray(value)) {
    return NO_ROWS;
  }
  const source = state.resolvedSources[uid];
  if (source === undefined || !isRepeaterWidget(source)) {
    return NO_ROWS;
  }
  const templateUid = source.props.template.uid as Uid;
  const ownIndexes = extractRepeaterIndexes(uid);
  return value
    .map((_, rowIndex) => {
      const rowUid = toRepeaterItemUid(templateUid, [...ownIndexes, rowIndex]);
      return state.resolvedSources[rowUid];
    })
    .filter((row): row is NonFunctionWidget<string> => row !== undefined);
}

function mergedErrors(
  validation: State['validations'][DotPath] | null,
  injectedValidation: State['injectedValidations'][DotPath] | null,
): string[] {
  const total = (validation?.length ?? 0) + (injectedValidation?.length ?? 0);
  if (total === 0) {
    return NO_ERRORS;
  }
  return [...(validation ?? []), ...(injectedValidation ?? [])];
}
