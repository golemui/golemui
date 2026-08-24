import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isInputWidget, type FunctionWidget, type NonFunctionWidget } from '../form-widget';
import {
  extractRepeaterIndexes,
  makeRepeaterItemConfig,
  transformRepeaterItemWhenExpression,
  transformWidgetWhenExpressions,
} from './repeater';

// Mock the external dependency to easily control the execution branch.
// isFunctionWidget keeps its real behavior so function widgets take their branch.
vi.mock('../form-widget', () => ({
  isInputWidget: vi.fn(),
  isFunctionWidget: vi.fn((widget: unknown) => typeof widget === 'function'),
}));

describe('makeRepeaterItemConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Non-input widgets', () => {
    it('should update only the uid and retain other properties', () => {
      vi.mocked(isInputWidget).mockReturnValue(false);

      const mockWidget = {
        uid: 'base-widget',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [0, 5]);

      expect(result).toEqual({
        uid: 'base-widget[0][5]',
      });
      // Ensure the original object was not mutated
      expect(result).not.toBe(mockWidget);
    });
  });

  describe('Input widgets', () => {
    it('should update both the uid and the path for a single level of nesting', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-name',
        path: 'users.items.name',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [2]);

      expect(result).toEqual({
        uid: 'user-name[2]',
        path: 'users.2.name',
      });
    });

    it('should update both the uid and the path for multiple levels of nesting', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-address-street',
        path: 'users.items.addresses.items.street',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [1, 3]);

      expect(result).toEqual({
        uid: 'user-address-street[1][3]',
        path: 'users.1.addresses.3.street',
      });
    });
  });

  describe('Function widgets', () => {
    it('should wrap the function so it stays callable and materialize uid, type and path', () => {
      vi.mocked(isInputWidget).mockReturnValue(false);

      const resolvedWidget = { kind: 'display', type: 'markdownText' };
      const original = Object.assign(
        vi.fn(() => resolvedWidget),
        { uid: 'row-total', type: 'markdownText', path: 'users.items.total' },
      ) as unknown as FunctionWidget<string>;

      const result = makeRepeaterItemConfig(original, [1]) as FunctionWidget<string>;

      expect(typeof result).toBe('function');
      expect(result).not.toBe(original);
      expect(result.uid).toBe('row-total[1]');
      expect(result.type).toBe('markdownText');
      expect(result.path).toBe('users.1.total');

      const api = { $form: {}, errors: undefined, touched: undefined, translate: undefined };
      expect(result(api)).toBe(resolvedWidget);
      expect(original).toHaveBeenCalledWith(api);

      // Ensure the original function was not mutated
      expect(original.uid).toBe('row-total');
      expect(original.path).toBe('users.items.total');
    });

    it('should not materialize a path when the function widget has none', () => {
      const original = Object.assign(vi.fn(), {
        uid: 'fn-widget',
        type: 'markdownText',
      }) as unknown as FunctionWidget<string>;

      const result = makeRepeaterItemConfig(original, [0]) as FunctionWidget<string>;

      expect(result.uid).toBe('fn-widget[0]');
      expect(result.path).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw an error if repeaterIndexes is an empty array', () => {
      const mockWidget = {
        uid: 'base-widget',
      } as unknown as NonFunctionWidget<string>;

      expect(() => makeRepeaterItemConfig(mockWidget, [])).toThrowError(
        'Repeater indexes cannot be an empty array',
      );
    });

    it('should throw an error if an input widget path has fewer "items" tokens than provided indexes', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-name',
        path: 'users.items.name', // 1 token
      } as unknown as NonFunctionWidget<string>;

      // Providing 2 indexes for 1 token
      expect(() => makeRepeaterItemConfig(mockWidget, [0, 1])).toThrowError(
        "Path contains 1 'items' occurrences, but 2 indexes were provided.",
      );
    });

    it('should throw an error if an input widget path has more "items" tokens than provided indexes', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-address-street',
        path: 'users.items.addresses.items.street', // 2 tokens
      } as unknown as NonFunctionWidget<string>;

      // Providing 1 index for 2 tokens
      expect(() => makeRepeaterItemConfig(mockWidget, [0])).toThrowError(
        "Path contains 2 'items' occurrences, but 1 indexes were provided.",
      );
    });
  });
});

