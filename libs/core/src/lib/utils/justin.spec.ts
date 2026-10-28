import { describe, expect, it, vi } from 'vitest';
import { enableDevMode } from './dev-mode';
import {
  COMPILED_EXPRESSION_CACHE_LIMIT,
  compileExpression,
  ExpressionRejectedError,
  expressionIsTrue,
} from './justin';
import { normalizeArrayIndexes } from './normalize-array-indexes';

describe('justin', () => {
  const $form = {
    teams: [
      { developers: [{ firstName: 'Alice' }, { firstName: undefined }] },
      { developers: [{ firstName: 'Bob' }] },
    ],
  };

  describe('expressionIsTrue with numeric dot indexes', () => {
    it('resolves a single numeric index', () => {
      expect(
        expressionIsTrue('$form.teams.0.developers.0.firstName === "Alice"', $form, {}, {}, false),
      ).toBe(true);
    });

    it('resolves nested numeric indexes', () => {
      expect(
        expressionIsTrue('$form.teams.1.developers.0.firstName === "Bob"', $form, {}, {}, false),
      ).toBe(true);
    });

    it('handles optional chaining before a numeric index', () => {
      expect(
        expressionIsTrue(
          '$form.teams.0.developers?.1?.firstName === undefined',
          $form,
          {},
          {},
          false,
        ),
      ).toBe(true);
    });

    it('returns false when the value does not match', () => {
      expect(
        expressionIsTrue('$form.teams.0.developers.0.firstName === "Bob"', $form, {}, {}, false),
      ).toBe(false);
    });
  });

  describe('expressionIsTrue with $meta parameter', () => {
    const $meta = {
      userId: '12345',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
    };

    it('evaluates $meta properties', () => {
      expect(expressionIsTrue('$meta.userId === "12345"', {}, $meta, {}, false)).toBe(true);
    });

    it('evaluates $meta array properties', () => {
      expect(expressionIsTrue('$meta.permissions.includes("write")', {}, $meta, {}, false)).toBe(
        true,
      );
    });

    it('returns false when $meta value does not match', () => {
      expect(expressionIsTrue('$meta.role === "user"', {}, $meta, {}, false)).toBe(false);
    });

    it('combines $meta and $form in a single expression', () => {
      expect(
        expressionIsTrue(
          '$form.teams.0.developers.0.firstName === "Alice" && $meta.role === "admin"',
          $form,
          $meta,
          {},
          false,
        ),
      ).toBe(true);
    });
  });

  describe('expressionIsTrue with $errors parameter', () => {
    const $errors = {
      name: ['Required'],
      email: ['Invalid format', 'Already taken'],
      address: {
        street: ['Required'],
        city: null,
      },
    };

    it('detects a field with errors', () => {
      expect(expressionIsTrue('$errors.name !== null', {}, {}, $errors, false)).toBe(true);
    });

    it('detects a field with no errors (null)', () => {
      expect(expressionIsTrue('$errors.address.city === null', {}, {}, $errors, false)).toBe(true);
    });

    it('checks the number of errors on a field', () => {
      expect(expressionIsTrue('$errors.email.length === 2', {}, {}, $errors, false)).toBe(true);
    });

    it('returns false when a field has no errors but expression expects errors', () => {
      expect(expressionIsTrue('$errors.address.city !== null', {}, {}, $errors, false)).toBe(false);
    });

    it('accesses nested field errors', () => {
      expect(expressionIsTrue('$errors.address.street !== null', {}, {}, $errors, false)).toBe(
        true,
      );
    });
  });

  describe('normalizeArrayIndexes', () => {
    it('converts dot numeric indexes to bracket notation', () => {
      expect(normalizeArrayIndexes('$form.teams.1.developers?.0?.firstName')).toBe(
        '$form.teams[1].developers?.[0]?.firstName',
      );
    });

    it('converts consecutive numeric indexes', () => {
      expect(normalizeArrayIndexes('$form.matrix.1.0.value')).toBe('$form.matrix[1][0].value');
    });

    it('converts an index after an identifier ending in a digit', () => {
      expect(normalizeArrayIndexes('$form.item2.0.name')).toBe('$form.item2[0].name');
    });

    it('keeps decimal number literals untouched', () => {
      expect(normalizeArrayIndexes('35 * 0.02')).toBe('35 * 0.02');
      expect(normalizeArrayIndexes("$form.x === 'EUR' ? 0.15 : 0.02")).toBe(
        "$form.x === 'EUR' ? 0.15 : 0.02",
      );
      expect(normalizeArrayIndexes('0.5')).toBe('0.5');
    });

    it('keeps a leading-dot decimal untouched', () => {
      expect(normalizeArrayIndexes('$form.total * .5')).toBe('$form.total * .5');
    });

    it('handles indexes and decimals in the same expression', () => {
      expect(normalizeArrayIndexes('$form.lineItems.0.unitPrice * 1.15')).toBe(
        '$form.lineItems[0].unitPrice * 1.15',
      );
    });

    it('evaluates a decimal multiplication end to end', () => {
      expect(
        expressionIsTrue('($form.subtotal ?? 0) * 0.5 === 17.5', { subtotal: 35 }, {}, {}, false),
      ).toBe(true);
    });
  });

  describe('expressionIsTrue with $item / $index extra scope', () => {
    const extraScope = { $item: { quantity: 2, unitPrice: 10 }, $index: 1 };

    it('reads an $item property', () => {
      expect(expressionIsTrue('$item.quantity === 2', {}, {}, {}, false, extraScope)).toBe(true);
    });

    it('computes with $item values', () => {
      expect(
        expressionIsTrue('$item.quantity * $item.unitPrice === 20', {}, {}, {}, false, extraScope),
      ).toBe(true);
    });

    it('reads $index', () => {
      expect(expressionIsTrue('$index === 1', {}, {}, {}, false, extraScope)).toBe(true);
    });

    it('guards a missing $item leaf with nullish coalescing', () => {
      expect(expressionIsTrue('($item.missing ?? 0) === 0', {}, {}, {}, false, extraScope)).toBe(
        true,
      );
    });

    it('combines $item with $form in a single expression', () => {
      expect(
        expressionIsTrue(
          '$item.quantity === 2 && $form.teams.0.developers.0.firstName === "Alice"',
          $form,
          {},
          {},
          false,
          extraScope,
        ),
      ).toBe(true);
    });

    it('treats $item as undefined when no extra scope is provided', () => {
      expect(expressionIsTrue('$item?.quantity === undefined', {}, {}, {}, false)).toBe(true);
    });
  });

  describe('expressionIsTrue with $fn extra scope', () => {
    const $fn = {
      isAdult: (age: number) => age >= 18,
      total: (items: Array<{ price?: number }> = []) =>
        items.reduce((sum, item) => sum + (item.price ?? 0), 0),
    };

    it('calls a host function with a $form argument', () => {
      expect(expressionIsTrue('$fn.isAdult($form.age)', { age: 21 }, {}, {}, false, { $fn })).toBe(
        true,
      );
    });

    it('returns false when the host function result does not match', () => {
      expect(expressionIsTrue('$fn.isAdult($form.age)', { age: 12 }, {}, {}, false, { $fn })).toBe(
        false,
      );
    });

    it('combines $fn with $item and $index in the same extra scope', () => {
      expect(
        expressionIsTrue('$fn.total($item.lines) === 30 && $index === 0', {}, {}, {}, false, {
          $item: { lines: [{ price: 10 }, { price: 20 }] },
          $index: 0,
          $fn,
        }),
      ).toBe(true);
    });

    it('treats a missing $fn entry as undefined when no functions are configured', () => {
      expect(expressionIsTrue('$fn.missing === undefined', {}, {}, {}, false)).toBe(true);
    });

    it('throws when calling a function the host did not provide', () => {
      expect(() => expressionIsTrue('$fn.missing()', {}, {}, {}, false, { $fn })).toThrow();
    });
  });

  describe('expressionIsTrue with $formIsInvalid parameter', () => {
    it('evaluates $formIsInvalid as true', () => {
      expect(expressionIsTrue('$formIsInvalid === true', {}, {}, {}, true)).toBe(true);
    });

    it('evaluates $formIsInvalid as false', () => {
      expect(expressionIsTrue('$formIsInvalid === false', {}, {}, {}, false)).toBe(true);
    });

    it('combines $formIsInvalid with $errors in an expression', () => {
      const $errors = { name: ['Required'] };
      expect(
        expressionIsTrue('$formIsInvalid === true && $errors.name !== null', {}, {}, $errors, true),
      ).toBe(true);
    });

    it('returns false when $formIsInvalid does not match expected value', () => {
      expect(expressionIsTrue('$formIsInvalid === true', {}, {}, {}, false)).toBe(false);
    });
  });

  describe('compileExpression cache', () => {
    it('throws the same parse error on every call', () => {
      const expression = '$form.a +';
      const messages = [1, 2].map(() => {
        try {
          compileExpression(expression);
          return undefined;
        } catch (error) {
          return (error as Error).message;
        }
      });

      expect(messages[0]).toContain('Unexpected token');
      expect(messages[1]).toBe(messages[0]);
      // A valid expression still compiles after the failures.
      expect(compileExpression('$form.a')({ $form: { a: 1 } })).toBe(1);
    });

    it('returns the same evaluator for the same expression string', () => {
      const first = compileExpression('$form.total * 2');
      const second = compileExpression('$form.total * 2');
      expect(second).toBe(first);
    });

    it('re-evaluates a cached expression against new scope values', () => {
      expect(expressionIsTrue('$form.age >= 18', { age: 21 }, {}, {}, false)).toBe(true);
      expect(expressionIsTrue('$form.age >= 18', { age: 12 }, {}, {}, false)).toBe(false);
    });

    it('clears the cache at the limit and recompiles a working evaluator', () => {
      const before = compileExpression('$form.a');
      // Enough distinct expressions to reach the limit at least once from any starting size
      for (let index = 0; index <= COMPILED_EXPRESSION_CACHE_LIMIT; index++) {
        compileExpression(`$form.a + ${index}`);
      }
      const after = compileExpression('$form.a');
      expect(after).not.toBe(before);
      expect(after({ $form: { a: 7 } })).toBe(7);
    });
  });
  describe('compileExpression policy', () => {
    it.each(['warn', 'strict'] as const)(
      'throws ExpressionRejectedError for a code execution path with the %s policy',
      (policy) => {
        const expression = "(x => x).constructor('return 42')()";

        expect(() => compileExpression(expression, policy)).toThrow(ExpressionRejectedError);
        try {
          compileExpression(expression, policy);
        } catch (error) {
          expect((error as ExpressionRejectedError).code).toBe(50);
          expect((error as ExpressionRejectedError).message).toContain(expression);
        }
      },
    );

    it('rejects a write in an expressionIsTrue condition and leaves the data unchanged', () => {
      const $form = { tags: [1] };

      expect(() => expressionIsTrue('$form.tags.push(2) > 0', $form, {}, {}, false)).toThrow(
        ExpressionRejectedError,
      );
      expect($form).toEqual({ tags: [1] });
    });

    it('rejects a write into a Map in $meta and leaves the Map unchanged', () => {
      const $meta = { cache: new Map<string, string>() };

      expect(() =>
        expressionIsTrue("$meta.cache.set('role', 'admin').size > 0", {}, $meta, {}, false),
      ).toThrow(ExpressionRejectedError);
      expect($meta.cache.size).toBe(0);
    });

    it('compiles a method outside the list with warn and rejects it with strict', () => {
      const expression = "$form.name.startsWith('A')";

      expect(() => compileExpression(expression, 'strict')).toThrow(ExpressionRejectedError);
      // The strict rejection is not cached, and the warn cache is separate.
      expect(compileExpression(expression, 'warn')({ $form: { name: 'Ada' } })).toBe(true);
      expect(() => compileExpression(expression, 'strict')).toThrow(ExpressionRejectedError);
    });

    it('prints one dev mode warning per expression with the warn policy', () => {
      enableDevMode();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const expression = "$form.name.endsWith('a')";

      compileExpression(expression, 'warn');
      compileExpression(expression, 'warn');

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(expression);
      warn.mockRestore();
    });
  });
});
