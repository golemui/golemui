import { isInputWidget, NonFunctionWidget } from '../form-widget';
import { DotPath, Uid } from '../shared';

/**
 * Derives a concrete widget config for a specific repeater item by stamping
 * the provided indexes into the widget's `uid` (and `path` for input widgets).
 *
 * @param widget - The base widget config defined on the repeater template.
 * @param repeaterIndexes - Ordered list of indexes for each nesting level,
 *   e.g. `[2, 0]` for the first item of a nested repeater inside the third
 *   item of an outer repeater.
 * @returns A new widget config with the indexes baked in; the original is not mutated.
 *
 * @example
 * makeRepeaterItemConfig(widget, [1]) // { uid: 'user-name[1]', path: 'users.1.name' }
 */
export function makeRepeaterItemConfig(
  widget: NonFunctionWidget<string>,
  repeaterIndexes: number[],
): NonFunctionWidget<string> {
  const uid = toRepeaterItemUid(widget.uid, repeaterIndexes);
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
 * Replaces `.items.` tokens in a `when` expression with the concrete repeater
 * indexes so the expression can be evaluated against the actual store path.
 *
 * @example
 * // repeaterIndexes = [2]
 * // "form.items.active" -> "form.2.active"
 */
export function transformRepeaterItemWhenExpression(
  expression: string,
  repeaterIndexes: number[],
): string {
  const ITEMS_TOKEN_WRAPPED = '.items.';
  const parts = expression.split(ITEMS_TOKEN_WRAPPED);
  if (parts.length === 1) {
    return expression;
  }

  return parts.reduce((acc, part, i) => {
    if (i === 0) {
      return part;
    }
    const index = repeaterIndexes[i - 1];
    if (index === undefined) {
      return `${acc}${ITEMS_TOKEN_WRAPPED}${part}`;
    }
    return `${acc}.${index}.${part}`;
  });
}
