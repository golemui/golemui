import { type AST, parse } from 'subscript/justin';
import { normalizeArrayIndexes } from './normalize-array-indexes';

/**
 * How the runtime treats the issues {@link checkExpression} finds.
 *
 * - `warn` (the default): an issue that can run code or write data makes the expression fail.
 *   Any other issue prints one warning in dev mode, and the expression runs.
 * - `strict`: every issue makes the expression fail.
 */
export type ExpressionPolicy = 'strict' | 'warn';

/**
 * The kind of an {@link ExpressionIssue}.
 *
 * - `EXPRESSION_REJECTED`: the expression uses syntax that the check does not allow.
 * - `EXPRESSION_PARSE_ERROR`: the expression does not parse.
 * - `EXPRESSION_TOO_LARGE`: the expression is over one of the {@link EXPRESSION_LIMITS}.
 */
export type ExpressionIssueCode =
  | 'EXPRESSION_REJECTED'
  | 'EXPRESSION_PARSE_ERROR'
  | 'EXPRESSION_TOO_LARGE';

/** One problem that {@link checkExpression} found in an expression. */
export type ExpressionIssue = {
  code: ExpressionIssueCode;
  /** The expression as written. */
  expression: string;
  /** Names the rejected node and the reason. */
  message: string;
  /**
   * `every-policy`: the expression fails with both policies, because the node can run code or
   * write data. `strict-policy`: the expression fails with the `strict` policy, and the `warn`
   * policy prints a warning and runs it.
   */
  failsIn: 'every-policy' | 'strict-policy';
};

/**
 * Size limits for one expression. Each limit is twice the largest value measured in the
 * repository mocks, rounded up to one significant digit. `check-expression.spec.ts` measures
 * the mocks again on every run.
 */
export const EXPRESSION_LIMITS = {
  /** Characters of the expression as written. */
  maxLength: 400,
  /** AST nodes. Groups `( )` and property names do not count. */
  maxNodes: 80,
  /** Nesting depth of the AST. The root node has depth 1. */
  maxDepth: 30,
} as const;

/** The size of one expression, counted the same way as {@link EXPRESSION_LIMITS}. */
export type ExpressionSize = {
  length: number;
  nodes: number;
  depth: number;
};

/** The methods an expression can call on any value. Each one reads a value and returns a new one. */
export const ALLOWED_EXPRESSION_METHODS: readonly string[] = [
  'map',
  'filter',
  'reduce',
  'find',
  'some',
  'every',
  'includes',
  'indexOf',
  'join',
  'slice',
  'at',
  'toFixed',
  'toUpperCase',
  'toLowerCase',
  'trim',
];
const ALLOWED_METHOD_SET = new Set(ALLOWED_EXPRESSION_METHODS);

// Methods that change the value they are called on, so a call writes into the data.
const ARRAY_WRITE_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
]);

// Map, Set, WeakMap and WeakSet. Immutable libraries use some of these names for reads (dayjs
// `add`, Immutable.js `set`), but the check sees only the name, not the type of the value.
const COLLECTION_WRITE_METHODS = new Set([
  'set',
  'add',
  'delete',
  'clear',
  'getOrInsert',
  'getOrInsertComputed',
]);

const DATE_WRITE_METHODS = new Set([
  'setFullYear',
  'setMonth',
  'setDate',
  'setHours',
  'setMinutes',
  'setSeconds',
  'setMilliseconds',
  'setTime',
  'setYear',
  'setUTCFullYear',
  'setUTCMonth',
  'setUTCDate',
  'setUTCHours',
  'setUTCMinutes',
  'setUTCSeconds',
  'setUTCMilliseconds',
]);

// Names that reach the Function constructor or an object prototype.
const FORBIDDEN_NAMES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

// An arrow parameter with one of these names hides the scope value inside the function body,
// and then `$fn.name(...)` could call any function.
const SCOPE_ROOTS = new Set([
  '$form',
  '$meta',
  '$errors',
  '$formIsInvalid',
  '$fn',
  '$item',
  '$index',
  '$log',
]);

