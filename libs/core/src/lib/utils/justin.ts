import { compile, parse } from 'subscript/justin';
import { type $Errors, type ReactiveExpression } from '../shared';
import { type State } from '../store/model';
import { Debug } from './debug';

// TODO: caching or memoization
export function expressionIsTrue(
  expression: ReactiveExpression,
  $form: State['data'],
  $meta: State['meta'],
  $errors: $Errors,
  $formIsInvalid: boolean,
): boolean {
  const ast = parse(normalizeArrayIndexes(expression));
  const evaluate = compile(ast);
  const result = evaluate({
    $form,
    $meta,
    $errors,
    $formIsInvalid,
    $log: Debug.log,
  });
  return result === true;
}

// TODO: add a fast-path conditional to shortcircuit the regexp. Is it worth it?
// Converts dot notation numeric indexes to bracket notation for JS compatibility.
// e.g. '$form.teams.1.developers?.0?.firstName' -> '$form.teams[1].developers?.[0]?.firstName'
function normalizeArrayIndexes(expression: string): string {
  return expression.replace(/\?\.(\d+)/g, '?.[$1]').replace(/\.(\d+)/g, '[$1]');
}
