/**
 * Where a floating element sits next to its anchor. The side comes first: `top` and `bottom` are
 * above and below, `start` and `end` are before and after in the reading direction, so they mirror
 * in a right-to-left context. The optional alignment lines up the two elements' start or end
 * edges along the other axis; without it the floating element is centered on the anchor.
 */
export type GuiPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'start'
  | 'start-start'
  | 'start-end'
  | 'end'
  | 'end-start'
  | 'end-end';

type Side = 'top' | 'bottom' | 'start' | 'end';
type Align = 'start' | 'end' | 'center';

/** Every placement, in the order the docs list them. */
export const PLACEMENTS: readonly GuiPlacement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'start',
  'start-start',
  'start-end',
  'end',
  'end-start',
  'end-end',
];

/** The placement a value names, or `fallback` when it names none. */
export function toPlacement(value: unknown, fallback: GuiPlacement): GuiPlacement {
  return PLACEMENTS.includes(value as GuiPlacement) ? (value as GuiPlacement) : fallback;
}

function split(placement: GuiPlacement): [Side, Align] {
  const [side, align = 'center'] = placement.split('-') as [Side, Align?];
  return [side, align];
}

function join(side: Side, align: Align): GuiPlacement {
  return (align === 'center' ? side : `${side}-${align}`) as GuiPlacement;
}

const opposite = { top: 'bottom', bottom: 'top', start: 'end', end: 'start' } as const;
const swapped = { start: 'end', end: 'start', center: 'center' } as const;

/** The placement on the other side of the anchor: what CSS calls `flip-block` for `top`. */
export const flipSide = (placement: GuiPlacement): GuiPlacement => {
  const [side, align] = split(placement);
  return join(opposite[side], align);
};

/** The placement with the other alignment: `bottom-start` becomes `bottom-end`. */
export const flipAlign = (placement: GuiPlacement): GuiPlacement => {
  const [side, align] = split(placement);
  return join(side, swapped[align]);
};

const isBlockSide = (side: Side) => side === 'top' || side === 'bottom';

/**
 * The CSS anchor positioning declarations that place a floating element: `position-area` for the
 * placement, the edge it lines up with, the fallbacks that flip it when it does not fit, and a
 * margin of `offset` pixels on the side that faces the anchor (the fallbacks flip the margin and
 * the alignment with it).
 *
 * The areas are logical and resolve against the floating element's own writing mode (`self-*`):
 * the plain logical keywords would follow the containing block's, which is the viewport's for an
 * element in the top layer, so a panel in a right-to-left part of a left-to-right page would not
 * mirror. A missing second keyword spans the whole axis, which centers the element on the anchor.
 */
export function placementStyles(placement: GuiPlacement, offset: number): Record<string, string> {
  const [side, align] = split(placement);
  const block = isBlockSide(side);

  const sideArea = {
    top: 'self-block-start',
    bottom: 'self-block-end',
    start: 'self-inline-start',
    end: 'self-inline-end',
  }[side];
  // The element grows from the aligned edge toward the other one.
  const alignArea =
    align === 'center'
      ? ''
      : `span-self-${block ? 'inline' : 'block'}-${align === 'start' ? 'end' : 'start'}`;
  const area = block ? `${sideArea} ${alignArea}` : `${alignArea} ${sideArea}`;

  const margin = {
    top: 'margin-block-end',
    bottom: 'margin-block-start',
    start: 'margin-inline-end',
    end: 'margin-inline-start',
  }[side];

  // The aligned edge, spelled out: browsers disagree on the default alignment in a spanned area
  // (Firefox lines a right-to-left panel up with the far edge). The fallbacks flip it too.
  const alignment =
    align === 'center' ? {} : { [block ? 'justify-self' : 'align-self']: `self-${align}` };

  return {
    'position-area': area.trim(),
    ...alignment,
    'position-try-fallbacks': block
      ? 'flip-block, flip-inline, flip-block flip-inline'
      : 'flip-inline, flip-block, flip-inline flip-block',
    margin: '0',
    [margin]: `${offset}px`,
  };
}

/** A box in viewport coordinates, as `getBoundingClientRect()` returns it. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionInput {
  anchor: Box;
  /** The floating element's size. */
  floating: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: GuiPlacement;
  /** The gap between the anchor and the floating element, in pixels. */
  offset: number;
  /** Whether the floating element is in a right-to-left context. */
  rtl: boolean;
}

export interface PositionResult {
  x: number;
  y: number;
  /** The placement it ended up in, after flipping. */
  placement: GuiPlacement;
}