const READ_BINARY_OPERATORS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '===',
  '!==',
  '==',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '&',
  '|',
  '^',
  '<<',
  '>>',
  '>>>',
  'in',
]);

const READ_UNARY_OPERATORS = new Set(['!', '-', '+', '~', 'typeof', 'void']);

const ASSIGNMENT_OPERATORS = new Set([
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**=',
  '|=',
  '&=',
  '^=',
  '<<=',
  '>>=',
  '>>>=',
  '||=',
  '&&=',
  '??=',
]);

type CheckContext = {
  expression: string;
  issues: ExpressionIssue[];
  nodes: number;
  depth: number;
};

/**
 * Checks a reactive expression against the allowlist, without evaluating it.
 *
 * Only reads are allowed. A call is allowed when the callee is `$fn.<name>`, `$log` or one of
 * the listed methods that return a new value (`map`, `filter`, `reduce`, ...). The check rejects
 * every node kind it does not know.
 *
 * @param expression - The expression as written in the form definition, without `{{ }}`.
 * @returns The issues found. An empty array means the expression is allowed.
 * @example
 * checkExpression('$form.items.map(x => x.price)'); // []
 * checkExpression("(x => x)['constr' + 'uctor']('return 1')()");
 * // [{ code: 'EXPRESSION_REJECTED', failsIn: 'every-policy', message: 'Rejected call: ...', ... }]
 */
export function checkExpression(expression: string): ExpressionIssue[] {
  let ast: AST;
  try {
    ast = parse(normalizeArrayIndexes(expression));
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return [
      {
        code: 'EXPRESSION_PARSE_ERROR',
        expression,
        message: `The expression does not parse: ${reason}`,
        failsIn: 'every-policy',
      },
    ];
  }
  return inspect(expression, ast).issues;
}

/**
 * Checks the AST that `parse` from `subscript/justin` returned, so that the caller can compile
 * the same AST. `ast` is `unknown` because subscript is bundled, not a dependency, so its types
 * must not appear in the published declarations.
 *
 * @param expression - The expression as written in the form definition.
 * @param ast - The AST of `normalizeArrayIndexes(expression)`.
 * @returns The issues found. An empty array means the expression is allowed.
 */
export function checkParsedExpression(expression: string, ast: unknown): ExpressionIssue[] {
  return inspect(expression, ast as AST).issues;
}

/**
 * Measures an expression the same way the size limits count it.
 *
 * @param expression - The expression as written in the form definition.
 * @returns The character count, the AST node count and the AST depth.
 * @throws The parser error when the expression does not parse.
 */
export function measureExpression(expression: string): ExpressionSize {
  const context = inspect(expression, parse(normalizeArrayIndexes(expression)));
  return { length: expression.length, nodes: context.nodes, depth: context.depth };
}

/**
 * Tells whether an i18n param value is an expression. The runtime evaluates these and passes
 * every other value to the translator unchanged.
 *
 * @param value - The param value as written in the form definition.
 * @returns True when the value starts with a scope value such as `$form`.
 * @example
 * isI18nParamExpression('$form.firstName'); // true
 * isI18nParamExpression('$5.00'); // false
 */
export function isI18nParamExpression(value: string): boolean {
  return (
    value.startsWith('$form') ||
    value.startsWith('$meta') ||
    value.startsWith('$errors') ||
    value.startsWith('$item') ||
    value.startsWith('$index') ||
    value.startsWith('$fn') ||
    value === '$formIsInvalid'
  );
}

