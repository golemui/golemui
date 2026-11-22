import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type FormWidget, isInputWidget } from '../form-widget';
import { type RepeaterRow, type State } from '../store/model';
import { extractRepeaterIndexes, getFormEventRow, makeRepeaterItemConfig } from './repeater';

// Mock the external dependency to easily control the execution branch.
vi.mock('../form-widget', () => ({
  isInputWidget: vi.fn(),
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
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

      expect(makeRepeaterItemConfig(mockWidget, [2])).toEqual({
        uid: 'item-name[2]',
        path: 'items.2.name',
      });
    });
  });

  describe('Error handling', () => {
    it('should throw an error if repeaterIndexes is an empty array', () => {
      const mockWidget = {
        uid: 'base-widget',
      } as unknown as FormWidget<string>;

      expect(() => makeRepeaterItemConfig(mockWidget, [])).toThrowError(
        'Repeater indexes cannot be an empty array',
      );
    });

    it('should throw an error if an input widget path has fewer "items" tokens than provided indexes', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-name',
        path: 'users.items.name', // 1 token
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

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
      } as unknown as FormWidget<string>;

      // The form places such a path in its row by position, see store/reducer.repeater-rows.spec.ts.
      expect(() => makeRepeaterItemConfig(mockWidget, [0])).toThrowError(
        "Path contains 2 'items' occurrences, but 1 indexes were provided.",
      );
    });
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

describe('getFormEventRow', () => {
  // `getFormEventRow` reads only `repeaterRows`.
  const stateWithRows = (repeaterRows: State['repeaterRows']) => ({ repeaterRows }) as State;

  it('should return undefined for a widget that is not in a repeater', () => {
    expect(getFormEventRow(stateWithRows({}), 'save')).toBeUndefined();
  });

  it('should return the row of a widget in a flat repeater', () => {
    const state = stateWithRows({ 'name[1]': rowsOf(['users.items', 'users.1']) });

    expect(getFormEventRow(state, 'name[1]')).toEqual({ index: 1, indexes: [1], path: 'users.1' });
  });

  it('should return the innermost row and every index, outermost first, in a nested repeater', () => {
    const state = stateWithRows({
      'devMenu[2][1]': rowsOf(
        ['teams.items', 'teams.2'],
        ['teams.items.devs.items', 'teams.2.devs.1'],
      ),
    });

    expect(getFormEventRow(state, 'devMenu[2][1]')).toEqual({
      index: 1,
      indexes: [2, 1],
      path: 'teams.2.devs.1',
    });
  });
});
