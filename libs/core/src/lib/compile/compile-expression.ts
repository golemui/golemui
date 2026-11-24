import { compile, parse } from 'subscript/justin';
import { type DotPath } from '../shared';
import { type RepeaterRow } from '../store/model';
import {
  checkParsedExpression,
  type ExpressionIssue,
  type ExpressionPolicy,
} from '../utils/check-expression';
import { compileExpression, ExpressionRejectedError, expressionWarning } from '../utils/justin';
import { normalizeArrayIndexes } from '../utils/normalize-array-indexes';
import { ITEMS_TOKEN, transformRepeaterItemWhenExpression } from '../utils/repeater';
import { type CompiledExpression, type ExpressionScope, pathInRow } from './compiled-form';

/**
 * The scope key that holds the row indexes of a widget in a repeater row, the outermost
 * repeater first. A compiled row condition reads its row from it. The key has a space, so no
 * expression of a form definition can read it or hide it with an arrow parameter.
 */
export const ROW_INDEXES_SCOPE_KEY = 'row indexes';

/** One repeater around a widget of a row template. */
export type RowLevel = {
  /** The path of one row as the row template writes it, for example `teams.items.devs.items`. */
  declaredItemPath: DotPath;
  /** The texts between the row indexes of the path of one row: `['teams.', '.devs.', '']`. */
  itemPathParts: string[];
};

/**
 * Parses and checks one expression of a form definition. It never throws. An expression that
 * does not parse, or that the expression check rejects with the policy, gets a `failure`. Its
 * `evaluate` throws that failure, so the form reports the error only when a widget evaluates
 * the expression.
 *
 * @param source - The expression as written, without `{{ }}`.
 * @param policy - Which issues of the expression check make the expression fail.
 * @returns The compiled expression.
 *
 * @example
 * ```ts
 * compileFormExpression('$form.age >= 18', 'warn').evaluate({ $form: { age: 30 } }); // true
 * const rejected = compileFormExpression('$form.tags.pop()', 'warn');
 * // rejected.failure is an ExpressionRejectedError, and rejected.evaluate throws it
 * ```
 */
export function compileFormExpression(
  source: string,
  policy: ExpressionPolicy,
): CompiledExpression {
  const unknownPolicy = failureOfUnknownPolicy(source, policy);
  if (unknownPolicy !== undefined) {
    return unknownPolicy;
  }
  try {
    const ast: unknown = parse(normalizeArrayIndexes(source));
    return compileParsedExpression(source, checkParsedExpression(source, ast), ast, policy);
  } catch (error) {
    return failedExpression(source, error);
  }
}

/**
 * Compiles a flag condition (`include.when`, `exclude.when`, `disabled.when`, `readonly.when`).
 * The condition of a widget in a repeater row template can name its own row with the word
 * `items`: `$form.teams.items.devs.items.name`. The result is one expression for all the rows.
 * It reads the indexes of the row from the scope key {@link ROW_INDEXES_SCOPE_KEY}.
 *
 * The messages of the result quote the condition as written.
 *
 * One kind of condition is compiled later, for each row, when the row evaluates it: a condition
 * that names its row outside code, for example inside a quoted text, and a condition whose row
 * text does not parse. The result then has no `failure` and no `warning`. Its `evaluate` throws
 * the error of the row, whose message quotes the text of that row.
 *
 * @param source - The condition as written.
 * @param levels - The repeaters around the widget, the outermost first. Empty for a widget
 *   outside a row template, whose condition names no row.
 * @param policy - Which issues of the expression check make the expression fail.
 * @returns The compiled condition.
 *
 * @example
 * ```ts
 * const levels = [{ declaredItemPath: 'users.items', itemPathParts: ['users.', ''] }];
 * const condition = compileRowCondition('$form.users.items.active', levels, 'warn');
 * const $form = { users: [{ active: false }, { active: true }] };
 * condition.evaluate({ $form, [ROW_INDEXES_SCOPE_KEY]: [1] }); // true
 * ```
 */
export function compileRowCondition(
  source: string,
  levels: RowLevel[],
  policy: ExpressionPolicy,
): CompiledExpression {
  // A reference to a row holds the word `items`, so most conditions need no search for one.
  if (!source.includes(ITEMS_TOKEN)) {
    return compileFormExpression(source, policy);
  }
  const unknownPolicy = failureOfUnknownPolicy(source, policy);
  if (unknownPolicy !== undefined) {
    return unknownPolicy;
  }

  const textOfRow = (rowIndexes: number[]): string =>
    transformRepeaterItemWhenExpression(source, rowsOf(levels, rowIndexes));
  if (textOfRow(levels.map(() => 0)) === source) {
    // The condition names no row. `$item` and `$index` come from the scope.
    return compileFormExpression(source, policy);
  }

  const parsed = parseWithRowIndexReads(source, textOfRow, levels.length);
  if (parsed === undefined) {
    // A row is named in a place that is not code, for example inside a quoted text, or the text
    // of a row does not parse. Each row then compiles its own text.
    const evaluateTextOfRow = (scope: ExpressionScope): unknown => {
      const rowIndexes = scope[ROW_INDEXES_SCOPE_KEY] as number[];
      const evaluate = compileExpression(textOfRow(rowIndexes), policy);
      return evaluate(scope);
    };
    return { source, evaluate: evaluateTextOfRow };
  }
  // The check ran on the text of one row, before the indexes became reads of the scope. So
  // it counts the nodes that the text of every row has.
  return compileParsedExpression(source, parsed.issues, parsed.ast, policy);
}

// -----------------------------------------------------------------------------
// One expression
// -----------------------------------------------------------------------------

