import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import {
  type GridGap,
  type GridJustify,
  type GridProps,
  resolveGrid,
  type ResolvedGrid,
} from '@golemui/gui-shared/internals';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { Box, type BoxProps } from 'ink';
import { FocusPathProvider } from '../internal/focus/FocusPathContext';

// A terminal line is about twice as tall as a cell is wide, and lines are scarce, so the vertical
// gaps are smaller than the horizontal ones.
const GAP_CELLS: Record<GridGap, { columns: number; rows: number }> = {
  none: { columns: 0, rows: 0 },
  xs: { columns: 1, rows: 0 },
  sm: { columns: 1, rows: 0 },
  md: { columns: 2, rows: 0 },
  lg: { columns: 3, rows: 1 },
  xl: { columns: 4, rows: 1 },
};

// The DOM grid's 12rem minimum column, in cells.
const AUTO_COLUMN_MIN_CELLS = 24;

const JUSTIFY_CONTENT: Record<Exclude<GridJustify, 'stretch'>, BoxProps['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
};

type GridChild = { widget: NonFunctionWidget<string>; index: number };

/**
 * The `grid` layout widget.
 *
 * Each child sizes itself (`flexGrow` from its `size`, `flexBasis={0}`), so a stack and a
 * stretched row render the children directly. The other modes wrap each child in a column cell.
 */
export function Grid(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { children, templateData } = useLayoutWidget<GridProps>(widget);
  const grid = resolveGrid('grid', templateData);
  const gap = GAP_CELLS[grid.gap];
  const gridChildren = (children as NonFunctionWidget<string>[]).map((child, index) => ({
    widget: child,
    index,
  }));

  return (
    <Box
      flexDirection={grid.mode === 'stack' || grid.mode === 'columns' ? 'column' : 'row'}
      flexWrap={grid.mode === 'auto' ? 'wrap' : 'nowrap'}
      justifyContent={
        grid.mode === 'row' && grid.justify !== 'stretch'
          ? JUSTIFY_CONTENT[grid.justify]
          : undefined
      }
      columnGap={gap.columns}
      rowGap={gap.rows}
      flexGrow={templateData.size ?? 1}
      flexBasis={0}
    >
      <GridContent grid={grid} gridChildren={gridChildren} columnGap={gap.columns} />
    </Box>
  );
}

function GridContent({
  grid,
  gridChildren,
  columnGap,
}: {
  grid: ResolvedGrid;
  gridChildren: GridChild[];
  columnGap: number;
}) {
  if (grid.mode === 'columns') {
    const columns = grid.columns ?? 1;
    return (
      <>
        {splitIntoRows(gridChildren, columns).map((row, rowIndex) => {
          const usedColumns = row.reduce((sum, cell) => sum + cell.span, 0);
          // Keyed by position: a row keyed by its first cell remounts every cell of the row when
          // `when` hides that first cell.
          return (
            <Box key={rowIndex} flexDirection="row" columnGap={columnGap}>
              {row.map(({ child, span }) => (
                <Box key={child.widget.uid} flexDirection="column" flexGrow={span} flexBasis={0}>
                  <GridChildRenderer child={child} />
                </Box>
              ))}
              {/* Keeps the cells of a short last row at the width of the rows above. */}
              {usedColumns < columns && <Box flexGrow={columns - usedColumns} flexBasis={0} />}
            </Box>
          );
        })}
      </>
    );
  }

  if (grid.mode === 'auto') {
    return (
      <>
        {gridChildren.map((child) => (
          <Box
            key={child.widget.uid}
            flexDirection="column"
            flexGrow={1}
            flexBasis={AUTO_COLUMN_MIN_CELLS}
          >
            <GridChildRenderer child={child} />
          </Box>
        ))}
      </>
    );
  }

  if (grid.mode === 'row' && grid.justify !== 'stretch') {
    // A column cell gives the child's `flexBasis={0}` to the height, so the child keeps its own
    // width. Without `flexShrink={0}` the row squeezes it below that width.
    return (
      <>
        {gridChildren.map((child) => (
          <Box key={child.widget.uid} flexDirection="column" flexShrink={0}>
            <GridChildRenderer child={child} />
          </Box>
        ))}
      </>
    );
  }

  return (
    <>
      {gridChildren.map((child) => (
        <GridChildRenderer key={child.widget.uid} child={child} />
      ))}
    </>
  );
}

function GridChildRenderer({ child }: { child: GridChild }) {
  // The provider is what keeps the tab order equal to the reading order of the tree.
  return (
    <FocusPathProvider index={child.index}>
      <WidgetRenderer widget={child.widget} />
    </FocusPathProvider>
  );
}

/** Fills rows of `columns` columns in order, each child spanning its `size`. */
function splitIntoRows(
  gridChildren: GridChild[],
  columns: number,
): { child: GridChild; span: number }[][] {
  const rows: { child: GridChild; span: number }[][] = [];
  let currentRow: { child: GridChild; span: number }[] = [];
  let usedColumns = 0;

  for (const child of gridChildren) {
    const span = Math.min(Math.max(Math.round(child.widget.size ?? 1), 1), columns);
    if (usedColumns + span > columns) {
      rows.push(currentRow);
      currentRow = [];
      usedColumns = 0;
    }
    currentRow.push({ child, span });
    usedColumns += span;
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  return rows;
}
