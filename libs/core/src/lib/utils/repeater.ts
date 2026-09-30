import {
  type FormWidget,
  type FunctionWidget,
  type InputWidget,
  isFunctionWidget,
  isInputWidget,
  type LayoutWidget,
  type NonFunctionWidget,
} from '../form-widget';
import { type DotPath, type Uid } from '../shared';
import { type RepeaterItemScope, type RepeaterRow, type State } from '../store/model';
import { flattenForm } from './form';
import { get } from './object';

/**
 * A repeater input widget as the core reads it: an input with a layout template under `props.template`.
 */
export type RepeaterTemplateWidget = InputWidget<string> & {
  type: 'repeater';
  props: {
    template: LayoutWidget<string>;
  };
};

export const isRepeaterWidget = (widget: FormWidget<string>): widget is RepeaterTemplateWidget =>
  !isFunctionWidget(widget) && widget.type === 'repeater';

/** `"abc[0][1]"` -> `[0, 1]`, `"abc"` -> `[]`. */
export const extractRepeaterIndexes = (uid: string): number[] =>
  [...uid.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10));

/** The path segment that stands for "the current row" in template paths, e.g. `users.items.name`. */
const ITEMS_TOKEN = 'items';

/**
 * The three maps `expandSources` builds from the form and the data.
 */
export type ExpandedSources = {
  resolvedSources: Record<Uid, FormWidget<string>>;
  repeaterItemScopes: Record<Uid, RepeaterItemScope>;
  repeaterRows: Record<Uid, RepeaterRow[]>;
};

/**
 * Walks the flat form and the current data and returns every widget that exists for that data.
 *
 * `resolvedSources` holds the `flatForm` widgets by reference plus, for every repeater row, one entry
 * per template widget (the row layout node included) with the row indexes written into `uid` and `path`.
 * Nested repeater containers are entries too and are recursed with their concrete path. Function widgets
 * stay callable (see {@link makeRepeaterItemConfig}), `when` expressions are not rewritten here.
 *
 * `repeaterItemScopes` maps every row widget uid to the innermost item that owns it, and
 * `repeaterRows` to every row that owns it, outermost first.
 *
 * @param flatForm - The flattened form definition keyed by uid.
 * @param data - The current form data the repeater arrays are read from.
 * @returns The maps, rebuilt from scratch.
 *
 * @example
 * const { resolvedSources, repeaterItemScopes } = expandSources(flatForm, { users: [{}, {}] });
 * resolvedSources['name[1]'].path;      // 'users.1.name'
 * repeaterItemScopes['name[1]'];        // { itemPath: 'users.1', index: 1 }
 */
export function expandSources(
  flatForm: State['flatForm'],
  data: Record<string, any>,
): ExpandedSources {
  const expanded: ExpandedSources = {
    resolvedSources: {},
    repeaterItemScopes: {},
    repeaterRows: {},
  };
  for (const widget of Object.values(flatForm)) {
    expanded.resolvedSources[widget.uid as Uid] = widget;
    if (isRepeaterWidget(widget)) {
      expandRepeaterRows(widget, widget.path, [], data, expanded);
    }
  }
  return expanded;
}

/**
 * @param repeater - The repeater with a concrete `path`.
 * @param declaredPath - The same repeater's `path` as the template declares it.
 * @param outerRows - The rows of the enclosing repeaters, outermost first.
 */
function expandRepeaterRows(
  repeater: RepeaterTemplateWidget,
  declaredPath: DotPath,
  outerRows: RepeaterRow[],
  data: Record<string, any>,
  expanded: ExpandedSources,
): void {
  const rowValues = get(data, repeater.path);
  if (!Array.isArray(rowValues)) {
    return;
  }
  const templateWidgets = flattenForm([repeater.props.template as FormWidget<never>]);

  rowValues.forEach((rowValue, rowIndex) => {
    const itemPath = `${repeater.path}.${rowIndex}`;
    const rows: RepeaterRow[] = [
      ...outerRows,
      { declaredItemPath: `${declaredPath}.${ITEMS_TOKEN}`, itemPath, index: rowIndex },
    ];
    const itemScope: RepeaterItemScope = { itemPath, index: rowIndex };

    for (const templateWidget of templateWidgets) {
      const item = materializeRowWidget(templateWidget, rows);
      expanded.resolvedSources[item.uid as Uid] = item;
      expanded.repeaterItemScopes[item.uid as Uid] = itemScope;
      expanded.repeaterRows[item.uid as Uid] = rows;

      const nested = asNestedRepeater(templateWidget, item, rows, data, rowValue, rowIndex);
      if (nested) {
        expandRepeaterRows(nested.repeater, nested.declaredPath, rows, data, expanded);
      }
    }
  });
}

