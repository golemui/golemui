import { describe, expect, it } from 'vitest';
import { ALLOWED_EXPRESSION_METHODS, type ExpressionPolicy } from '../utils/check-expression';
import { compileExpression, ExpressionRejectedError } from '../utils/justin';
import { transformRepeaterItemWhenExpression } from '../utils/repeater';
import {
  compileFormExpression,
  compileRowCondition,
  ROW_INDEXES_SCOPE_KEY,
  type RowLevel,
} from './compile-expression';
import { type ExpressionScope, pathInRow } from './compiled-form';

/**
 * The expressions of a form definition, compiled one time. Most tests compare a compiled
 * expression with `compileExpression`, the compiler that evaluates the text of each row.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/compile/compile-expression.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Outcome = { result: unknown } | { errorName: string; errorMessage: string };

/** The result of a function, or the error that it throws. */
const outcomeOf = (run: () => unknown): Outcome => {
  try {
    return { result: run() };
  } catch (error) {
    const thrown = error as Error;
    return { errorName: thrown.name, errorMessage: thrown.message };
  }
};

/** The rows of a repeater `users`. */
const usersLevels: RowLevel[] = [
  { declaredItemPath: 'users.items', itemPathParts: ['users.', ''] },
];

/** The rows of a repeater `devs` inside the rows of a repeater `teams`. */
const devsLevels: RowLevel[] = [
  { declaredItemPath: 'teams.items', itemPathParts: ['teams.', ''] },
  { declaredItemPath: 'teams.items.devs.items', itemPathParts: ['teams.', '.devs.', ''] },
];

/** The rows of a repeater whose path ends with a property named `items`. */
const invoiceLevels: RowLevel[] = [
  { declaredItemPath: 'invoice.items.items', itemPathParts: ['invoice.items.', ''] },
];

/** The rows of a repeater whose path ends with a letter outside ASCII. */
const menuLevels: RowLevel[] = [{ declaredItemPath: 'menú.items', itemPathParts: ['menú.', ''] }];

const formData = {
  users: Array.from({ length: 13 }, (_unused, index) => ({
    name: index === 0 ? 'Ada' : `user${index}`,
    active: index % 2 === 0,
    limit: index,
    tags: index === 0 ? ['Ada', 'admin'] : [`tag${index}`],
  })),
  teams: [
    { open: true, devs: [{ name: 'A0' }] },
    { open: false, devs: [{ name: 'B0' }, { name: 'B1' }, { name: 'B2' }, { name: 'B3' }] },
  ],
  invoice: { items: [{ name: 'first line' }, { name: 'second line' }] },
  menú: [{ name: 'soup' }, { name: 'rice' }],
  cart: { items: ['x'] },
};

/** The scope of a flag condition of a widget in the row with these indexes. */
const rowScope = (levels: RowLevel[], rowIndexes: number[]): ExpressionScope => {
  const itemPath = pathInRow(levels[levels.length - 1].itemPathParts, rowIndexes);
  const item = itemPath
    .split('.')
    .reduce<unknown>(
      (value, key) => (value as Record<string, unknown> | undefined)?.[key],
      formData,
    );
  return {
    $form: formData,
    $meta: {},
    $errors: { users: [{ name: ['required'] }] },
    $formIsInvalid: true,
    $fn: {},
    $item: item,
    $index: rowIndexes[rowIndexes.length - 1],
    [ROW_INDEXES_SCOPE_KEY]: rowIndexes,
  };
};

/** The text that the form evaluates for one row when it compiles each row on its own. */
const textOfRow = (condition: string, levels: RowLevel[], rowIndexes: number[]): string =>
  transformRepeaterItemWhenExpression(
    condition,
    levels.map((level, depth) => ({
      declaredItemPath: level.declaredItemPath,
      itemPath: pathInRow(level.itemPathParts, rowIndexes),
      index: rowIndexes[depth],
    })),
  );

