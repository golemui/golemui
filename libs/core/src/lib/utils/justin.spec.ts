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
      expect(expressionIsTrue('$form.teams.0.developers.0.firstName === "Alice"', $form)).toBe(
        true,
      );
    });

    it('resolves nested numeric indexes', () => {
      expect(expressionIsTrue('$form.teams.1.developers.0.firstName === "Bob"', $form)).toBe(true);
    });

    it('handles optional chaining before a numeric index', () => {
      expect(expressionIsTrue('$form.teams.0.developers?.1?.firstName === undefined', $form)).toBe(
        true,
      );
    });

    it('returns false when the value does not match', () => {
      expect(expressionIsTrue('$form.teams.0.developers.0.firstName === "Bob"', $form)).toBe(false);
    });
  });
});
