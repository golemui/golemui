import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isInputWidget, type FunctionWidget, type NonFunctionWidget } from '../form-widget';
import { type RepeaterRow } from '../store/model';
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

/** The rows `expandSources` records for a row widget, from `[declaredItemPath, itemPath]` pairs. */
const rowsOf = (...pairs: [string, string][]): RepeaterRow[] =>
  pairs.map(([declaredItemPath, itemPath]) => ({
    declaredItemPath,
    itemPath,
    index: Number(itemPath.split('.').pop()),
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

    it('should not treat a segment that only starts with "items" as a token', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'line-total',
        path: 'lines.items.itemsTotal',
      } as unknown as NonFunctionWidget<string>;

      expect(makeRepeaterItemConfig(mockWidget, [4])).toEqual({
        uid: 'line-total[4]',
        path: 'lines.4.itemsTotal',
      });
    });

    it('should not treat the first segment as a token', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'item-name',
        path: 'items.items.name',
      } as unknown as NonFunctionWidget<string>;

      expect(makeRepeaterItemConfig(mockWidget, [2])).toEqual({
        uid: 'item-name[2]',
        path: 'items.2.name',
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

    it('should throw for a property named "items", because indexes alone cannot place the row', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'line-name',
        path: 'invoice.items.items.name',
      } as unknown as NonFunctionWidget<string>;

      // expandSources resolves this path by position, see expand-sources.spec.ts.
      expect(() => makeRepeaterItemConfig(mockWidget, [0])).toThrowError(
        "Path contains 2 'items' occurrences, but 1 indexes were provided.",
      );
    });
  });
});

describe('transformRepeaterItemWhenExpression', () => {
  const usersRow = rowsOf(['users.items', 'users.2']);
  const teamsAndDevsRows = rowsOf(
    ['teams.items', 'teams.1'],
    ['teams.items.devs.items', 'teams.1.devs.3'],
  );

  it('should return the expression unchanged when it has no row reference', () => {
    expect(transformRepeaterItemWhenExpression('$form.active', usersRow)).toBe('$form.active');
  });

  it('should replace the row token of a reference to the row', () => {
    expect(transformRepeaterItemWhenExpression('$form.users.items.active', usersRow)).toBe(
      '$form.users.2.active',
    );
  });

  it('should replace a reference written without $form', () => {
    expect(transformRepeaterItemWhenExpression('users.items.active', usersRow)).toBe(
      'users.2.active',
    );
  });

  it('should replace every reference to the row', () => {
    expect(
      transformRepeaterItemWhenExpression('$form.users.items.a && !$form.users.items.b', usersRow),
    ).toBe('$form.users.2.a && !$form.users.2.b');
  });

  it('should replace references to the inner and the outer row of a nested repeater', () => {
    expect(
      transformRepeaterItemWhenExpression(
        '$form.teams.items.devs.items.active && $form.teams.items.open',
        teamsAndDevsRows,
      ),
    ).toBe('$form.teams.1.devs.3.active && $form.teams.1.open');
  });

  it('should leave a reference to an inner row unchanged for a widget of the outer row', () => {
    expect(
      transformRepeaterItemWhenExpression('$form.users.items.addresses.items.active', usersRow),
    ).toBe('$form.users.2.addresses.items.active');
  });

  it('should replace a reference used as an $errors key', () => {
    expect(
      transformRepeaterItemWhenExpression("$errors['users.items.name'] !== undefined", usersRow),
    ).toBe("$errors['users.2.name'] !== undefined");
  });

  describe('items with optional chaining', () => {
    it('should keep the ?. separators', () => {
      expect(
        transformRepeaterItemWhenExpression(
          '$form?.repeaters?.teams.items?.teamName?.length',
          rowsOf(['repeaters.teams.items', 'repeaters.teams.2']),
        ),
      ).toBe('$form?.repeaters?.teams.2?.teamName?.length');
    });

    it('should keep the ?. separators of a nested reference', () => {
      expect(
        transformRepeaterItemWhenExpression(
          '$form.teams.items?.devs?.items?.active',
          teamsAndDevsRows,
        ),
      ).toBe('$form.teams.1?.devs?.3?.active');
    });
  });

  describe('items segments that are not a row token', () => {
    it('should keep a property named items after the row token', () => {
      expect(
        transformRepeaterItemWhenExpression(
          '$form.invoice.items.items.name',
          rowsOf(['invoice.items.items', 'invoice.items.0']),
        ),
      ).toBe('$form.invoice.items.0.name');
    });

    it('should keep an items property of $item', () => {
      expect(
        transformRepeaterItemWhenExpression(
          '$item.items.length > 0',
          rowsOf(['items.items', 'items.1']),
        ),
      ).toBe('$item.items.length > 0');
    });

    it('should keep an unrelated property named items', () => {
      expect(transformRepeaterItemWhenExpression('$form.cart.items.length > 0', usersRow)).toBe(
        '$form.cart.items.length > 0',
      );
    });

    it('should keep a segment that only starts with items', () => {
      expect(transformRepeaterItemWhenExpression('$form.users.itemsTotal > 0', usersRow)).toBe(
        '$form.users.itemsTotal > 0',
      );
    });

    it('should keep a path that only ends with the row path', () => {
      expect(transformRepeaterItemWhenExpression('$form.club.users.items.active', usersRow)).toBe(
        '$form.club.users.items.active',
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

    const result = transformWidgetWhenExpressions(widget, rowsOf(['users.items', 'users.1']));

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

    const result = transformWidgetWhenExpressions(widget, rowsOf(['users.items', 'users.0']));

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

    const result = transformWidgetWhenExpressions(widget, rowsOf(['users.items', 'users.0']));

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