describe('transformRepeaterItemWhenExpression', () => {
  it('should return the expression unchanged when it has no .items. token', () => {
    expect(transformRepeaterItemWhenExpression('form.active', [0])).toBe('form.active');
  });

  it('should replace a single .items. token with the corresponding index', () => {
    expect(transformRepeaterItemWhenExpression('users.items.active', [2])).toBe('users.2.active');
  });

  it('should replace multiple .items. tokens with the corresponding indexes', () => {
    expect(transformRepeaterItemWhenExpression('users.items.addresses.items.active', [1, 3])).toBe(
      'users.1.addresses.3.active',
    );
  });

  it('should leave excess .items. tokens unreplaced when fewer indexes than tokens are provided', () => {
    expect(transformRepeaterItemWhenExpression('users.items.addresses.items.active', [1])).toBe(
      'users.1.addresses.items.active',
    );
  });

  describe('items with optional chaining', () => {
    it('should replace a .items?. token with the corresponding index', () => {
      expect(
        transformRepeaterItemWhenExpression('$form.repeaters.teams.items?.teamName?.length', [2]),
      ).toBe('$form.repeaters.teams.2?.teamName?.length');
    });

    it('should handle mixed .items. and .items?. tokens', () => {
      expect(
        transformRepeaterItemWhenExpression('users.items.addresses.items?.active', [1, 3]),
      ).toBe('users.1.addresses.3?.active');
    });

    it('should leave excess .items?. tokens unreplaced when fewer indexes than tokens are provided', () => {
      expect(transformRepeaterItemWhenExpression('users.items?.addresses.items?.active', [1])).toBe(
        'users.1?.addresses.items?.active',
      );
    });
  });
});

describe('transformWidgetWhenExpressions', () => {
  it('should rewrite the when expression of every reactive flag field', () => {
    const widget = {
      uid: 'row-qty[1]',
      include: { when: '$form.users.items.active' },
      exclude: { when: '$form.users.items.done' },
      disabled: { when: '$form.users.items.locked' },
      readonly: { when: '$form.users.items.frozen' },
    } as unknown as NonFunctionWidget<string>;

    const result = transformWidgetWhenExpressions(widget, [1]);

    expect(result).toEqual({
      uid: 'row-qty[1]',
      include: { when: '$form.users.1.active' },
      exclude: { when: '$form.users.1.done' },
      disabled: { when: '$form.users.1.locked' },
      readonly: { when: '$form.users.1.frozen' },
    });
    // Ensure the original widget and its flag objects were not mutated
    expect(result).not.toBe(widget);
    expect((widget as { include?: { when: string } }).include?.when).toBe(
      '$form.users.items.active',
    );
  });

  it('should leave state-based and boolean flag fields untouched', () => {
    const widget = {
      uid: 'row-note[0]',
      include: { in: ['editing'] },
      exclude: { from: ['summary'] },
      disabled: true,
    } as unknown as NonFunctionWidget<string>;

    const result = transformWidgetWhenExpressions(widget, [0]);

    expect(result).toEqual({
      uid: 'row-note[0]',
      include: { in: ['editing'] },
      exclude: { from: ['summary'] },
      disabled: true,
    });
    // No when expression anywhere, so the input is returned by reference
    expect(result).toBe(widget);
  });

  it('should return the same widget reference when no flag field is present', () => {
    const widget = {
      uid: 'row-note[0]',
      props: { md: 'hello' },
    } as unknown as NonFunctionWidget<string>;

    const result = transformWidgetWhenExpressions(widget, [0]);

    expect(result).toBe(widget);
  });
});

describe('extractRepeaterIndexes', () => {
  it.each([
    ['abc[0][1]', [0, 1]],
    ['abc', []],
    ['#0.2.t.1[3]', [3]],
    ['a[12]', [12]],
  ])('%s -> %j', (uid, expected) => {
    expect(extractRepeaterIndexes(uid)).toEqual(expected);
  });
});
