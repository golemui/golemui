import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
// eslint-disable-next-line import/no-namespace -- the TypeScript compiler API is a CommonJS namespace
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  checkExpression,
  EXPRESSION_LIMITS,
  type ExpressionIssue,
  isI18nParamExpression,
  measureExpression,
} from './check-expression';

const MOCKS_DIRECTORY = join(__dirname, '../../../../../apps/apps-shared/src/lib/mocks');

// The same pattern `calculate-widget-props.ts` uses to find `{{ }}` slots.
const STRING_INTERPOLATION_REGEX = /\{\{([^}]+)\}\}/g;

type MockExpression = { source: string; expression: string };

const rejectedEveryPolicy = (issues: ExpressionIssue[]): boolean =>
  issues.some((issue) => issue.code === 'EXPRESSION_REJECTED' && issue.failsIn === 'every-policy');

describe('checkExpression', () => {
  describe('code execution paths', () => {
    it.each([
      "(x => x).constructor('return 42')()",
      "''.toString.constructor('return 44')()",
      "(x => x)['constr' + 'uctor']('return 7')()",
      "((x => x)['constr' + 'uctor'])('return 7')()",
      "(x => x)?.['constr' + 'uctor']('return 7')()",
      "$log['constr' + 'uctor']('return 1')()",
      "[].map['constr' + 'uctor']('return 3')()",
      "(x => x)[['constructor']]('return 21')()",
      "(x => x).bind(0)['constr' + 'uctor']('return 25')()",
      "(0, (x => x)['constr' + 'uctor'])('return 8')()",
      "(true ? (x => x)['constr' + 'uctor'] : 0)('return 9')()",
      "((x => x)['constr' + 'uctor'] || 0)('return 10')()",
      "((x => x)['constr' + 'uctor'] ?? 0)('return 10')()",
      "[(x => x)['constr' + 'uctor']].at(0)('return 11')()",
      "(f => f('return 12')())((x => x)['constr' + 'uctor'])",
      "new Function('return 1')",
      'new.target',
      '(x => x).constructor`return 1`',
      '($fn => $fn.anything())(x => x)',
      'unknownName(1)',
    ])('rejects %s in every policy', (expression) => {
      const issues = checkExpression(expression);

      expect(rejectedEveryPolicy(issues)).toBe(true);
      expect(issues.every((issue) => issue.expression === expression)).toBe(true);
    });

    it('names the rejected callee in the message', () => {
      expect(checkExpression("$form.list['map'](x => x)")[0].message).toBe(
        'Rejected call: the callee is a computed member access (a[...]). Only $fn.<name>(...), $log(...) and the allowed methods can be called.',
      );
    });
  });

  describe('writes into the data', () => {
    it.each([
      '$form.a = 99',
      '$form.tags.push(9)',
      "$formX || ($form.injected = 'yes')",
      "$form.tags['pu' + 'sh'](10)",
      'delete $form.a',
      '$form.n++',
      '++$form.n',
      '$form.n--',
      '--$form.n',
      '$form.n += 1',
      '$form.n **= 2',
      '$form.a ??= 1',
      '$form.a ||= 1',
      '$form.a &&= 1',
      '$meta.touched = true',
      '$form.items.map(item => item.price = 0)',
      '$form.tags.sort()',
      '$form.tags.splice(0, 1)',
      '$item.tags.pop()',
      "$meta.cache.set('role', 'admin')",
      "$meta.tags.add('x')",
      "$meta.cache.delete('role')",
      '$meta.cache.clear()',
      "$meta.cache.getOrInsert('role', 'admin')",
      "$meta.cache?.getOrInsertComputed('role', key => key)",
      '$meta.start.setFullYear(2000)',
      '$meta.start.setUTCHours(0)',
      '$form.date?.setTime(0)',
    ])('rejects %s in every policy', (expression) => {
      expect(rejectedEveryPolicy(checkExpression(expression))).toBe(true);
    });

    it('names the value type and the $fn fix for a Map or Set write method', () => {
      expect(checkExpression('$meta.start.add(1)')[0].message).toBe(
        'The method "add" changes a Map or a Set in place, so it writes into the data. Expressions can only read. If the value is immutable, call the method in a $fn function.',
      );
    });

    it('accepts a host function with the name of a write method', () => {
      expect(checkExpression('$fn.add($form.a, 1) + $fn.set(2)')).toEqual([]);
    });
  });

  describe('names that reach a prototype', () => {
    it.each([
      ['$form.constructor', 'a property name'],
      ['$form?.prototype', 'a property name'],
      ["$form['__proto__']", 'a computed key'],
      ['$form[`constructor`]', 'a computed key'],
      ['({ __defineGetter__: 1 })', 'an object key'],
      ["({ '__lookupSetter__': 1 })", 'an object key'],
      ["({ ['__defineSetter__']: 1 })", 'an object key'],
      ['__lookupGetter__', 'an identifier'],
      ['({ __proto__ })', 'an identifier'],
      ['prototype => 1', 'an arrow parameter'],
      ['({ constructor }) => 1', 'an arrow parameter'],
    ])('rejects %s as %s', (expression, position) => {
      const issues = checkExpression(expression);

      expect(rejectedEveryPolicy(issues)).toBe(true);
      expect(issues.some((issue) => issue.message.endsWith(`allowed as ${position}.`))).toBe(true);
    });

    it.each(['$form.__typename === "x"', '$form.__meta?.id', '$form.constructorName'])(
      'accepts %s, because only the exact names are rejected',
      (expression) => {
        expect(checkExpression(expression)).toEqual([]);
      },
    );
  });

  describe('arrow parameters', () => {
    it.each(['$form', '$meta', '$errors', '$formIsInvalid', '$fn', '$item', '$index', '$log'])(
      'rejects a parameter named %s in every policy',
      (name) => {
        const issues = checkExpression(`$form.items.map(${name} => 1)`);

        expect(rejectedEveryPolicy(issues)).toBe(true);
        expect(issues[0].message).toContain(`"${name}"`);
      },
    );
  });

  describe('issues that fail only with the strict policy', () => {
    it('rejects a method outside the allowed list', () => {
      const issues = checkExpression("$form.name.startsWith('A')");

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ code: 'EXPRESSION_REJECTED', failsIn: 'strict-policy' });
      expect(issues[0].message).toContain('"startsWith"');
    });

    it('reports an expression over the length limit', () => {
      const expression = `$form.a === '${'x'.repeat(EXPRESSION_LIMITS.maxLength)}'`;

      expect(checkExpression(expression)).toEqual([
        {
          code: 'EXPRESSION_TOO_LARGE',
          expression,
          message: `The expression has ${expression.length} characters. The limit is ${EXPRESSION_LIMITS.maxLength}.`,
          failsIn: 'strict-policy',
        },
      ]);
    });

    it('reports an expression over the node limit', () => {
      const expression = `[${'1,'.repeat(EXPRESSION_LIMITS.maxNodes)}1]`;
      const issues = checkExpression(expression);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ code: 'EXPRESSION_TOO_LARGE', failsIn: 'strict-policy' });
      expect(issues[0].message).toContain('AST nodes');
    });

    it('reports an expression over the depth limit', () => {
      const expression = `${'!'.repeat(EXPRESSION_LIMITS.maxDepth)}$form.a`;
      const issues = checkExpression(expression);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ code: 'EXPRESSION_TOO_LARGE', failsIn: 'strict-policy' });
      expect(issues[0].message).toContain('AST depth');
    });

    it('still finds code execution paths in an expression over the limits', () => {
      const expression = `${'!'.repeat(EXPRESSION_LIMITS.maxDepth)}(x => x).constructor('')`;

      expect(rejectedEveryPolicy(checkExpression(expression))).toBe(true);
    });
  });

  it('reports a parse error', () => {
    expect(checkExpression('$form.a +')).toEqual([
      {
        code: 'EXPRESSION_PARSE_ERROR',
        expression: '$form.a +',
        message: 'The expression does not parse: Unexpected token at 1:9',
        failsIn: 'every-policy',
      },
    ]);
  });

  describe('accepted expressions', () => {
    it.each([
      '$fn.double(2)',
      '$fn?.double(2)',
      '$fn.double?.(2)',
      '$fn.total(...$form.values)',
      '$log($form.a)',
      '$form.items.map(x => x.price)',
      '$form.items.reduce((sum, { price = 0 }) => sum + price, 0)',
      '$form.items.filter(i => i.on).find(i => i.id === 2)?.name',
      '$form.tags.some(t => t === 1) && $form.tags.every(t => t > 0)',
      "$form.tags.includes('a') || $form.tags.indexOf('b') !== -1",
      "$form.tags.join(', ')",
      '$form.tags.slice(1).at(-1)',
      "$form.name.trim().toLowerCase() === 'ada'",
      '$form.name?.toUpperCase()',
      '$form.total.toFixed(2)',
      '$form.user?.name',
      "$form.a ? 'yes' : 'no'",
      '$form.a ?? 0',
      '$form.a >= 18 && $form.a < 65',
      '$form.a * 1.15 - 2 / 3 % 4 + 2 ** 3',
      '$form.teams.1.developers?.0?.firstName',
      '$item.price * $index',
      "$errors['user.name']?.length > 0",
      '!$formIsInvalid',
      "typeof $form.a === 'string'",
      "'key' in $form",
      '`Total: ${$form.total}`',
      '[...$form.a, ...$form.b].length',
      '({ a: 1, [$form.key]: 2, ...$meta }).a',
      '$form.a === 1;',
    ])('accepts %s', (expression) => {
      expect(checkExpression(expression)).toEqual([]);
    });

    it.each([
      '$route.id',
      '$route.id === 1',
      '$route',
      '$form.items.map($route => $route.id)',
      '$form.items.map(({ $route }) => $route)',
    ])('accepts %s, because the check does not know the name $route', (expression) => {
      expect(checkExpression(expression)).toEqual([]);
    });

    it('rejects a call of the name $route with every policy', () => {
      // Only $log is called by name, so an unknown root is allowed as a value but not as a callee.
      expect(rejectedEveryPolicy(checkExpression('$route(1)'))).toBe(true);
      expect(checkExpression('$route.id')).toEqual([]);
    });
  });
});

