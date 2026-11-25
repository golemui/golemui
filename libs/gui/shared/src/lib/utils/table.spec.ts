import { describe, expect, it } from 'vitest';
import { tableCellClass, tableCellText } from './table';

describe('table helpers', () => {
  it('shows text cells, booleans and numbers in a text column as they are', () => {
    expect(tableCellText('A-1042', {}, 'en-US')).toBe('A-1042');
    expect(tableCellText(1280.5, { type: 'text' }, 'en-US')).toBe('1280.5');
    expect(tableCellText(true, {}, 'en-US')).toBe('true');
  });

  it('shows an empty cell for null and for a missing value', () => {
    expect(tableCellText(null, { type: 'number' }, 'en-US')).toBe('');
    expect(tableCellText(undefined, {}, 'en-US')).toBe('');
  });

  it('formats a number column in the form language, numeric strings included', () => {
    expect(tableCellText(1280.5, { type: 'number' }, 'en-US')).toBe('1,280.5');
    expect(tableCellText(1280.5, { type: 'number' }, 'de-DE')).toBe('1.280,5');
    expect(tableCellText('310', { type: 'number' }, 'en-US')).toBe('310');
  });

  it('formats a date column in the form language, a bare date on its own day', () => {
    expect(tableCellText('2026-11-20', { type: 'date' }, 'en-US')).toBe('Nov 20, 2026');
    expect(tableCellText('2026-01-01', { type: 'date' }, 'es-ES')).toBe('1 ene 2026');
  });

  it('shows a value that does not parse as it is', () => {
    expect(tableCellText('soon', { type: 'date' }, 'en-US')).toBe('soon');
    expect(tableCellText('n/a', { type: 'number' }, 'en-US')).toBe('n/a');
    expect(tableCellText(false, { type: 'number' }, 'en-US')).toBe('false');
  });

  it('falls back to English for a language Intl does not know, and for none', () => {
    expect(tableCellText(1280.5, { type: 'number' }, 'not a locale')).toBe('1,280.5');
    expect(tableCellText(1280.5, { type: 'number' }, undefined)).toBe('1,280.5');
  });

  it('aligns by the column, and a number column at the end unless it says otherwise', () => {
    expect(tableCellClass({})).toBeUndefined();
    expect(tableCellClass({ align: 'center' })).toBe('gui-table__cell--center');
    expect(tableCellClass({ type: 'number' })).toBe('gui-table__cell--end');
    expect(tableCellClass({ type: 'number', align: 'start' })).toBeUndefined();
  });
});
