import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { FocusPath } from './path-order';

// The root layout widget renders with no provider above it, so it owns the empty path and its
// children are [0], [1], [2] and so on.
const ROOT_PATH: FocusPath = [];

/** Holds the path of the widget being rendered. Read it with {@link useFocusPath}. */
const FocusPathContext = createContext<FocusPath>(ROOT_PATH);

/** Props of {@link FocusPathProvider}. */
export type FocusPathProviderProps = {
  /** The position of this child among the children the layout widget renders. */
  index: number;
  children: ReactNode;
};

/**
 * Gives one rendered child its own path, built from the path of the layout widget that renders it.
 *
 * A layout widget has to wrap every child it renders, because the tab order is the sorted list of
 * paths and a widget that registers late would otherwise be reached last.
 *
 * @param props - The child index and the child itself.
 * @returns The child, with its path available to every widget below it.
 *
 * @example
 * {children.map((child, index) => (
 *   <FocusPathProvider key={child.uid} index={index}>
 *     <WidgetRenderer widget={child} />
 *   </FocusPathProvider>
 * ))}
 */
export function FocusPathProvider({ index, children }: FocusPathProviderProps) {
  const parentPath = useContext(FocusPathContext);
  const path = useMemo(() => [...parentPath, index], [parentPath, index]);
  return <FocusPathContext value={path}>{children}</FocusPathContext>;
}

/**
 * Reads the path of the widget that calls it.
 *
 * @returns The path of the current widget, or the empty root path when no layout widget wrapped it.
 */
export function useFocusPath(): FocusPath {
  return useContext(FocusPathContext);
}