function inspect(expression: string, ast: AST): CheckContext {
  const context: CheckContext = { expression, issues: [], nodes: 0, depth: 0 };
  visit(ast, 1, context);
  // A large expression is not unsafe, so the limits come last and the walk always completes.
  if (expression.length > EXPRESSION_LIMITS.maxLength) {
    reportTooLarge(
      context,
      `The expression has ${expression.length} characters. The limit is ${EXPRESSION_LIMITS.maxLength}.`,
    );
  }
  if (context.nodes > EXPRESSION_LIMITS.maxNodes) {
    reportTooLarge(
      context,
      `The expression has ${context.nodes} AST nodes. The limit is ${EXPRESSION_LIMITS.maxNodes}.`,
    );
  }
  if (context.depth > EXPRESSION_LIMITS.maxDepth) {
    reportTooLarge(
      context,
      `The expression has an AST depth of ${context.depth}. The limit is ${EXPRESSION_LIMITS.maxDepth}.`,
    );
  }
  return context;
}

function visit(node: AST | null | undefined, depth: number, context: CheckContext): void {
  const current = withoutGroups(node);
  // An empty slot, such as `()`, has nothing to check. The compiler reports it as before.
  if (current === null || current === undefined) {
    return;
  }
  context.nodes += 1;
  context.depth = Math.max(context.depth, depth);

  if (typeof current === 'string') {
    checkName(current, 'an identifier', context);
    return;
  }
  if (!Array.isArray(current)) {
    reject(context, `The node ${JSON.stringify(current)} is not supported in expressions.`);
    return;
  }
  if (isLiteral(current)) {
    return;
  }

  const [operator, ...operands] = current as [string, ...AST[]];
  const childDepth = depth + 1;
  switch (operator) {
    case '.':
    case '?.':
      visitMember(operands, childDepth, context);
      return;
    case '[]':
      if (operands.length === 1) {
        visitList(operands[0], childDepth, context);
      } else {
        visitComputedMember(operands, childDepth, context);
      }
      return;
    case '?.[]':
      visitComputedMember(operands, childDepth, context);
      return;
    case '()':
    case '?.()':
      visitCall(operands, childDepth, context);
      return;
    case '{}':
      visitObject(operands[0], childDepth, context);
      return;
    case '=>':
      visitArrowParameters(operands[0], childDepth, context);
      visit(operands[1], childDepth, context);
      return;
    case '?':
    case ',':
    case ';':
    case '`':
      for (const operand of operands) {
        visit(operand, childDepth, context);
      }
      return;
    case '``':
      reject(context, 'A tagged template (tag`...`) calls the tag function.');
      return;
    case 'new':
    case 'new.target':
      reject(context, `"${operator}" calls a constructor.`);
      return;
    case '++':
    case '--':
      reject(context, `"${operator}" writes into the data. Expressions can only read.`);
      return;
    case 'delete':
      reject(context, '"delete" removes a property from the data. Expressions can only read.');
      return;
  }

  if (ASSIGNMENT_OPERATORS.has(operator)) {
    reject(
      context,
      `The assignment "${operator}" writes into the data. Expressions can only read.`,
    );
    return;
  }
  const isReadOperator =
    (operands.length === 2 && READ_BINARY_OPERATORS.has(operator)) ||
    (operands.length === 1 && READ_UNARY_OPERATORS.has(operator));
  if (!isReadOperator) {
    reject(context, `The syntax "${operator}" is not supported in expressions.`);
    return;
  }
  for (const operand of operands) {
    visit(operand, childDepth, context);
  }
}

function visitMember(operands: AST[], depth: number, context: CheckContext): void {
  const [object, name] = operands;
  if (typeof name !== 'string') {
    reject(context, 'A property access without a property name is not supported.');
    return;
  }
  checkName(name, 'a property name', context);
  visit(object, depth, context);
}

function visitComputedMember(operands: AST[], depth: number, context: CheckContext): void {
  const [object, key] = operands;
  checkLiteralKey(key, 'a computed key', context);
  visit(object, depth, context);
  visit(key, depth, context);
}

function visitCall(operands: AST[], depth: number, context: CheckContext): void {
  const [callee, args] = operands;
  checkCallee(callee, context);
  visit(callee, depth, context);
  visitList(args, depth, context);
}

