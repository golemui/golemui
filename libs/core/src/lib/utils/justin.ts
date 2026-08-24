import { compile, type Evaluator, parse } from 'subscript/justin';
import { type $Errors, type ExpressionFunctions, type ReactiveExpression } from '../shared';
import { type State } from '../store/model';
import { Debug } from './debug';

/**
 * Extra scope variables available to expressions evaluated inside a repeater `props.template`: the current item object and its position
 */
export type RepeaterItemExpressionScope = {
  $item?: unknown;
  $index?: number;
};

/**
 * Extra scope available to expressions: repeater item variables and host-provided $fn functions.
 */
export type ExpressionExtraScope = RepeaterItemExpressionScope & {
  $fn?: ExpressionFunctions;
};

export const COMPILED_EXPRESSION_CACHE_LIMIT = 2000;
const compiledExpressionCache = new Map<string, Evaluator>();

/**
 * Returns the compiled evaluator for an expression, compiling on the first call.
 *
 * Row-rewritten `when` expressions are distinct per row, so the cache grows with the row
 * count and is cleared when it reaches the limit. The next call recompiles. A failed parse
 * is never cached, so an invalid expression throws the same error on every call.
 */
export function compileExpression(expression: string): Evaluator {
  const cached = compiledExpressionCache.get(expression);
  if (cached !== undefined) {
    return cached;
  }
  const evaluate = compile(parse(normalizeArrayIndexes(expression)));
  if (compiledExpressionCache.size >= COMPILED_EXPRESSION_CACHE_LIMIT) {
    compiledExpressionCache.clear();
  }
  compiledExpressionCache.set(expression, evaluate);
  return evaluate;
}

export function expressionIsTrue(
  expression: ReactiveExpression,
  $form: State['data'],
  $meta: State['meta'],
  $errors: $Errors,
  $formIsInvalid: boolean,
  extraScope?: ExpressionExtraScope,
): boolean {
  const evaluate = compileExpression(expression);
  const result = evaluate({
    $form,
    $meta,
    $errors,
    $formIsInvalid,
    $log: Debug.log,
    $fn: {},
    ...extraScope,
  });
  return result === true;
}

// TODO: add a fast-path conditional to shortcircuit the regexp. Is it worth it?
// Converts dot notation numeric indexes to bracket notation for JS compatibility.
// e.g. '$form.teams.1.developers?.0?.firstName' -> '$form.teams[1].developers?.[0]?.firstName'
// Decimal number literals are left untouched: '0.15' stays '0.15'.
export function normalizeArrayIndexes(expression: string): string {
  return expression.replace(
    /(\?\.|\.)(\d+)/g,
    (match, dot: string, digits: string, offset: number) => {
      if (dot === '.' && isDecimalPoint(expression, offset)) {
        return match;
      }
      return dot === '?.' ? `?.[${digits}]` : `[${digits}]`;
    },
  );
}

// Decides whether the dot at `dotIndex` is the decimal point of a number
// literal ('0.15', '* .5') rather than a path index separator ('teams.1',
// 'teams.1.0', 'item2.0').
function isDecimalPoint(expression: string, dotIndex: number): boolean {
  let i = dotIndex - 1;
  let hasDigitsBefore = false;
  while (i >= 0 && expression[i] >= '0' && expression[i] <= '9') {
    hasDigitsBefore = true;
    i--;
  }
  if (i < 0) {
    // The expression starts with a number ('0.15') or a bare decimal ('.5').
    return true;
  }
  const charBeforeNumber = expression[i];
  if (hasDigitsBefore) {
    // Digits before the dot are a path segment when they follow another dot
    // ('teams.1.0') or an identifier tail ('item2.0'); otherwise they are the
    // integer part of a number literal ('35 * 0.02').
    return !/[\w$.\]]/.test(charBeforeNumber);
  }
  // No digits before the dot: member access on an identifier, call result or
  // index result keeps index behavior ('teams.1'); anything else is a
  // leading-dot decimal ('* .5').
  return !/[\w$)\]]/.test(charBeforeNumber);
}
