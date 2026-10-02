import { type DeclarativeRule, type MatchOperator, type Rule, type SchemaNode } from './types.js';

/** True for a {@link DeclarativeRule}, false for a predicate {@link Rule}. */
export function isDeclarativeRule(rule: Rule | DeclarativeRule): rule is DeclarativeRule {
  return 'match' in rule && !('when' in rule);
}

// Match keys that read a node field instead of a schema keyword.
const NODE_FIELDS: Record<string, (node: SchemaNode) => unknown> = {
  $type: (node) => node.type,
  $path: (node) => node.path,
  $name: (node) => node.name,
  $defName: (node) => node.defName,
  $required: (node) => node.required,
  $inRepeater: (node) => node.repeaterDepth > 0,
};

/**
 * True when every key of `rule.match` holds for the node. See {@link DeclarativeRule}.
 * An invalid `$regex` throws, so the caller reports the rule.
 */
export function matchesDeclarativeRule(rule: DeclarativeRule, node: SchemaNode): boolean {
  return Object.entries(rule.match).every(([key, expected]) => {
    const readField = NODE_FIELDS[key];
    const actual = readField ? readField(node) : node.schema[key];
    if (isMatchOperator(expected)) {
      return matchesOperator(actual, expected);
    }
    if (key === '$path' && typeof expected === 'string' && typeof actual === 'string') {
      return matchesPathGlob(expected, actual);
    }
    return jsonEqual(actual, expected);
  });
}

function isMatchOperator(value: unknown): value is MatchOperator {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 && ['$in', '$exists', '$regex'].includes(keys[0]);
}

function matchesOperator(actual: unknown, operator: MatchOperator): boolean {
  if ('$in' in operator) {
    return operator.$in.some((option) => jsonEqual(option, actual));
  }
  if ('$exists' in operator) {
    return (actual !== undefined) === operator.$exists;
  }
  return typeof actual === 'string' && new RegExp(operator.$regex).test(actual);
}

/**
 * Matches a dot path against a glob: `*` is exactly one segment, `**` is any number of
 * segments, zero included.
 *
 * @example
 * matchesPathGlob('lines.*.name', 'lines.items.name') // true
 * matchesPathGlob('**.street', 'shipping.address.street') // true
 */
export function matchesPathGlob(glob: string, path: string): boolean {
  const matchFrom = (globSegments: string[], pathSegments: string[]): boolean => {
    if (globSegments.length === 0) {
      return pathSegments.length === 0;
    }
    const [head, ...rest] = globSegments;
    if (head === '**') {
      return (
        pathSegments.some((_, skip) => matchFrom(rest, pathSegments.slice(skip))) ||
        matchFrom(rest, [])
      );
    }
    if (pathSegments.length === 0) {
      return false;
    }
    return (head === '*' || head === pathSegments[0]) && matchFrom(rest, pathSegments.slice(1));
  };
  const segmentsOf = (dotPath: string) => (dotPath === '' ? [] : dotPath.split('.'));
  return matchFrom(segmentsOf(glob), segmentsOf(path));
}

function jsonEqual(first: unknown, second: unknown): boolean {
  return first === second || JSON.stringify(first) === JSON.stringify(second);
}