function place({ anchor, floating, placement, offset, rtl }: PositionInput) {
  const [side, align] = split(placement);
  let x: number;
  let y: number;

  if (isBlockSide(side)) {
    y = side === 'top' ? anchor.y - floating.height - offset : anchor.y + anchor.height + offset;
    // The start edge is the left one, or the right one in a right-to-left context.
    const leftAligned = (align === 'start') !== rtl;
    if (align === 'center') x = anchor.x + (anchor.width - floating.width) / 2;
    else if (leftAligned) x = anchor.x;
    else x = anchor.x + anchor.width - floating.width;
  } else {
    const left = (side === 'start') !== rtl;
    x = left ? anchor.x - floating.width - offset : anchor.x + anchor.width + offset;
    if (align === 'center') y = anchor.y + (anchor.height - floating.height) / 2;
    else if (align === 'start') y = anchor.y;
    else y = anchor.y + anchor.height - floating.height;
  }
  return { x, y };
}

const fits = ({ x, y }: { x: number; y: number }, { floating, viewport }: PositionInput): boolean =>
  x >= 0 &&
  y >= 0 &&
  x + floating.width <= viewport.width &&
  y + floating.height <= viewport.height;

const clamp = (value: number, size: number, available: number) =>
  size >= available ? 0 : Math.min(Math.max(value, 0), available - size);

/**
 * Places a floating element next to its anchor without CSS anchor positioning, the way the CSS
 * path does: it tries the placement, then the fallbacks `placementStyles` lists, and takes the
 * first one that fits in the viewport (the placement itself when none does). It then shifts the
 * element along both axes to keep it inside the viewport, as `position-area` does by default.
 */
export function computePosition(input: PositionInput): PositionResult {
  const { placement } = input;
  const candidates = [
    placement,
    flipSide(placement),
    flipAlign(placement),
    flipAlign(flipSide(placement)),
  ];
  let chosen = placement;
  let point = place(input);
  for (const candidate of candidates) {
    const candidatePoint = place({ ...input, placement: candidate });
    if (fits(candidatePoint, input)) {
      chosen = candidate;
      point = candidatePoint;
      break;
    }
  }
  return {
    x: clamp(point.x, input.floating.width, input.viewport.width),
    y: clamp(point.y, input.floating.height, input.viewport.height),
    placement: chosen,
  };
}

/** The edge of a floating element its arrow sits on, and where along it: see `arrowPosition`. */
export interface ArrowPosition {
  side: 'top' | 'bottom' | 'left' | 'right';
  /** From the edge's left or top end, in pixels. */
  offset: number;
}

type Edges = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;

/** How close an arrow comes to a corner of its floating element, in pixels: clear of the rounding. */
const ARROW_INSET = 12;

/**
 * Where a floating element's arrow goes, from where it ended up next to its anchor, flipped or
 * not: on the edge that faces the anchor, pointing at the middle of the stretch of the anchor that
 * edge runs along. Lined up with one end of a longer anchor it sits near that corner instead, and
 * it never comes closer than `ARROW_INSET` to a corner. `null` when the element overlaps its
 * anchor (a viewport too small for both): no edge faces it.
 */
export function arrowPosition(anchor: Edges, floating: Edges): ArrowPosition | null {
  const tolerance = 1;
  let side: ArrowPosition['side'];
  if (floating.bottom <= anchor.top + tolerance) side = 'bottom';
  else if (floating.top >= anchor.bottom - tolerance) side = 'top';
  else if (floating.right <= anchor.left + tolerance) side = 'right';
  else if (floating.left >= anchor.right - tolerance) side = 'left';
  else return null;

  const across = side === 'top' || side === 'bottom';
  const [start, end] = across ? [floating.left, floating.right] : [floating.top, floating.bottom];
  const [from, to] = across ? [anchor.left, anchor.right] : [anchor.top, anchor.bottom];

  let target = (Math.max(start, from) + Math.min(end, to)) / 2;
  const startAligned = Math.abs(start - from) <= tolerance;
  const endAligned = Math.abs(end - to) <= tolerance;
  if (startAligned && !endAligned) target = Math.min(target, start + ARROW_INSET);
  if (endAligned && !startAligned) target = Math.max(target, end - ARROW_INSET);

  const min = start + ARROW_INSET;
  const max = end - ARROW_INSET;
  const point = min > max ? (start + end) / 2 : Math.min(Math.max(target, min), max);
  return { side, offset: point - start };
}