// The items of an array literal or of a call argument list: one item, or a `,` node of items.
function visitList(list: AST | null | undefined, depth: number, context: CheckContext): void {
  for (const item of listItems(list)) {
    if (Array.isArray(item) && item[0] === '...') {
      visit(item[1], depth, context);
    } else {
      visit(item, depth, context);
    }
  }
}

function visitObject(body: AST | null | undefined, depth: number, context: CheckContext): void {
  for (const entry of listItems(body)) {
    if (typeof entry === 'string') {
      // Shorthand `{ a }` reads the identifier `a`, so the identifier check covers the key.
      visit(entry, depth, context);
    } else if (Array.isArray(entry) && entry[0] === ':') {
      visitObjectKey(entry[1], depth, context);
      visit(entry[2], depth, context);
    } else if (Array.isArray(entry) && entry[0] === '...') {
      visit(entry[1], depth, context);
    } else {
      reject(context, 'This object literal entry is not supported in expressions.');
    }
  }
}

function visitObjectKey(key: AST, depth: number, context: CheckContext): void {
  if (typeof key === 'string') {
    checkName(key, 'an object key', context);
  } else if (Array.isArray(key) && isLiteral(key)) {
    checkLiteralKey(key, 'an object key', context);
  } else if (Array.isArray(key) && key[0] === '[]' && key.length === 2) {
    // Computed key `{ [k]: v }`
    checkLiteralKey(key[1], 'an object key', context);
    visit(key[1], depth, context);
  } else {
    reject(context, 'This object key is not supported in expressions.');
  }
}

// `x => ...` has an identifier, `(a, b = 1, ...rest) => ...` has a group of parameters.
function visitArrowParameters(parameters: AST, depth: number, context: CheckContext): void {
  if (Array.isArray(parameters) && parameters[0] === '()' && parameters.length === 2) {
    for (const parameter of listItems(parameters[1])) {
      visitBinding(parameter, depth, context);
    }
    return;
  }
  visitBinding(parameters, depth, context);
}

// A name an arrow function binds: an identifier, a default, a rest element or a destructuring pattern.
function visitBinding(binding: AST | null | undefined, depth: number, context: CheckContext): void {
  if (binding === null || binding === undefined) {
    return;
  }
  if (typeof binding === 'string') {
    context.nodes += 1;
    context.depth = Math.max(context.depth, depth);
    checkName(binding, 'an arrow parameter', context);
    if (SCOPE_ROOTS.has(binding)) {
      reject(
        context,
        `The arrow parameter "${binding}" has the name of a scope value and would hide it.`,
      );
    }
    return;
  }
  if (!Array.isArray(binding)) {
    reject(context, 'This arrow parameter is not supported in expressions.');
    return;
  }
  const [operator, first, second] = binding as [string, AST, AST];
  const childDepth = depth + 1;
  if (operator === '...') {
    visitBinding(first, childDepth, context);
  } else if (operator === '=') {
    // `(x = 1) => ...` is a default value, not an assignment.
    visitBinding(first, childDepth, context);
    visit(second, childDepth, context);
  } else if (operator === '[]' && binding.length === 2) {
    for (const element of listItems(first)) {
      visitBinding(element, childDepth, context);
    }
  } else if (operator === '{}') {
    for (const entry of listItems(first)) {
      if (Array.isArray(entry) && entry[0] === ':') {
        visitObjectKey(entry[1], childDepth, context);
        visitBinding(entry[2], childDepth, context);
      } else {
        visitBinding(entry, childDepth, context);
      }
    }
  } else {
    reject(context, `The arrow parameter syntax "${operator}" is not supported in expressions.`);
  }
}

