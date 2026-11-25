import { type FormWidget, type InputWidget, type LayoutWidget } from '../form-widget';
import { type DotPath, type FormEventRow, type Uid } from '../shared';
import { type RepeaterRow, type State } from '../store/model';

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
  widget.type === 'repeater';

/** `"abc[0][1]"` -> `[0, 1]`, `"abc"` -> `[]`. */
export const extractRepeaterIndexes = (uid: string): number[] =>
  [...uid.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10));

/**
 * Returns the repeater row a form event carries for a widget, or undefined when the widget is not
 * inside a repeater.
 * @param state - The state the event is dispatched from.
 * @param uid - The uid of the widget that sends the event, with its row indexes.
 * @example
 * getFormEventRow(state, 'devMenu[2][1]'); // { index: 1, indexes: [2, 1], path: 'teams.2.devs.1' }
 * getFormEventRow(state, 'save');          // undefined
 */
export function getFormEventRow(state: State, uid: Uid): FormEventRow | undefined {
  const rows = state.repeaterRows[uid];
  if (rows === undefined || rows.length === 0) {
    return undefined;
  }
  const innermostRow = rows[rows.length - 1];
  return {
    index: innermostRow.index,
    indexes: rows.map((row) => row.index),
    path: innermostRow.itemPath,
  };
}

/** The path segment that stands for "the current row" in template paths, e.g. `users.items.name`. */
export const ITEMS_TOKEN = 'items';

export function toRepeaterItemUid(uid: Uid, repeaterIndexes: number[]): Uid {
  if (repeaterIndexes.length === 0) {
    throw new Error('Repeater indexes cannot be an empty array');
  }
  // converts the array `[1,2,3]` into the string `'[1][2][3]'`
  const indexes = repeaterIndexes.reduce((acc, n) => `${acc}[${n}]`, '');
  return `${uid}${indexes}` as Uid;
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

// Many conditions rewrite the same declared item path, and a row condition that names its row
// inside a quoted text rewrites it for each row.
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