/**
 * Returns the nested repeater with concrete uid and path, plus the path its template declares, when a
 * template widget is one, otherwise undefined.
 * A function widget is called once here only to find out whether it produces a repeater.
 */
function asNestedRepeater(
  templateWidget: FormWidget<string>,
  item: FormWidget<string>,
  rows: RepeaterRow[],
  data: Record<string, any>,
  rowValue: unknown,
  rowIndex: number,
): { repeater: RepeaterTemplateWidget; declaredPath: DotPath } | undefined {
  if (isRepeaterWidget(templateWidget) && isRepeaterWidget(item)) {
    return { repeater: item, declaredPath: templateWidget.path };
  }
  if (!isFunctionWidget(templateWidget)) {
    return undefined;
  }
  const resolved = templateWidget({
    $form: data,
    $item: rowValue,
    $index: rowIndex,
    errors: undefined,
    touched: undefined,
    translate: undefined,
  });
  if (resolved.type !== 'repeater') {
    return undefined;
  }
  // The function may return a cached object. Copy it before writing the uid,
  // so the write never reaches the object the function owns.
  const resolvedWithUid = { ...resolved, uid: templateWidget.uid as string };
  return {
    repeater: materializeRowWidget(resolvedWithUid, rows) as RepeaterTemplateWidget,
    declaredPath: (resolved as RepeaterTemplateWidget).path,
  };
}

/**
 * Like {@link makeRepeaterItemConfig}, but places the row by position, see {@link toRowItemPath}.
 * @param rows - The rows that own the widget, outermost first.
 */
function materializeRowWidget(widget: FormWidget<string>, rows: RepeaterRow[]): FormWidget<string> {
  const innermostRow = rows[rows.length - 1];
  return materializeWidget(
    widget,
    rows.map((row) => row.index),
    (path) => toRowItemPath(path, innermostRow),
  );
}

/**
 * Derives a concrete widget config for a specific repeater item by materializing the provided indexes into the
 * widget's `uid` (and `path` for input widgets).
 *
 * Function widgets are wrapped in a new function that delegates to the original, so they stay callable while
 * carrying the materialized `uid` and `path`.
 *
 * Every path segment named `items`, except the first, is a row token, filled in order. With indexes
 * alone a property named `items` cannot be told apart from a token, so such a path throws.
 * `expandSources` places rows by position and has no such limit.
 *
 * @param widget - The base widget config defined on the repeater template.
 * @param repeaterIndexes - Ordered list of indexes for each nesting level
 *   e.g. `[2, 0]` for the first item of a nested repeater inside the third item of an outer repeater.
 * @returns A new widget config with the indexes baked in. The original is not mutated.
 *
 * @example
 * makeRepeaterItemConfig(widget, [1]) // { uid: 'user-name[1]', path: 'users.1.name' }
 *
 * @example
 * // Nested repeater: the first item of an inner repeater inside the third item of the outer one.
 * makeRepeaterItemConfig(widget, [2, 0]) // { uid: 'dev-name[2][0]', path: 'teams.2.devs.0.name' }
 */
export function makeRepeaterItemConfig(
  widget: NonFunctionWidget<string>,
  repeaterIndexes: number[],
): NonFunctionWidget<string>;
export function makeRepeaterItemConfig(
  widget: FormWidget<string>,
  repeaterIndexes: number[],
): FormWidget<string>;
export function makeRepeaterItemConfig(
  widget: FormWidget<string>,
  repeaterIndexes: number[],
): FormWidget<string> {
  return materializeWidget(widget, repeaterIndexes, (path) =>
    toRepeaterItemPath(path, repeaterIndexes),
  );
}

