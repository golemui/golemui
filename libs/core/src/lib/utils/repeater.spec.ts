import { describe, expect, it } from 'vitest';
import { type RepeaterRow, type State } from '../store/model';
import { extractRepeaterIndexes, getFormEventRow, toRepeaterItemUid } from './repeater';

/** The rows `expandSources` records for a row widget, from `[declaredItemPath, itemPath]` pairs. */
const rowsOf = (...pairs: [string, string][]): RepeaterRow[] =>
  pairs.map(([declaredItemPath, itemPath]) => ({
    declaredItemPath,
    itemPath,
    index: Number(itemPath.split('.').pop()),
  }));

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

describe('toRepeaterItemUid', () => {
  it('adds one index suffix for each nesting level', () => {
    expect(toRepeaterItemUid('dev-name', [2])).toBe('dev-name[2]');
    expect(toRepeaterItemUid('dev-name', [2, 0])).toBe('dev-name[2][0]');
  });

  it('throws when it gets no index', () => {
    expect(() => toRepeaterItemUid('dev-name', [])).toThrowError(
      'Repeater indexes cannot be an empty array',
    );
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
