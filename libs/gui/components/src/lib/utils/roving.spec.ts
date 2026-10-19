import { describe, expect, it } from 'vitest';
import { rovingStep, typeaheadMatch } from './roving';

describe('rovingStep', () => {
  const horizontal = { orientation: 'horizontal' as const };
  const vertical = { orientation: 'vertical' as const };

  it('steps with the arrows of its orientation, and ignores the others', () => {
    expect(rovingStep('ArrowRight', 1, 4, horizontal)).toBe(2);
    expect(rovingStep('ArrowLeft', 1, 4, horizontal)).toBe(0);
    expect(rovingStep('ArrowDown', 1, 4, horizontal)).toBe(-1);
    expect(rovingStep('ArrowDown', 1, 4, vertical)).toBe(2);
    expect(rovingStep('ArrowUp', 1, 4, vertical)).toBe(0);
    expect(rovingStep('ArrowRight', 1, 4, vertical)).toBe(-1);
    expect(rovingStep('a', 1, 4, vertical)).toBe(-1);
  });

  it('swaps the horizontal arrows in right to left', () => {
    expect(rovingStep('ArrowRight', 1, 4, { ...horizontal, rtl: true })).toBe(0);
    expect(rovingStep('ArrowLeft', 1, 4, { ...horizontal, rtl: true })).toBe(2);
  });

  it('goes to the first and last items with Home and End', () => {
    expect(rovingStep('Home', 2, 4, vertical)).toBe(0);
    expect(rovingStep('End', 1, 4, vertical)).toBe(3);
  });

  it('stops at the ends, or goes round them with wrap', () => {
    expect(rovingStep('ArrowDown', 3, 4, vertical)).toBe(-1);
    expect(rovingStep('ArrowUp', 0, 4, vertical)).toBe(-1);
    expect(rovingStep('ArrowDown', 3, 4, { ...vertical, wrap: true })).toBe(0);
    expect(rovingStep('ArrowUp', 0, 4, { ...vertical, wrap: true })).toBe(3);
  });

  it('skips disabled items, at the ends too', () => {
    const isDisabled = (index: number) => index === 1 || index === 3;
    expect(rovingStep('ArrowDown', 0, 4, { ...vertical, isDisabled })).toBe(2);
    expect(rovingStep('End', 0, 4, { ...vertical, isDisabled })).toBe(2);
    expect(rovingStep('ArrowDown', 2, 4, { ...vertical, isDisabled, wrap: true })).toBe(0);
  });

  it('moves nowhere when the only enabled item already has focus', () => {
    const isDisabled = (index: number) => index !== 1;
    expect(rovingStep('ArrowDown', 1, 3, { ...vertical, isDisabled, wrap: true })).toBe(-1);
  });
});

describe('typeaheadMatch', () => {
  const labels = ['Edit', 'Duplicate', 'Delete', 'Download', 'Archive'];

  it('finds the next item that starts with the query, round the end', () => {
    expect(typeaheadMatch('d', labels, 0)).toBe(1);
    expect(typeaheadMatch('d', labels, 3)).toBe(1);
    expect(typeaheadMatch('a', labels, 0)).toBe(4);
    expect(typeaheadMatch('E', labels, 4)).toBe(0);
  });

  it('narrows as the query grows, staying on the item that still matches', () => {
    expect(typeaheadMatch('de', labels, 1)).toBe(2);
    expect(typeaheadMatch('dow', labels, 2)).toBe(3);
    expect(typeaheadMatch('du', labels, 1)).toBe(1);
  });

  it('cycles through the items of one letter typed again', () => {
    expect(typeaheadMatch('dd', labels, 1)).toBe(2);
    expect(typeaheadMatch('ddd', labels, 2)).toBe(3);
  });

  it('skips disabled items and finds nothing without a match', () => {
    expect(typeaheadMatch('d', labels, 0, (index) => index === 1)).toBe(2);
    expect(typeaheadMatch('z', labels, 0)).toBe(-1);
  });
});
