import { describe, expect, it } from 'vitest';
import { gapFromPixels, gridCellClasses, gridClasses, resolveGrid } from './grid';

describe('resolveGrid', () => {
  it('stacks a grid with no direction, a md gap apart', () => {
    expect(resolveGrid('grid')).toEqual({ mode: 'stack', gap: 'md', justify: 'stretch' });
  });

  it('reads the grid props', () => {
    expect(resolveGrid('grid', { direction: 'row', gap: 'lg', justify: 'end' })).toEqual({
      mode: 'row',
      gap: 'lg',
      justify: 'end',
    });
    expect(resolveGrid('grid', { direction: 'row', columns: 3 })).toMatchObject({
      mode: 'columns',
      columns: 3,
    });
    expect(resolveGrid('grid', { columns: 'auto' }).mode).toBe('auto');
    expect(resolveGrid('grid', { columns: 40 }).columns).toBe(12);
  });

  it('maps the deprecated grid props', () => {
    expect(resolveGrid('grid', { direction: 'row', autoFit: true })).toMatchObject({ mode: 'row' });
    expect(resolveGrid('grid', { direction: 'row', autoFit: false })).toMatchObject({
      mode: 'columns',
      columns: 12,
    });
    expect(resolveGrid('grid', { direction: 'column', autoFit: false }).mode).toBe('stack');
    expect(resolveGrid('grid', { columnGap: 24, rowGap: 8 }).gap).toBe('lg');
    expect(resolveGrid('grid', { rowGap: 50 }).gap).toBe('xl');
    expect(resolveGrid('grid', { align: 'space-evenly' }).justify).toBe('space-between');
    expect(resolveGrid('grid', { align: 'end', justify: 'start' }).justify).toBe('start');
  });

  it('renders a deprecated flex layout as a grid', () => {
    expect(resolveGrid('flex', {})).toEqual({ mode: 'stack', gap: 'md', justify: 'stretch' });
    expect(resolveGrid('flex', { direction: 'row-reverse', align: 'end', gap: 12 })).toEqual({
      mode: 'row',
      gap: 'sm',
      justify: 'end',
    });
    // Flex's `justify` placed the children across the row: it has no grid equivalent.
    expect(resolveGrid('flex', { direction: 'row', justify: 'center' }).justify).toBe('stretch');
  });
});

describe('gapFromPixels', () => {
  it('picks the nearest step', () => {
    expect([0, 4, 6, 8, 12, 16, 20, 24, 28, 32, 100].map(gapFromPixels)).toEqual([
      'none',
      'xs',
      'xs',
      'sm',
      'sm',
      'md',
      'md',
      'lg',
      'lg',
      'xl',
      'xl',
    ]);
  });
});

describe('gridClasses', () => {
  it('names the mode, and the gap and justify when they are not the defaults', () => {
    expect(gridClasses(resolveGrid('grid'))).toBe('gui-grid');
    expect(gridClasses(resolveGrid('grid', { direction: 'row', gap: 'sm', justify: 'end' }))).toBe(
      'gui-grid gui-grid--row gui-grid--gap-sm gui-grid--justify-end',
    );
    expect(gridClasses(resolveGrid('grid', { columns: 4 }))).toBe('gui-grid gui-grid--columns-4');
    expect(gridClasses(resolveGrid('grid', { columns: 'auto' }))).toBe('gui-grid gui-grid--auto');
    // `justify` only applies to a row.
    expect(gridClasses(resolveGrid('grid', { justify: 'end' }))).toBe('gui-grid');
  });
});

describe('gridCellClasses', () => {
  it('spans by size in a stretched row and in numbered columns', () => {
    const row = resolveGrid('grid', { direction: 'row' });
    expect(gridCellClasses(row, undefined)).toBe('gui-grid__cell');
    expect(gridCellClasses(row, 2)).toBe('gui-grid__cell gui-grid__cell--span-2');
    expect(gridCellClasses(resolveGrid('grid', { columns: 3 }), 5)).toBe(
      'gui-grid__cell gui-grid__cell--span-3',
    );
  });

  it('ignores size where the grid sizes its own cells', () => {
    expect(gridCellClasses(resolveGrid('grid'), 4)).toBe('gui-grid__cell');
    expect(gridCellClasses(resolveGrid('grid', { columns: 'auto' }), 4)).toBe('gui-grid__cell');
    expect(gridCellClasses(resolveGrid('grid', { direction: 'row', justify: 'end' }), 4)).toBe(
      'gui-grid__cell',
    );
  });
});
