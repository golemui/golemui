import { compile, type Evaluator, parse } from 'subscript/justin';
import { errorCodes } from '../errors';
import { type $Errors, type ExpressionFunctions, type ReactiveExpression } from '../shared';
import { type State } from '../store/model';
import {
  checkParsedExpression,
  type ExpressionIssue,
  type ExpressionPolicy,
} from './check-expression';
import { Debug } from './debug';
import { isDevMode } from './dev-mode';
import { normalizeArrayIndexes } from './normalize-array-indexes';

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
// One cache per policy, because the same expression can fail with `strict` and run with `warn`.
const compiledExpressionCaches: Record<ExpressionPolicy, Map<string, Evaluator>> = {
  warn: new Map(),
  strict: new Map(),
};

/**
 * Thrown by {@link compileExpression} when the expression check rejects an expression under the
 * form's policy. The derive turns it into an errored `formHealth` with this error's `code`.
 */
export class ExpressionRejectedError extends Error {
  readonly code = errorCodes.expressionRejectedError;
  override name = 'ExpressionRejectedError';
  readonly issue: ExpressionIssue;

  constructor(issue: ExpressionIssue) {
    super(`Rejected expression "${issue.expression}": [${issue.code}] ${issue.message}`);
    this.issue = issue;
  }
}

/**
 * Returns the compiled evaluator for an expression, checking and compiling it on the first call.
 *
 * Row-rewritten `when` expressions are distinct per row, so the cache grows with the row
 * count and is cleared when it reaches the limit. The next call recompiles. A failed parse
 * is never cached, so an invalid expression throws the same error on every call. A rejected
 * expression is not cached either.
 *
 * @param policy - Which issues of the expression check make the expression fail.
 * @throws {@link ExpressionRejectedError} when the check rejects the expression under the policy.
 */
export function compileExpression(
  expression: string,
  policy: ExpressionPolicy = 'warn',
): Evaluator {
  const cache = compiledExpressionCaches[policy];
  const cached = cache.get(expression);
  if (cached !== undefined) {
    return cached;
  }
  const ast = parse(normalizeArrayIndexes(expression));
  const issues = checkParsedExpression(expression, ast);
  const failure = issues.find((issue) => policy === 'strict' || issue.failsIn === 'every-policy');
  if (failure !== undefined) {
    throw new ExpressionRejectedError(failure);
  }
  if (issues.length > 0 && isDevMode()) {
    // The cache keeps the evaluator, so this prints once per expression until the cache is cleared.
    const messages = issues.map((issue) => issue.message).join(' ');
    console.warn(
      `[GolemUI] Expression "${expression}" fails with expressionPolicy 'strict': ${messages}`,
    );
  }
  const evaluate = compile(ast);
  if (cache.size >= COMPILED_EXPRESSION_CACHE_LIMIT) {
    cache.clear();
  }
  cache.set(expression, evaluate);
  return evaluate;
}

export function expressionIsTrue(
  expression: ReactiveExpression,
  $form: State['data'],
  $meta: State['meta'],
  $errors: $Errors,
  $formIsInvalid: boolean,
  extraScope?: ExpressionExtraScope,
  policy: ExpressionPolicy = 'warn',
): boolean {
  const evaluate = compileExpression(expression, policy);
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
