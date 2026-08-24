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
import { type RepeaterItemScope, type State } from '../store/model';
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

/**
 * The two maps `expandSources` builds from the form and the data.
 */
export type ExpandedSources = {
  resolvedSources: Record<Uid, FormWidget<string>>;
  repeaterItemScopes: Record<Uid, RepeaterItemScope>;
};

/**
 * Walks the flat form and the current data and returns every widget that exists for that data.
 *
 * `resolvedSources` holds the `flatForm` widgets by reference plus, for every repeater row, one entry
 * per template widget (the row layout node included) with the row indexes written into `uid` and `path`.
 * Nested repeater containers are entries too and are recursed with their concrete path. Function widgets
 * stay callable (see {@link makeRepeaterItemConfig}), `when` expressions are not rewritten here.
 *
 * `repeaterItemScopes` maps every row widget uid to the innermost item that owns it.
 *
 * @param flatForm - The flattened form definition keyed by uid.
 * @param data - The current form data the repeater arrays are read from.
 * @returns Both maps, rebuilt from scratch.
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
  const expanded: ExpandedSources = { resolvedSources: {}, repeaterItemScopes: {} };
  for (const widget of Object.values(flatForm)) {
    expanded.resolvedSources[widget.uid as Uid] = widget;
    if (isRepeaterWidget(widget)) {
      expandRepeaterRows(widget, [], data, expanded);
    }
  }
  return expanded;
}

function expandRepeaterRows(
  repeater: RepeaterTemplateWidget,
  outerIndexes: number[],
  data: Record<string, any>,
  expanded: ExpandedSources,
): void {
  const rows = get(data, repeater.path);
  if (!Array.isArray(rows)) {
    return;
  }
  const templateWidgets = flattenForm([repeater.props.template as FormWidget<never>]);

  rows.forEach((row, rowIndex) => {
    const indexes = [...outerIndexes, rowIndex];
    const itemScope: RepeaterItemScope = {
      itemPath: `${repeater.path}.${rowIndex}`,
      index: rowIndex,
    };

    for (const templateWidget of templateWidgets) {
      const item = makeRepeaterItemConfig(templateWidget, indexes);
      expanded.resolvedSources[item.uid as Uid] = item;
      expanded.repeaterItemScopes[item.uid as Uid] = itemScope;

      const nestedRepeater = asNestedRepeater(templateWidget, item, indexes, data, row, rowIndex);
      if (nestedRepeater) {
        expandRepeaterRows(nestedRepeater, indexes, data, expanded);
      }
    }
  });
}

/**
 * Returns the nested repeater with concrete uid and path when a template widget is one, otherwise undefined.
 * A function widget is called once here only to find out whether it produces a repeater.
 */
function asNestedRepeater(
  templateWidget: FormWidget<string>,
  item: FormWidget<string>,
  indexes: number[],
  data: Record<string, any>,
  row: unknown,
  rowIndex: number,
): RepeaterTemplateWidget | undefined {
  if (isRepeaterWidget(item)) {
    return item;
  }
  if (!isFunctionWidget(templateWidget)) {
    return undefined;
  }
  const resolved = templateWidget({
    $form: data,
    $item: row,
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
  return makeRepeaterItemConfig(resolvedWithUid, indexes) as RepeaterTemplateWidget;
}

/**
 * Derives a concrete widget config for a specific repeater item by materializing the provided indexes into the
 * widget's `uid` (and `path` for input widgets).
 *
 * Function widgets are wrapped in a new function that delegates to the original, so they stay callable while
 * carrying the materialized `uid` and `path`.
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
  const uid = toRepeaterItemUid(widget.uid as Uid, repeaterIndexes);
  if (isFunctionWidget(widget)) {
    const materialized: FunctionWidget<string> = (api) => widget(api);
    materialized.uid = uid;
    materialized.type = widget.type;
    if (widget.path !== undefined) {
      materialized.path = toRepeaterItemPath(widget.path, repeaterIndexes);
    }
    return materialized;
  }
  if (isInputWidget(widget)) {
    return {
      ...widget,
      uid,
      path: toRepeaterItemPath(widget.path, repeaterIndexes),
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

  const ITEMS_TOKEN = 'items';
  const parts = path.split(`.${ITEMS_TOKEN}`);
  const itemsCount = parts.length - 1;

  if (itemsCount !== repeaterIndexes.length) {
    throw new Error(
      `Path contains ${itemsCount} '${ITEMS_TOKEN}' occurrences, but ${repeaterIndexes.length} indexes were provided.`,
    );
  }

  // Reconstruct the path by joining segments with the corresponding index
  return parts.reduce((acc, part, i) => {
    if (i === 0) {
      return part;
    }
    return `${acc}.${repeaterIndexes[i - 1]}${part}`;
  });
}

/**
 * Replaces `.items.` and `.items?.` tokens in a `when` expression with the
 * concrete repeater indexes so the expression can be evaluated.
 * Multiple `items` tokens are replaced in order, supporting nested repeaters.
 *
 * @example
 * // repeaterIndexes = [2]
 * // "$form.reptr.items.active" -> "$form.reptr.2.active"
 * // "$form.reptr.items?.active" -> "$form.reptr.2?.active"
 *
 * @example
 * // repeaterIndexes = [1, 0]
 * // "$form.reptr.teams.items?.devs?.items?.firstName?.length > 0" -> "$form.reptr.teams.1?.devs?.0?.firstName?.length > 0"
 */
export function transformRepeaterItemWhenExpression(
  expression: string,
  repeaterIndexes: number[],
): string {
  let i = 0;
  return expression.replace(/\.items(\??)\./g, (match, optionalChaining: string) => {
    const index = repeaterIndexes[i++];
    if (index === undefined) {
      return match;
    }
    return `.${index}${optionalChaining}.`;
  });
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
 * @param repeaterIndexes - Ordered list of indexes for each nesting level.
 * @returns A new widget config with item-concrete `when` expressions, or the input widget by
 * reference when no flag field has a `when` expression. The original is never mutated.
 *
 * @example
 * // repeaterIndexes = [1]
 * // { include: { when: '$form.lineItems.items.active' } }
 * //   -> { include: { when: '$form.lineItems.1.active' } }
 */
export function transformWidgetWhenExpressions(
  widget: NonFunctionWidget<string>,
  repeaterIndexes: number[],
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
        when: transformRepeaterItemWhenExpression(value.when, repeaterIndexes),
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