const expectSameOutcomeInEveryRow = (
  condition: string,
  levels: RowLevel[],
  rows: number[][],
  policy: ExpressionPolicy = 'warn',
): void => {
  const compiled = compileRowCondition(condition, levels, policy);
  for (const rowIndexes of rows) {
    const scope = rowScope(levels, rowIndexes);
    const expected = outcomeOf(() =>
      compileExpression(textOfRow(condition, levels, rowIndexes), policy)(scope),
    );
    expect(
      outcomeOf(() => compiled.evaluate(scope)),
      `row ${rowIndexes.join(', ')}`,
    ).toEqual(expected);
  }
};

const userRows = [[0], [1], [12]];
const devRows = [
  [0, 0],
  [1, 0],
  [1, 3],
  // No team has this index.
  [12, 345],
];

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('compileFormExpression', () => {
  it('evaluates the expression with the scope of each call', () => {
    const compiled = compileFormExpression('$form.age >= $meta.minimumAge', 'warn');

    expect(compiled.source).toBe('$form.age >= $meta.minimumAge');
    expect(compiled.failure).toBeUndefined();
    expect(compiled.warning).toBeUndefined();
    expect(compiled.evaluate({ $form: { age: 30 }, $meta: { minimumAge: 18 } })).toBe(true);
    expect(compiled.evaluate({ $form: { age: 10 }, $meta: { minimumAge: 18 } })).toBe(false);
  });

  it.each([
    ['a numeric path segment', '$form.users.1.name'],
    ['an optional numeric path segment', '$form.users?.1?.name'],
    ['a decimal number', '$form.users.1.limit * 0.5'],
    ['an arrow function that reads the scope', '$form.users.0.tags.map(tag => tag + $index)'],
    ['an empty text', ''],
    ['a name that is not in the scope', '$route'],
    ['a property of a name that is not in the scope', '$route.id'],
    ['a name that every object has', 'typeof toString'],
    ['a function that the host did not provide', '$fn.missing()'],
    ['a parameter with a default value', '$form.users.0.tags.map((tag = 1) => tag)'],
  ])('gives the outcome of compileExpression for %s', (_case, expression) => {
    const scope = rowScope(usersLevels, [2]);
    const expected = outcomeOf(() => compileExpression(expression, 'warn')(scope));

    const compiled = compileFormExpression(expression, 'warn');

    expect(outcomeOf(() => compiled.evaluate(scope))).toEqual(expected);
  });

  it('keeps the error of a text that does not parse, and throws it at each evaluation', () => {
    const expected = outcomeOf(() => compileExpression('$form..x', 'warn'));

    const compiled = compileFormExpression('$form..x', 'warn');

    expect(compiled.failure).toBeInstanceOf(SyntaxError);
    expect(outcomeOf(() => compiled.evaluate({}))).toEqual(expected);
    expect(() => compiled.evaluate({})).toThrow(compiled.failure);
  });

  it.each(['warn', 'strict'] as const)(
    'rejects an expression that writes into the data with the %s policy',
    (policy) => {
      const tags = ['a'];
      const compiled = compileFormExpression('$form.tags.pop()', policy);

      expect(compiled.failure).toBeInstanceOf(ExpressionRejectedError);
      expect(compiled.failure?.message).toBe(
        'Rejected expression "$form.tags.pop()": [EXPRESSION_REJECTED] The method "pop" changes the array in place, so it writes into the data. Expressions can only read.',
      );
      expect(() => compiled.evaluate({ $form: { tags } })).toThrow(compiled.failure);
      expect(tags).toEqual(['a']);
    },
  );

  it('runs a method outside the allowed list with the warn policy, and keeps the warning', () => {
    const compiled = compileFormExpression("$form.code.padEnd(4, '-')", 'warn');

    expect(compiled.failure).toBeUndefined();
    expect(compiled.evaluate({ $form: { code: 'ab' } })).toBe('ab--');
    expect(compiled.warning).toBe(
      `[GolemUI] Expression "$form.code.padEnd(4, '-')" fails with expressionPolicy 'strict': The method "padEnd" is not in the list of allowed methods: ${ALLOWED_EXPRESSION_METHODS.join(', ')}.`,
    );
  });

  it('rejects a method outside the allowed list with the strict policy', () => {
    const compiled = compileFormExpression("$form.code.padEnd(4, '-')", 'strict');

    expect(compiled.failure).toBeInstanceOf(ExpressionRejectedError);
    expect(compiled.warning).toBeUndefined();
    expect(() => compiled.evaluate({ $form: { code: 'ab' } })).toThrow(compiled.failure);
  });

  it('keeps the warning of an expression that parses and does not compile', () => {
    const compiled = compileFormExpression("$form.code.padEnd(4,,'-')", 'warn');

    expect(compiled.failure?.message).toBe('Empty argument');
    expect(compiled.warning).toContain('The method "padEnd" is not in the list of allowed methods');
  });

  it.each([
    ['empty parentheses', '()', 'Empty ()'],
    ['a call with an empty argument', '$fn.f(1,,2)', 'Empty argument'],
    ['an index access without an index', '$form[]', 'Missing index'],
  ])('keeps the error of %s, which parses and does not compile', (_case, expression, message) => {
    const compiled = compileFormExpression(expression, 'warn');

    expect(compiled.failure?.message).toBe(message);
    expect(() => compiled.evaluate({ $form: {}, $fn: {} })).toThrow(compiled.failure);
  });
});