describe('repository mock expressions', () => {
  const jsonExpressions = readMockFiles('.form.json').flatMap(({ file, text }) =>
    collectJsonExpressions(JSON.parse(text), file),
  );
  const dxFiles = readMockFiles('.dx.ts').map(({ file, text }) => collectDxExpressions(text, file));
  const dxExpressions = dxFiles.flatMap((result) => result.expressions);
  const mockExpressions = [...jsonExpressions, ...dxExpressions];

  it('accepts every expression in the JSON mocks', () => {
    expect(jsonExpressions.length).toBeGreaterThan(0);
    // The invoice total is the most complex reduce in the mocks.
    expect(jsonExpressions.some(({ expression }) => expression.includes('.reduce('))).toBe(true);
    expect(issuesOf(jsonExpressions)).toEqual([]);
  });

  it('accepts every when, states and {{ }} expression in the DX mocks', () => {
    expect(dxExpressions.length).toBeGreaterThan(0);
    expect(dxFiles.flatMap((result) => result.unresolvedTemplates)).toEqual([]);
    expect(issuesOf(dxExpressions)).toEqual([]);
  });

  it('keeps each size limit at twice the largest mock expression or more', () => {
    const sizes = mockExpressions.map(({ expression }) => measureExpression(expression));
    const maxLength = Math.max(...sizes.map((size) => size.length));
    const maxNodes = Math.max(...sizes.map((size) => size.nodes));
    const maxDepth = Math.max(...sizes.map((size) => size.depth));

    console.info(
      `[check-expression] largest of ${mockExpressions.length} mock expressions: ${maxLength} characters, ${maxNodes} nodes, depth ${maxDepth}`,
    );
    expect(EXPRESSION_LIMITS.maxLength).toBeGreaterThanOrEqual(roundUp(2 * maxLength));
    expect(EXPRESSION_LIMITS.maxNodes).toBeGreaterThanOrEqual(roundUp(2 * maxNodes));
    expect(EXPRESSION_LIMITS.maxDepth).toBeGreaterThanOrEqual(roundUp(2 * maxDepth));
  });
});