function materializeWidget(
  widget: FormWidget<string>,
  repeaterIndexes: number[],
  materializePath: (path: DotPath) => string,
): FormWidget<string> {
  const uid = toRepeaterItemUid(widget.uid as Uid, repeaterIndexes);
  if (isFunctionWidget(widget)) {
    const materialized: FunctionWidget<string> = (api) => widget(api);
    materialized.uid = uid;
    materialized.type = widget.type;
    if (widget.path !== undefined) {
      materialized.path = materializePath(widget.path);
    }
    return materialized;
  }
  if (isInputWidget(widget)) {
    return {
      ...widget,
      uid,
      path: materializePath(widget.path),
    };
  } else {
    return {
      ...widget,
      uid,
    };
  }
}

export function toRepeaterItemUid(uid: Uid, repeaterIndexes: number[]): Uid {
  if (repeaterIndexes.length === 0) {
    throw new Error('Repeater indexes cannot be an empty array');
  }
  // converts the array `[1,2,3]` into the string `'[1][2][3]'`
  const indexes = repeaterIndexes.reduce((acc, n) => `${acc}[${n}]`, '');
  return `${uid}${indexes}` as Uid;
}

function toRepeaterItemPath(path: DotPath, repeaterIndexes: number[]): string {
  if (repeaterIndexes.length === 0) {
    throw new Error('Repeater indexes cannot be an empty array');
  }

  const segments = path.split('.');
  // The first segment is never a token, because a repeater path cannot be empty.
  const tokenPositions = segments
    .map((segment, position) => (position > 0 && segment === ITEMS_TOKEN ? position : -1))
    .filter((position) => position !== -1);

  if (tokenPositions.length !== repeaterIndexes.length) {
    throw new Error(
      `Path contains ${tokenPositions.length} '${ITEMS_TOKEN}' occurrences, but ${repeaterIndexes.length} indexes were provided.`,
    );
  }

  tokenPositions.forEach((position, level) => {
    segments[position] = String(repeaterIndexes[level]);
  });
  return segments.join('.');
}

/**
 * Places a template path in its row by position: the prefix `row.declaredItemPath` becomes
 * `row.itemPath`. Any other `items` segment is a property name and stays.
 *
 * @example
 * // row: { declaredItemPath: 'invoice.items.items', itemPath: 'invoice.items.3', index: 3 }
 * toRowItemPath('invoice.items.items.name', row); // 'invoice.items.3.name'
 */
function toRowItemPath(path: DotPath, row: RepeaterRow): string {
  const rowPrefix = row.declaredItemPath;
  if (path !== rowPrefix && !path.startsWith(`${rowPrefix}.`)) {
    throw new Error(`Path "${path}" is not inside the repeater row "${rowPrefix}".`);
  }
  return `${row.itemPath}${path.slice(rowPrefix.length)}`;
}

/**
 * Rewrites the references to the widget's own rows in a `when` expression, so it can be evaluated
 * for one concrete row. A reference is a row's full declared item path, with or without `$form.`
 * in front. It becomes the concrete item path, and `?.` separators are kept. Any other `items`
 * segment, such as `$item.items` or a property named `items`, stays.
 *
 * @param expression - The `when` expression as the template writes it.
 * @param rows - The rows that own the widget, outermost first, see `State['repeaterRows']`.
 * @returns The expression with every reference to those rows made concrete.
 *
 * @example
 * // rows: [{ declaredItemPath: 'teams.items', itemPath: 'teams.1', index: 1 },
 * //        { declaredItemPath: 'teams.items.devs.items', itemPath: 'teams.1.devs.0', index: 0 }]
 * transformRepeaterItemWhenExpression('$form.teams.items?.devs?.items?.name?.length > 0', rows);
 * // '$form.teams.1?.devs?.0?.name?.length > 0'
 */
