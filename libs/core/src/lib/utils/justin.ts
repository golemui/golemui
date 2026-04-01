import { compile, parse } from 'subscript/justin';
import { ReactiveExpression } from '../shared';
import { State } from '../store/model';
import { Debug } from './debug';

// TODO: caching or memoization of
export function expressionIsTrue(expression: ReactiveExpression, $form: State['data']): boolean {
  const ast = parse(normalizeArrayIndexes(expression));
  const evaluate = compile(ast);
  const result = evaluate({
    $form,
    $log: Debug.log,
  });
  return result === true;
}

// Converts dot notation numeric indexes to bracket notation for JS compatibility.
// e.g. '$form.teams.1.developers?.0?.firstName' -> '$form.teams[1].developers?.[0]?.firstName'
function normalizeArrayIndexes(expression: string): string {
  return expression.replace(/\?\.(\d+)/g, '?.[$1]').replace(/\.(\d+)/g, '[$1]');
}
