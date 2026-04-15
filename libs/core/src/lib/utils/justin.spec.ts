import { describe, expect, it } from 'vitest';
import { expressionIsTrue } from './justin';

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
      expect(
        expressionIsTrue('$errors.name !== null', {}, {}, $errors, false),
      ).toBe(true);
    });

    it('detects a field with no errors (null)', () => {
      expect(
        expressionIsTrue('$errors.address.city === null', {}, {}, $errors, false),
      ).toBe(true);
    });

    it('checks the number of errors on a field', () => {
      expect(
        expressionIsTrue('$errors.email.length === 2', {}, {}, $errors, false),
      ).toBe(true);
    });

    it('returns false when a field has no errors but expression expects errors', () => {
      expect(
        expressionIsTrue('$errors.address.city !== null', {}, {}, $errors, false),
      ).toBe(false);
    });

    it('accesses nested field errors', () => {
      expect(
        expressionIsTrue('$errors.address.street !== null', {}, {}, $errors, false),
      ).toBe(true);
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
        expressionIsTrue(
          '$formIsInvalid === true && $errors.name !== null',
          {},
          {},
          $errors,
          true,
        ),
      ).toBe(true);
    });

    it('returns false when $formIsInvalid does not match expected value', () => {
      expect(expressionIsTrue('$formIsInvalid === true', {}, {}, {}, false)).toBe(false);
    });
  });
});
