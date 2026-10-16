import { nextEnabledIndex } from './grid-nav';

export interface RovingStepOptions {
  /** Which arrows move: ArrowLeft/Right for `horizontal`, ArrowUp/Down for `vertical`. */
  orientation: 'horizontal' | 'vertical';
  /** A right-to-left layout: the horizontal arrows swap. */
  rtl?: boolean;
  /** Whether moving past an end goes round to the other. */
  wrap?: boolean;
  /** Whether the item at an index can't take focus, so a move skips it. */
  isDisabled?: (index: number) => boolean;
}

const never = () => false;

/**
 * The index a key moves the focus to in a row or column of `length` items, from `index`: the
 * arrows of the orientation step to the next enabled item (round the ends with `wrap`), Home and
 * End go to the first and last enabled ones. -1 when the key moves nothing: it is no navigation
 * key, or the focus is at an end already.
 */
export function rovingStep(
  key: string,
  index: number,
  length: number,
  { orientation, rtl = false, wrap = false, isDisabled = never }: RovingStepOptions,
): number {
  const forward = rtl ? -1 : 1;
  const steps: Record<string, number> =
    orientation === 'horizontal'
      ? { ArrowRight: forward, ArrowLeft: -forward }
      : { ArrowDown: 1, ArrowUp: -1 };

  const walk = (from: number, step: number) =>
    nextEnabledIndex(from, step, length, isDisabled, { outOfBounds: 'none' });

  if (key === 'Home') return walk(-1, 1);
  if (key === 'End') return walk(length, -1);

  const step = steps[key];
  if (step === undefined) return -1;
  const next = walk(index, step);
  if (next !== -1 || !wrap) return next;
  const wrapped = walk(step > 0 ? -1 : length, step);
  return wrapped === index ? -1 : wrapped;
}

/**
 * The index typeahead moves the focus to: the next enabled item, after `index` and round the end,
 * whose label starts with `query`. A query of one letter typed again (`"aaa"`) cycles through the
 * items that start with it. -1 when none matches.
 */
export function typeaheadMatch(
  query: string,
  labels: string[],
  index: number,
  isDisabled: (index: number) => boolean = never,
): number {
  const repeated = query.length > 1 && [...query].every((letter) => letter === query[0]);
  const search = (repeated ? query[0] : query).toLocaleLowerCase();
  // A new search starts at the next item; one that grows ("ap", "app") may stay on this one.
  const first = repeated || query.length === 1 ? 1 : 0;
  for (let offset = first; offset < labels.length + first; offset++) {
    const candidate = (index + offset) % labels.length;
    if (isDisabled(candidate)) continue;
    if (labels[candidate].trim().toLocaleLowerCase().startsWith(search)) return candidate;
  }
  return -1;
}
