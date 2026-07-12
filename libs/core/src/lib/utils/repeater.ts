import {
  type FormWidget,
  type FunctionWidget,
  isFunctionWidget,
  isInputWidget,
  type NonFunctionWidget,
} from '../form-widget';
import { type DotPath, type Uid } from '../shared';

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
 * @returns A new widget config with item-concrete `when` expressions. The original is not mutated.
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
