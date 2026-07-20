import { describe, expect, it } from 'vitest';
import { expressionIsTrue, normalizeArrayIndexes } from './justin';

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
});