function checkCallee(callee: AST, context: CheckContext): void {
  const target = withoutGroups(callee);
  if (typeof target === 'string') {
    if (target !== '$log') {
      rejectCall(context, `the name "${target}"`);
    }
    return;
  }
  if (!Array.isArray(target) || isLiteral(target)) {
    rejectCall(context, 'a literal value');
    return;
  }

  const operator = target[0] as string;
  if (operator === '.' || operator === '?.') {
    const name = target[2];
    if (withoutGroups(target[1]) === '$fn' || ALLOWED_METHOD_SET.has(name as string)) {
      return;
    }
    const writeMessage = describeWriteMethod(name as string);
    if (writeMessage !== undefined) {
      reject(context, writeMessage);
      return;
    }
    reject(
      context,
      `The method "${name}" is not in the list of allowed methods: ${ALLOWED_EXPRESSION_METHODS.join(', ')}.`,
      'strict-policy',
    );
    return;
  }
  rejectCall(context, describeCallee(operator));
}

function describeWriteMethod(name: string): string | undefined {
  if (ARRAY_WRITE_METHODS.has(name)) {
    return `The method "${name}" changes the array in place, so it writes into the data. Expressions can only read.`;
  }
  if (DATE_WRITE_METHODS.has(name)) {
    return `The method "${name}" changes the Date in place, so it writes into the data. Expressions can only read.`;
  }
  if (COLLECTION_WRITE_METHODS.has(name)) {
    return `The method "${name}" changes a Map or a Set in place, so it writes into the data. Expressions can only read. If the value is immutable, call the method in a $fn function.`;
  }
  return undefined;
}

function describeCallee(operator: string): string {
  switch (operator) {
    case '[]':
    case '?.[]':
      return 'a computed member access (a[...])';
    case '()':
    case '?.()':
      return 'the result of another call';
    case '?':
      return 'a conditional (a ? b : c)';
    case '&&':
    case '||':
    case '??':
      return `a logical expression (${operator})`;
    case ',':
      return 'a sequence (a, b)';
    case '=>':
      return 'an arrow function';
    default:
      return `"${operator}"`;
  }
}

function rejectCall(context: CheckContext, calleeDescription: string): void {
  reject(
    context,
    `Rejected call: the callee is ${calleeDescription}. Only $fn.<name>(...), $log(...) and the allowed methods can be called.`,
  );
}

function checkName(name: string, position: string, context: CheckContext): void {
  if (FORBIDDEN_NAMES.has(name)) {
    reject(context, `The name "${name}" is not allowed as ${position}.`);
  }
}

function checkLiteralKey(key: AST, position: string, context: CheckContext): void {
  const literal = withoutGroups(key);
  if (Array.isArray(literal) && isLiteral(literal) && typeof literal[1] === 'string') {
    checkName(literal[1], position, context);
  }
}

function reject(
  context: CheckContext,
  message: string,
  failsIn: ExpressionIssue['failsIn'] = 'every-policy',
): void {
  context.issues.push({
    code: 'EXPRESSION_REJECTED',
    expression: context.expression,
    message,
    failsIn,
  });
}

function reportTooLarge(context: CheckContext, message: string): void {
  context.issues.push({
    code: 'EXPRESSION_TOO_LARGE',
    expression: context.expression,
    message,
    failsIn: 'strict-policy',
  });
}

// `(a)` parses to ['()', a]. A call has a third element, its argument list.
function withoutGroups(node: AST | null | undefined): AST | null | undefined {
  let current = node;
  while (Array.isArray(current) && current[0] === '()' && current.length === 2) {
    current = current[1];
  }
  return current;
}

// A literal is [undefined, value]. The literal `undefined` is [].
function isLiteral(node: unknown[]): boolean {
  return node.length === 0 || (node.length === 2 && node[0] === undefined);
}

function listItems(list: AST | null | undefined): (AST | null)[] {
  if (list === null || list === undefined) {
    return [];
  }
  if (Array.isArray(list) && list[0] === ',') {
    return list.slice(1) as (AST | null)[];
  }
  return [list];
}
