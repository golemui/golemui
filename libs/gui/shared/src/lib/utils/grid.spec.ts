import { describe, expect, it } from 'vitest';
import { gridCellClasses, gridClasses, resolveGrid } from './grid';

describe('resolveGrid', () => {
  it('stacks a grid with no direction, a md gap apart', () => {
    expect(resolveGrid()).toEqual({ mode: 'stack', gap: 'md', justify: 'stretch' });
  });

  it('reads the grid props', () => {
    expect(resolveGrid({ direction: 'row', gap: 'lg', justify: 'end' })).toEqual({
      mode: 'row',
      gap: 'lg',
      justify: 'end',
    });
    expect(resolveGrid({ direction: 'row', columns: 3 })).toMatchObject({
      mode: 'columns',
      columns: 3,
    });
    expect(resolveGrid({ columns: 'auto' }).mode).toBe('auto');
    expect(resolveGrid({ columns: 40 }).columns).toBe(12);
  });
});

describe('gridClasses', () => {
  it('names the mode, and the gap and justify when they are not the defaults', () => {
    expect(gridClasses(resolveGrid())).toBe('gui-grid');
    expect(gridClasses(resolveGrid({ direction: 'row', gap: 'sm', justify: 'end' }))).toBe(
      'gui-grid gui-grid--row gui-grid--gap-sm gui-grid--justify-end',
    );
    expect(gridClasses(resolveGrid({ columns: 4 }))).toBe('gui-grid gui-grid--columns-4');
    expect(gridClasses(resolveGrid({ columns: 'auto' }))).toBe('gui-grid gui-grid--auto');
    // `justify` only applies to a row.
    expect(gridClasses(resolveGrid({ justify: 'end' }))).toBe('gui-grid');
  });
});

describe('gridCellClasses', () => {
  it('spans by size in a stretched row and in numbered columns', () => {
    const row = resolveGrid({ direction: 'row' });
    expect(gridCellClasses(row, undefined)).toBe('gui-grid__cell');
    expect(gridCellClasses(row, 2)).toBe('gui-grid__cell gui-grid__cell--span-2');
    expect(gridCellClasses(resolveGrid({ columns: 3 }), 5)).toBe(
      'gui-grid__cell gui-grid__cell--span-3',
    );
  });

  it('ignores size where the grid sizes its own cells', () => {
    expect(gridCellClasses(resolveGrid(), 4)).toBe('gui-grid__cell');
    expect(gridCellClasses(resolveGrid({ columns: 'auto' }), 4)).toBe('gui-grid__cell');
    expect(gridCellClasses(resolveGrid({ direction: 'row', justify: 'end' }), 4)).toBe(
      'gui-grid__cell',
    );
  });
});

describe('edge values', () => {
  it('keeps a column count between 1 and 12 and rounds it', () => {
    expect(resolveGrid({ columns: 0 })).toMatchObject({ mode: 'columns', columns: 1 });
    expect(resolveGrid({ columns: 2.6 }).columns).toBe(3);
  });

  it('gives a cell no span for a size of zero or less', () => {
    const row = resolveGrid({ direction: 'row' });
    expect(gridCellClasses(row, 0)).toBe('gui-grid__cell');
    expect(gridCellClasses(row, -2)).toBe('gui-grid__cell');
  });
});
