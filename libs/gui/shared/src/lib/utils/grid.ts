/**
 * @internal Used by framework layout components, not part of the end-user public API.
 *
 * The grid layout's props as Components' `gui-grid` classes. Every adapter's grid renders
 * `gridClasses()` on its container and `gridCellClasses()` on each child's cell.
 */
import type { GridGap, GridJustify, GridProps } from '../widget.props';

/** A grid's props, with their defaults. */
export type ResolvedGrid = {
  mode: 'stack' | 'row' | 'columns' | 'auto';
  /** The number of columns, in `columns` mode. */
  columns?: number;
  gap: GridGap;
  justify: GridJustify;
};

const MAX_COLUMNS = 12;

const clamp = (value: number, max: number) => Math.min(Math.max(Math.round(value), 1), max);

/**
 * Resolves a grid's props, with their defaults.
 *
 * @example
 * resolveGrid({ direction: 'row', gap: 'lg' });
 * // { mode: 'row', gap: 'lg', justify: 'stretch' }
 */
export function resolveGrid(grid: GridProps = {}): ResolvedGrid {
  const gap = grid.gap ?? 'md';
  const justify = grid.justify ?? 'stretch';

  if (grid.columns === 'auto') return { mode: 'auto', gap, justify };
  if (typeof grid.columns === 'number') {
    return { mode: 'columns', columns: clamp(grid.columns, MAX_COLUMNS), gap, justify };
  }
  if (grid.direction !== 'row') return { mode: 'stack', gap, justify };
  return { mode: 'row', gap, justify };
}

/** The classes of a grid's container. */
export function gridClasses(grid: ResolvedGrid): string {
  const classes = ['gui-grid'];
  if (grid.mode === 'row') classes.push('gui-grid--row');
  if (grid.mode === 'columns') classes.push(`gui-grid--columns-${grid.columns}`);
  if (grid.mode === 'auto') classes.push('gui-grid--auto');
  if (grid.gap !== 'md') classes.push(`gui-grid--gap-${grid.gap}`);
  if (grid.mode === 'row' && grid.justify !== 'stretch') {
    classes.push(`gui-grid--justify-${grid.justify}`);
  }
  return classes.join(' ');
}

/**
 * The classes of the cell around a grid's child. A stretched row shares its width by the
 * children's `size` and numbered columns are spanned by it; the other grids ignore it.
 */
export function gridCellClasses(grid: ResolvedGrid, size: number | undefined): string {
  const sharesRow = grid.mode === 'row' && grid.justify === 'stretch';
  const max = sharesRow ? MAX_COLUMNS : grid.mode === 'columns' ? grid.columns : 1;
  const span = size === undefined || max === undefined ? 1 : clamp(size, max);
  return span > 1 ? `gui-grid__cell gui-grid__cell--span-${span}` : 'gui-grid__cell';
}