describe('an expression policy that is not known', () => {
  const unknownPolicy = 'Strict' as ExpressionPolicy;

  it('runs no expression, also one without an issue', () => {
    const compiled = compileFormExpression('$form.age >= 18', unknownPolicy);

    expect(compiled.failure?.message).toBe(
      'Unknown expression policy "Strict". Use "warn" or "strict".',
    );
    expect(() => compiled.evaluate({ $form: { age: 30 } })).toThrow(compiled.failure);
  });

  it('runs no row condition', () => {
    const compiled = compileRowCondition('$form.users.items.active', usersLevels, unknownPolicy);

    expect(compiled.failure?.message).toBe(
      'Unknown expression policy "Strict". Use "warn" or "strict".',
    );
    expect(() => compiled.evaluate(rowScope(usersLevels, [0]))).toThrow(compiled.failure);
  });
});

describe('compileRowCondition', () => {
  describe('a condition that names its row in code', () => {
    it.each([
      ['a property of the row', '$form.users.items.active'],
      ['a comparison with a quoted text', "$form.users.items.name === 'Ada'"],
      ['optional separators', '$form?.users?.items?.name'],
      ['the row itself', '$form.users.items'],
      ['a reference without $form', 'users.items.name'],
      ['two references', '$form.users.items.limit > 0 && $form.users.items.active'],
      [
        'a reference inside an arrow function',
        '$form.users.items.tags.some(tag => tag === $form.users.items.name)',
      ],
      ['an arrow parameter with the name of the repeater', '$form.users.map(users => users.items)'],
      ['a reference and the row variables', '$form.users.items.name === $item.name && $index >= 0'],
      ['a reference in a comment', '$form.users.items.active // users.items is this row'],
      ['an index after the reference', '$form.users.items.tags.0'],
    ])('gives the result of each row for %s', (_case, condition) => {
      expectSameOutcomeInEveryRow(condition, usersLevels, userRows);
    });

    it.each([
      ['both rows', "$form.teams.items.devs.items.name === 'B3'"],
      ['both rows with optional separators', '$form.teams?.items?.devs?.items?.name'],
      ['only the outer row', '$form.teams.items.open'],
      [
        'the outer row and the inner row',
        '$form.teams.items.devs.items.name + $form.teams.items.devs.length',
      ],
    ])('gives the result of each row of a nested repeater for %s', (_case, condition) => {
      expectSameOutcomeInEveryRow(condition, devsLevels, devRows);
    });

    it('fails in a row of the outer repeater for a condition that names a row of the inner one', () => {
      const teamLevels = devsLevels.slice(0, 1);

      expectSameOutcomeInEveryRow('$form.teams.items.devs.items.name', teamLevels, [[0], [1]]);
    });

    it('reads the row of a repeater whose path ends with a property named items', () => {
      expectSameOutcomeInEveryRow('$form.invoice.items.items.name', invoiceLevels, [[0], [1]]);
    });

    it('rejects a condition that writes into the row, and quotes the condition as written', () => {
      const compiled = compileRowCondition(
        '$form.users.items.tags.pop() === 1',
        usersLevels,
        'warn',
      );

      expect(compiled.failure).toBeInstanceOf(ExpressionRejectedError);
      expect(compiled.failure?.message).toBe(
        'Rejected expression "$form.users.items.tags.pop() === 1": [EXPRESSION_REJECTED] The method "pop" changes the array in place, so it writes into the data. Expressions can only read.',
      );
      expect(() => compiled.evaluate(rowScope(usersLevels, [0]))).toThrow(compiled.failure);
      expect(formData.users[0].tags).toEqual(['Ada', 'admin']);
    });

    it('rejects a call of the row, as the text of each row is rejected', () => {
      // The text of row 0 is `$form.users.0(1)`, a call of the result of an index access.
      expect(() => compileExpression(textOfRow('$form.users.items(1)', usersLevels, [0]))).toThrow(
        ExpressionRejectedError,
      );

      const compiled = compileRowCondition('$form.users.items(1)', usersLevels, 'warn');

      expect(compiled.failure).toBeInstanceOf(ExpressionRejectedError);
      expect(compiled.failure?.message).toContain('Rejected expression "$form.users.items(1)"');
    });

    it.each([
      ["$form.users.items.name.startsWith('A')"],
      ["$form.users?.items?.name.startsWith('A')"],
    ])('keeps the warning of a method outside the allowed list for %s', (condition) => {
      const compiled = compileRowCondition(condition, usersLevels, 'warn');

      expect(compiled.warning).toBe(
        `[GolemUI] Expression "${condition}" fails with expressionPolicy 'strict': The method "startsWith" is not in the list of allowed methods: ${ALLOWED_EXPRESSION_METHODS.join(', ')}.`,
      );
      expect(compiled.evaluate(rowScope(usersLevels, [0]))).toBe(true);
      expect(compiled.evaluate(rowScope(usersLevels, [1]))).toBe(false);
    });

    it('keeps one warning for a condition inside two repeaters, and gives the result of each row', () => {
      const condition = "$form.teams.items.devs.items.name.startsWith('B')";

      const compiled = compileRowCondition(condition, devsLevels, 'warn');

      // A condition that is compiled for each row has no warning of its own.
      expect(compiled.warning).toContain(`Expression "${condition}"`);
      expect(compiled.evaluate(rowScope(devsLevels, [0, 0]))).toBe(false);
      expect(compiled.evaluate(rowScope(devsLevels, [1, 3]))).toBe(true);
    });

    it('counts the nodes of the text of a row for the size limit of the strict policy', () => {
      // 80 nodes as written. The text of a row has one node more, the row index.
      const condition = `[$form.users.items.limit${', 1'.repeat(75)}]`;
      expect(compileFormExpression(condition, 'strict').failure).toBeUndefined();
      expect(() => compileExpression(textOfRow(condition, usersLevels, [0]), 'strict')).toThrow(
        'The expression has 81 AST nodes. The limit is 80.',
      );

      const compiled = compileRowCondition(condition, usersLevels, 'strict');

      expect(compiled.failure?.message).toBe(
        `Rejected expression "${condition}": [EXPRESSION_TOO_LARGE] The expression has 81 AST nodes. The limit is 80.`,
      );
    });

    it('counts the characters of the condition as written for the size limit of the strict policy', () => {
      const padding = ' '.repeat(401 - '$form.users.items.active'.length);
      const condition = `$form.users.items.active${padding}`;
      expect(condition).toHaveLength(401);

      const compiled = compileRowCondition(condition, usersLevels, 'strict');

      expect(compiled.failure?.message).toBe(
        `Rejected expression "${condition}": [EXPRESSION_TOO_LARGE] The expression has 401 characters. The limit is 400.`,
      );
    });
  });

  describe('a condition that names its row outside code', () => {
    it.each([
      ['a quoted text', "'users.items.name'"],
      ['a quoted text next to a reference in code', "$form.users.items.name + ' of users.items'"],
      ['a quoted text with $form', "'$form.users.items'.length"],
      ['a template text', '`${$form.users.items.name} of users.items`'],
      ['a key of $errors in a quoted text', "$errors['users.items.name']"],
    ])('gives the result of each row for %s', (_case, condition) => {
      expectSameOutcomeInEveryRow(condition, usersLevels, userRows);
    });

    it('gives the result of each row of a nested repeater for a quoted text', () => {
      expectSameOutcomeInEveryRow("'teams.items.devs.items'", devsLevels, devRows);
    });

    it('gives the outcome of each row for a path segment that ends with a letter outside ASCII', () => {
      // The text of row 0 is `$form.menú.0.name`, which the expression check rejects.
      expectSameOutcomeInEveryRow('$form.menú.items.name', menuLevels, [[0], [1]]);
      expect(() =>
        compileRowCondition('$form.menú.items.name', menuLevels, 'warn').evaluate(
          rowScope(menuLevels, [1]),
        ),
      ).toThrow('Rejected expression "$form.menú.1.name"');
    });

    it('writes the index of the row into the quoted text', () => {
      const compiled = compileRowCondition("'users.items.name'", usersLevels, 'warn');

      expect(compiled.evaluate(rowScope(usersLevels, [0]))).toBe('users[0].name');
      expect(compiled.evaluate(rowScope(usersLevels, [12]))).toBe('users[12].name');
    });

    it('rejects the text of each row when a row evaluates it', () => {
      const condition = "$form.users.items.tags.pop() === 'users.items'";

      const compiled = compileRowCondition(condition, usersLevels, 'warn');

      expect(compiled.failure).toBeUndefined();
      expect(() => compiled.evaluate(rowScope(usersLevels, [1]))).toThrow(
        'Rejected expression "$form.users.1.tags.pop() === \'users.1\'"',
      );
    });
  });

  describe('a condition that does not parse', () => {
    it('gives the error of the text of each row', () => {
      expectSameOutcomeInEveryRow('$form.users.items..x', usersLevels, userRows);
    });
  });

  describe('a condition that names no row', () => {
    it.each([
      ['the row variables', '$item.active === true && $index < 2'],
      ['a property named items of the row', '$item.items'],
      ['a property named items of another value', '$form.cart.items.length > 0'],
      ['an error of the row', '$errors.users.items.name'],
      ['a name that only starts with the path of the row', '$form.users.itemsCount'],
    ])('gives the result of each row for %s', (_case, condition) => {
      expectSameOutcomeInEveryRow(condition, usersLevels, userRows);
    });

    it.each(['$item..name', '$item.items..name'])(
      'keeps the error of the condition %s, which does not parse',
      (condition) => {
        const compiled = compileRowCondition(condition, usersLevels, 'warn');

        expect(compiled.failure).toBeInstanceOf(SyntaxError);
        expect(() => compiled.evaluate(rowScope(usersLevels, [0]))).toThrow(compiled.failure);
      },
    );

    it('keeps the error of a rejected condition', () => {
      const compiled = compileRowCondition('$item.tags.pop()', usersLevels, 'warn');

      expect(compiled.failure).toBeInstanceOf(ExpressionRejectedError);
      expect(compiled.failure?.message).toContain('Rejected expression "$item.tags.pop()"');
    });
  });

  it.each(['warn', 'strict'] as const)(
    'gives the result of each row with the %s policy',
    (policy) => {
      expectSameOutcomeInEveryRow(
        '$form.users.items.active === true',
        usersLevels,
        userRows,
        policy,
      );
      expectSameOutcomeInEveryRow("'users.items'.length", usersLevels, userRows, policy);
    },
  );
});
