/**
 * @internal Used by framework layout components, not part of the end-user public API.
 *
 * The grid layout's props as Components' `gui-grid` classes. Every adapter's grid renders
 * `gridClasses()` on its container and `gridCellClasses()` on each child's cell, and a deprecated
 * flex layout renders through the same grid.
 */
import type { FlexProps, GridGap, GridJustify, GridProps } from '../widget.props';

/** A grid's props once the deprecated ones are mapped. */
export type ResolvedGrid = {
  mode: 'stack' | 'row' | 'columns' | 'auto';
  /** The number of columns, in `columns` mode. */
  columns?: number;
  gap: GridGap;
  justify: GridJustify;
};

const MAX_COLUMNS = 12;

/** The gap step nearest to a number of pixels, for the deprecated pixel gaps. */
export function gapFromPixels(pixels: number): GridGap {
  if (pixels <= 2) return 'none';
  if (pixels <= 6) return 'xs';
  if (pixels <= 12) return 'sm';
  if (pixels <= 20) return 'md';
  if (pixels <= 28) return 'lg';
  return 'xl';
}

/** The deprecated `align` values, which placed the children along the direction. */
function justifyFromAlign(align: GridProps['align'] | FlexProps['align']): GridJustify | undefined {
  if (align === 'space-around' || align === 'space-evenly') return 'space-between';
  return align;
}

const clamp = (value: number, max: number) => Math.min(Math.max(Math.round(value), 1), max);

/**
 * Resolves a grid's props, mapping the deprecated ones, and those of a deprecated flex layout.
 *
 * @param type - The layout widget's type: `grid`, or `flex` for the deprecated alias.
 * @example
 * resolveGrid('grid', { direction: 'row', gap: 'lg' });
 * // { mode: 'row', gap: 'lg', justify: 'stretch' }
 * resolveGrid('flex', { direction: 'row', align: 'end', gap: 12 });
 * // { mode: 'row', gap: 'sm', justify: 'end' }
 */
export function resolveGrid(type: string, props: GridProps | FlexProps = {}): ResolvedGrid {
  if (type === 'flex') {
    const flex = props as FlexProps;
    return {
      mode: flex.direction?.startsWith('row') ? 'row' : 'stack',
      gap: flex.gap === undefined ? 'md' : gapFromPixels(flex.gap),
      // Flex's `justify` placed the children across the direction: the field anatomy does that now.
      justify: justifyFromAlign(flex.align) ?? 'stretch',
    };
  }

  const grid = props as GridProps;
  const pixelGap = grid.columnGap ?? grid.rowGap;
  const gap = grid.gap ?? (pixelGap === undefined ? 'md' : gapFromPixels(pixelGap));
  const justify = grid.justify ?? justifyFromAlign(grid.align) ?? 'stretch';

  if (grid.columns === 'auto') return { mode: 'auto', gap, justify };
  if (typeof grid.columns === 'number') {
    return { mode: 'columns', columns: clamp(grid.columns, MAX_COLUMNS), gap, justify };
  }
  if (grid.direction !== 'row') return { mode: 'stack', gap, justify };
  // The deprecated twelve-column grid, which a span placed in.
  if (grid.autoFit === false) return { mode: 'columns', columns: MAX_COLUMNS, gap, justify };
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