function readMockFiles(extension: string): { file: string; text: string }[] {
  return readdirSync(MOCKS_DIRECTORY)
    .filter((file) => file.endsWith(extension))
    .map((file) => ({ file, text: readFileSync(join(MOCKS_DIRECTORY, file), 'utf8') }));
}

function issuesOf(expressions: MockExpression[]): (MockExpression & { issues: string[] })[] {
  return expressions
    .map((item) => ({ ...item, issues: checkExpression(item.expression).map((i) => i.message) }))
    .filter((item) => item.issues.length > 0);
}

// Rounds up to one significant digit: 334 -> 400, 94 -> 100, 32 -> 40.
function roundUp(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function slotsOf(text: string): string[] {
  return [...text.matchAll(STRING_INTERPOLATION_REGEX)].map((match) => match[1].trim());
}

/** Every expression the runtime evaluates in a JSON form definition. */
function collectJsonExpressions(formDefinition: unknown, file: string): MockExpression[] {
  const found: MockExpression[] = [];
  const root = formDefinition as Record<string, unknown>;
  for (const [name, expression] of Object.entries(root['states'] ?? {})) {
    found.push({ source: `${file} states.${name}`, expression: expression as string });
  }

  const visitNode = (node: unknown, path: string): void => {
    if (typeof node === 'string') {
      for (const slot of slotsOf(node)) {
        found.push({ source: `${file} ${path}`, expression: slot });
      }
      return;
    }
    if (node === null || typeof node !== 'object') {
      return;
    }
    const object = node as Record<string, unknown>;
    if (typeof object['when'] === 'string') {
      found.push({ source: `${file} ${path}.when`, expression: object['when'] });
    }
    const params = object['params'];
    if (typeof object['key'] === 'string' && params !== null && typeof params === 'object') {
      for (const [name, value] of Object.entries(params)) {
        if (typeof value === 'string' && isI18nParamExpression(value)) {
          found.push({ source: `${file} ${path}.params.${name}`, expression: value });
        }
      }
    }
    for (const [key, value] of Object.entries(object)) {
      if (key !== 'when' && !(path === '' && key === 'states')) {
        visitNode(value, path === '' ? key : `${path}.${key}`);
      }
    }
  };
  visitNode(formDefinition, '');
  return found;
}

/**
 * The `when` values, the string values of a `states` object and the `{{ }}` slots of a DX mock,
 * read from the file text. A template literal resolves `${NAME}` through a `const NAME = '...'`
 * in the same file. Any other template literal is listed in `unresolvedTemplates`.
 */
function collectDxExpressions(
  text: string,
  file: string,
): { expressions: MockExpression[]; unresolvedTemplates: string[] } {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const constants = new Map<string, string>();
  const expressions: MockExpression[] = [];
  const unresolvedTemplates: string[] = [];

  const location = (node: ts.Node): string =>
    `${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  const stringValue = (node: ts.Node): string | undefined => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }
    if (!ts.isTemplateExpression(node)) {
      return undefined;
    }
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const constant = ts.isIdentifier(span.expression)
        ? constants.get(span.expression.text)
        : undefined;
      if (constant === undefined) {
        unresolvedTemplates.push(`${location(node)} ${node.getText()}`);
        return undefined;
      }
      value += constant + span.literal.text;
    }
    return value;
  };

  const collectConstants = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const value =
        ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer)
          ? node.initializer.text
          : undefined;
      if (value !== undefined) {
        constants.set(node.name.text, value);
      }
    }
    ts.forEachChild(node, collectConstants);
  };

  const collectStates = (states: ts.ObjectLiteralExpression): void => {
    for (const property of states.properties) {
      const value = ts.isPropertyAssignment(property)
        ? stringValue(property.initializer)
        : undefined;
      if (value !== undefined) {
        expressions.push({ source: `${location(property)} states`, expression: value });
      }
    }
  };

  const collectExpressions = (node: ts.Node): void => {
    const isStatesDeclaration =
      (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) &&
      node.name.getText() === 'states' &&
      node.initializer !== undefined &&
      ts.isObjectLiteralExpression(node.initializer);
    if (isStatesDeclaration) {
      collectStates(node.initializer as ts.ObjectLiteralExpression);
    }
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'when') {
      const value = stringValue(node.initializer);
      if (value !== undefined) {
        expressions.push({ source: `${location(node)} when`, expression: value });
      }
    }
    if (ts.isStringLiteral(node) || ts.isTemplateLiteral(node)) {
      for (const slot of slotsOf(stringValue(node) ?? '')) {
        expressions.push({ source: `${location(node)} {{ }}`, expression: slot });
      }
    }
    ts.forEachChild(node, collectExpressions);
  };

  collectConstants(sourceFile);
  collectExpressions(sourceFile);
  return { expressions, unresolvedTemplates };
}
