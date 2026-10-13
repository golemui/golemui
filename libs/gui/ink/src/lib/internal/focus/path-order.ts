/**
 * The position of a widget in the rendered tree, as one ordinal per level from the form root.
 *
 * The first child of the root layout is `[0]`, its second child `[1]`, and the first child of
 * that second child is `[1, 0]`.
 */
export type FocusPath = number[];

/**
 * Compares two paths the way a dictionary compares words, one ordinal at a time.
 *
 * A path that is a prefix of the other comes first, so a container is ordered before the
 * widgets it holds.
 *
 * @param left - The first path.
 * @param right - The second path.
 * @returns A negative number when `left` comes first, a positive number when `right` does, 0 when
 * both paths are equal.
 *
 * @example
 * comparePaths([0, 1], [1]); // negative, the child of the first widget comes before the second
 */
export function comparePaths(left: FocusPath, right: FocusPath): number {
  const sharedLength = Math.min(left.length, right.length);
  for (let level = 0; level < sharedLength; level++) {
    if (left[level] !== right[level]) {
      return left[level] - right[level];
    }
  }
  return left.length - right.length;
}

/**
 * Reports whether `path` is the container path itself or one of the paths below it.
 *
 * @param path - The path to test, usually the path of the focused widget.
 * @param containerPath - The path of the widget that asks.
 * @returns True when `path` starts with `containerPath`.
 *
 * @example
 * isPathInside([2, 0, 1], [2]); // true
 */
export function isPathInside(path: FocusPath, containerPath: FocusPath): boolean {
  if (path.length < containerPath.length) {
    return false;
  }
  return containerPath.every((ordinal, level) => path[level] === ordinal);
}