export function transformRepeaterItemWhenExpression(
  expression: string,
  rows: RepeaterRow[],
): string {
  // Innermost first. An inner reference starts with the outer one (`teams.items.devs.items`
  // starts with `teams.items`), so the outer pass must not run first.
  let transformed = expression;
  for (let level = rows.length - 1; level >= 0; level--) {
    transformed = replaceRowReferences(transformed, rows[level]);
  }
  return transformed;
}

function replaceRowReferences(expression: string, row: RepeaterRow): string {
  const declaredSegments = row.declaredItemPath.split('.');
  const concreteSegments = row.itemPath.split('.');
  return expression.replace(
    rowReferencePattern(row.declaredItemPath),
    (_match, before: string, formPrefix: string | undefined, ...groups: unknown[]) => {
      const separators = groups.slice(0, declaredSegments.length - 1) as string[];
      const concretePath = concreteSegments
        .map((segment, position) => (position === 0 ? segment : separators[position - 1] + segment))
        .join('');
      return `${before}${formPrefix ?? ''}${concretePath}`;
    },
  );
}

// The same declared item path is rewritten for every row of every derive.
const rowReferencePatterns = new Map<DotPath, RegExp>();

/**
 * Matches a declared item path as a whole reference. Group 1 is the character before it, which is
 * never a name character, `$` or `.` (so `$item.items` and `$form.x.items` are never read as a
 * reference). Group 2 is an optional `$form.` or `$form?.`. The next groups are the separators,
 * `.` or `?.`. A plain group replaces a lookbehind, which older Safari versions reject.
 */
function rowReferencePattern(declaredItemPath: DotPath): RegExp {
  let pattern = rowReferencePatterns.get(declaredItemPath);
  if (pattern === undefined) {
    const segments = declaredItemPath.split('.').map(escapeRegExp);
    pattern = new RegExp(
      `(^|[^\\w$.])(\\$form\\??\\.)?${segments.join('(\\??\\.)')}(?![\\w$])`,
      'g',
    );
    rowReferencePatterns.set(declaredItemPath, pattern);
  }
  return pattern;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const WHEN_FIELDS = ['include', 'exclude', 'disabled', 'readonly'] as const;

/**
 * Returns a copy of a repeater item widget whose reactive flag conditions
 * (`include.when`, `exclude.when`, `disabled.when`, `readonly.when`) are rewritten
 * for a concrete item via {@link transformRepeaterItemWhenExpression}.
 *
 * State-based flags (`include.in`, `exclude.from`) carry no expression and are left untouched.
 *
 * @param widget - A widget already materialized for a repeater item (see {@link makeRepeaterItemConfig}).
 * @param rows - The rows that own the widget, outermost first, see `State['repeaterRows']`.
 * @returns A new widget config with item-concrete `when` expressions, or the input widget by
 * reference when no flag field has a `when` expression. The original is never mutated.
 *
 * @example
 * // rows = [{ declaredItemPath: 'lineItems.items', itemPath: 'lineItems.1', index: 1 }]
 * // { include: { when: '$form.lineItems.items.active' } }
 * //   -> { include: { when: '$form.lineItems.1.active' } }
 */
export function transformWidgetWhenExpressions(
  widget: NonFunctionWidget<string>,
  rows: RepeaterRow[],
): NonFunctionWidget<string> {
  const hasAnyWhenExpression = WHEN_FIELDS.some((field) =>
    hasWhenExpression((widget as Record<string, unknown>)[field]),
  );
  if (!hasAnyWhenExpression) {
    return widget;
  }

  const transformed = { ...widget } as Record<string, unknown>;

  for (const field of WHEN_FIELDS) {
    const value = transformed[field];
    if (hasWhenExpression(value)) {
      transformed[field] = {
        ...value,
        when: transformRepeaterItemWhenExpression(value.when, rows),
      };
    }
  }

  return transformed as NonFunctionWidget<string>;
}

function hasWhenExpression(value: unknown): value is { when: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'when' in value &&
    typeof (value as { when: unknown }).when === 'string'
  );
}
