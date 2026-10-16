import { describe, expect, it } from 'vitest';
import {
  PLACEMENTS,
  computePosition,
  flipAlign,
  flipSide,
  placementStyles,
  toPlacement,
  type GuiPlacement,
  type PositionInput,
} from './placement';

describe('toPlacement', () => {
  it('takes any of the twelve placements', () => {
    expect(PLACEMENTS).toHaveLength(12);
    for (const placement of PLACEMENTS) expect(toPlacement(placement, 'top')).toBe(placement);
  });

  it('falls back on anything else', () => {
    expect(toPlacement('left', 'bottom-start')).toBe('bottom-start');
    expect(toPlacement(null, 'top')).toBe('top');
  });
});

describe('flipping', () => {
  it('flips the side and keeps the alignment', () => {
    expect(flipSide('bottom-start')).toBe('top-start');
    expect(flipSide('top')).toBe('bottom');
    expect(flipSide('start-end')).toBe('end-end');
  });

  it('flips the alignment and keeps the side', () => {
    expect(flipAlign('bottom-start')).toBe('bottom-end');
    expect(flipAlign('end-end')).toBe('end-start');
    expect(flipAlign('top')).toBe('top');
  });
});

describe('placementStyles', () => {
  const cases: [GuiPlacement, string, string][] = [
    ['top', 'self-block-start', 'margin-block-end'],
    ['top-start', 'self-block-start span-self-inline-end', 'margin-block-end'],
    ['top-end', 'self-block-start span-self-inline-start', 'margin-block-end'],
    ['bottom', 'self-block-end', 'margin-block-start'],
    ['bottom-start', 'self-block-end span-self-inline-end', 'margin-block-start'],
    ['bottom-end', 'self-block-end span-self-inline-start', 'margin-block-start'],
    ['start', 'self-inline-start', 'margin-inline-end'],
    ['start-start', 'span-self-block-end self-inline-start', 'margin-inline-end'],
    ['start-end', 'span-self-block-start self-inline-start', 'margin-inline-end'],
    ['end', 'self-inline-end', 'margin-inline-start'],
    ['end-start', 'span-self-block-end self-inline-end', 'margin-inline-start'],
    ['end-end', 'span-self-block-start self-inline-end', 'margin-inline-start'],
  ];

  it.each(cases)('maps %s to position-area %s, with the gap on %s', (placement, area, margin) => {
    const styles = placementStyles(placement, 6);
    expect(styles['position-area']).toBe(area);
    expect(styles[margin]).toBe('6px');
  });

  it('spells out the edge it lines up with, along the other axis', () => {
    expect(placementStyles('bottom-start', 4)['justify-self']).toBe('self-start');
    expect(placementStyles('top-end', 4)['justify-self']).toBe('self-end');
    expect(placementStyles('end-start', 4)['align-self']).toBe('self-start');
    expect(placementStyles('bottom', 4)).not.toHaveProperty('justify-self');
  });

  it('resets every margin before setting the one facing the anchor', () => {
    const keys = Object.keys(placementStyles('bottom-start', 4));
    expect(keys.indexOf('margin')).toBeLessThan(keys.indexOf('margin-block-start'));
  });

  it('flips along the side first', () => {
    expect(placementStyles('bottom', 4)['position-try-fallbacks']).toBe(
      'flip-block, flip-inline, flip-block flip-inline',
    );
    expect(placementStyles('end', 4)['position-try-fallbacks']).toBe(
      'flip-inline, flip-block, flip-inline flip-block',
    );
  });
});

describe('computePosition', () => {
  // A 100×20 anchor in the middle of a 1000×800 viewport, and a 200×50 floating element.
  const input = (placement: GuiPlacement, overrides: Partial<PositionInput> = {}) =>
    computePosition({
      anchor: { x: 400, y: 400, width: 100, height: 20 },
      floating: { width: 200, height: 50 },
      viewport: { width: 1000, height: 800 },
      placement,
      offset: 4,
      rtl: false,
      ...overrides,
    });

  it.each<[GuiPlacement, number, number]>([
    ['top', 350, 346],
    ['top-start', 400, 346],
    ['top-end', 300, 346],
    ['bottom', 350, 424],
    ['bottom-start', 400, 424],
    ['bottom-end', 300, 424],
    ['start', 196, 385],
    ['start-start', 196, 400],
    ['start-end', 196, 370],
    ['end', 504, 385],
    ['end-start', 504, 400],
    ['end-end', 504, 370],
  ])('places %s at (%i, %i)', (placement, x, y) => {
    expect(input(placement)).toEqual({ x, y, placement });
  });

  it('mirrors start and end in a right-to-left context', () => {
    expect(input('bottom-start', { rtl: true })).toMatchObject({ x: 300, y: 424 });
    expect(input('bottom-end', { rtl: true })).toMatchObject({ x: 400, y: 424 });
    expect(input('start', { rtl: true })).toMatchObject({ x: 504, y: 385 });
    expect(input('end', { rtl: true })).toMatchObject({ x: 196, y: 385 });
  });

  it('flips to the other side when its side has no room', () => {
    const anchor = { x: 400, y: 760, width: 100, height: 20 };
    expect(input('bottom-start', { anchor })).toEqual({ x: 400, y: 706, placement: 'top-start' });
  });

  it('flips the alignment when the aligned edge has no room', () => {
    const anchor = { x: 900, y: 400, width: 80, height: 20 };
    expect(input('bottom-start', { anchor })).toEqual({ x: 780, y: 424, placement: 'bottom-end' });
  });

  it('flips both when a corner has no room', () => {
    const anchor = { x: 900, y: 760, width: 80, height: 20 };
    expect(input('bottom-start', { anchor })).toEqual({ x: 780, y: 706, placement: 'top-end' });
  });

  it('keeps the placement and shifts into the viewport when nothing fits', () => {
    const anchor = { x: 10, y: 400, width: 20, height: 20 };
    expect(input('bottom', { anchor })).toEqual({ x: 0, y: 424, placement: 'bottom' });
  });

  it('pins an element larger than the viewport to its start', () => {
    const result = input('bottom', { floating: { width: 1200, height: 50 } });
    expect(result.x).toBe(0);
  });
});