/**
 * A host written in JavaScript can pass any value as the policy. No expression runs with a
 * policy that is not known, so a mistyped policy never gives the weaker one.
 */
function failureOfUnknownPolicy(
  source: string,
  policy: ExpressionPolicy,
): CompiledExpression | undefined {
  if (policy === 'warn' || policy === 'strict') {
    return undefined;
  }
  return failedExpression(
    source,
    new Error(`Unknown expression policy "${String(policy)}". Use "warn" or "strict".`),
  );
}

function compileParsedExpression(
  source: string,
  issues: ExpressionIssue[],
  ast: unknown,
  policy: ExpressionPolicy,
): CompiledExpression {
  const rejection = issues.find((issue) => policy === 'strict' || issue.failsIn === 'every-policy');
  if (rejection !== undefined) {
    return failedExpression(source, new ExpressionRejectedError(rejection));
  }

  let compiled: CompiledExpression;
  try {
    compiled = { source, evaluate: compile(ast as Parameters<typeof compile>[0]) };
  } catch (error) {
    // The compiler rejects a few texts that parse, such as `()`.
    compiled = failedExpression(source, error);
  }
  if (issues.length > 0) {
    compiled.warning = expressionWarning(source, issues);
  }
  return compiled;
}

function failedExpression(source: string, error: unknown): CompiledExpression {
  const failure = error as Error;
  return {
    source,
    failure,
    evaluate: () => {
      throw failure;
    },
  };
}

// -----------------------------------------------------------------------------
// Row references
// -----------------------------------------------------------------------------

/** The rows of the widget in the row with these indexes, the outermost first. */
function rowsOf(levels: RowLevel[], rowIndexes: number[]): RepeaterRow[] {
  return levels.map((level, depth) => ({
    declaredItemPath: level.declaredItemPath,
    itemPath: pathInRow(level.itemPathParts, rowIndexes),
    index: rowIndexes[depth],
  }));
}

/** A node of the first row text that reads a row by its index, with the repeater of that row. */
type RowIndexAccess = { node: unknown[]; level: number };

/**
 * Parses the text of one row, and replaces each row index in it by a read of the scope.
 *
 * To find the indexes, it parses the texts of two rows and compares the two results. The first
 * row has the index 0 in every repeater. The second row has the index 1 in the outermost
 * repeater, 2 in the next one and so on, so an index of the second row names its repeater. A
 * row index in code is the key of an index access, `teams[0]`. Any other difference means that
 * a row is named outside code, for example inside a quoted text.
 *
 * @param depth - The number of repeaters around the widget.
 * @returns The issues of the text of the first row and its syntax tree with the reads, or
 *   `undefined` when the text of a row does not parse or a row is named outside code.
 */
function parseWithRowIndexReads(
  source: string,
  textOfRow: (rowIndexes: number[]) => string,
  depth: number,
): { issues: ExpressionIssue[]; ast: unknown } | undefined {
  const firstRow = Array.from({ length: depth }, () => 0);
  const secondRow = Array.from({ length: depth }, (_unused, level) => level + 1);
  const indexAccesses: RowIndexAccess[] = [];
  let ast: unknown;
  let issues: ExpressionIssue[];
  try {
    ast = parse(normalizeArrayIndexes(textOfRow(firstRow)));
    const astOfSecondRow: unknown = parse(normalizeArrayIndexes(textOfRow(secondRow)));
    if (!collectRowIndexAccesses(ast, astOfSecondRow, undefined, depth, indexAccesses)) {
      return undefined;
    }
    // The issues get the condition as written, so that a message quotes it.
    issues = checkParsedExpression(source, ast);
  } catch {
    return undefined;
  }

  for (const { node, level } of indexAccesses) {
    node[2] = ['[]', ROW_INDEXES_SCOPE_KEY, [undefined, level]];
  }
  return { issues, ast };
}

/**
 * Compares the syntax trees of the texts of two rows, see {@link parseWithRowIndexReads}.
 *
 * @param indexAccesses - Gets each node of the first tree that reads a row by its index.
 * @returns False when the trees differ in something that is not such an index.
 */
function collectRowIndexAccesses(
  first: unknown,
  second: unknown,
  parent: unknown[] | undefined,
  depth: number,
  indexAccesses: RowIndexAccess[],
): boolean {
  if (!Array.isArray(first) || !Array.isArray(second)) {
    return Object.is(first, second);
  }
  if (first.length !== second.length) {
    return false;
  }
  if (isLiteral(first) && isLiteral(second) && !Object.is(first[1], second[1])) {
    const indexOfSecondRow: unknown = second[1];
    const isRowIndex =
      parent !== undefined &&
      isIndexAccess(parent, first) &&
      first[1] === 0 &&
      typeof indexOfSecondRow === 'number' &&
      Number.isInteger(indexOfSecondRow) &&
      indexOfSecondRow >= 1 &&
      indexOfSecondRow <= depth;
    if (isRowIndex) {
      indexAccesses.push({ node: parent, level: indexOfSecondRow - 1 });
    }
    return isRowIndex;
  }
  for (let position = 0; position < first.length; position++) {
    const isSame = collectRowIndexAccesses(
      first[position],
      second[position],
      first,
      depth,
      indexAccesses,
    );
    if (!isSame) {
      return false;
    }
  }
  return true;
}

// A literal is [undefined, value].
function isLiteral(node: unknown[]): boolean {
  return node.length === 2 && node[0] === undefined;
}

// `a[key]` is ['[]', a, key] and `a?.[key]` is ['?.[]', a, key]. An array literal has no key.
function isIndexAccess(node: unknown[], key: unknown): boolean {
  return (node[0] === '[]' || node[0] === '?.[]') && node.length === 3 && node[2] === key;
}
