import { describe, expect, it } from 'vitest';
import { searchItems, itemLabel, selectedPills } from './items';

const cities = [
  { code: 'MAD', name: 'Madrid', country: 'Spain' },
  { code: 'LIS', name: 'Lisbon', country: 'Portugal' },
  { code: 'POR', name: 'Porto', country: 'Portugal' },
];

describe('searchItems', () => {
  it('matches values by their text, ignoring case', () => {
    expect(searchItems(['Madrid', 'Lisbon', 'Porto'], 'LI')).toEqual(['Lisbon']);
    expect(searchItems([10, 20, 120], '20')).toEqual([20, 120]);
  });

  it('matches every item with an empty query', () => {
    expect(searchItems(['Madrid', 'Lisbon'], '')).toEqual(['Madrid', 'Lisbon']);
  });

  it('searches objects in their search fields', () => {
    expect(searchItems(cities, 'port', { searchFields: ['name'] })).toEqual([cities[2]]);
  });

  it('searches objects in their label and value fields by default', () => {
    expect(searchItems(cities, 'port', { labelField: 'name', valueField: 'code' })).toEqual([
      cities[2],
    ]);
    expect(searchItems(cities, 'mad', { labelField: 'name', valueField: 'code' })).toEqual([
      cities[0],
    ]);
  });

  it('searches every key without fields', () => {
    expect(searchItems(cities, 'port')).toEqual([cities[1], cities[2]]);
  });

  it('skips keys that hold nothing', () => {
    const items = [{ name: 'Madrid', note: null }, { name: 'Lisbon' }];
    expect(searchItems(items, 'lis')).toEqual([items[1]]);
  });
});

describe('itemLabel', () => {
  it('is a value as it is', () => {
    expect(itemLabel('Madrid')).toBe('Madrid');
    expect(itemLabel(42)).toBe('42');
  });

  it("is an object's label field, label by default", () => {
    expect(itemLabel({ label: 'Madrid', value: 'MAD' })).toBe('Madrid');
    expect(itemLabel(cities[0], 'name')).toBe('Madrid');
  });
});

describe('selectedPills', () => {
  const items = cities.map((city) => ({ template: city, value: city.code }));

  it('labels each selected value, in order', () => {
    expect(selectedPills(['POR', 'MAD'], items, 'name')).toEqual([
      { key: 'POR', label: 'Porto' },
      { key: 'MAD', label: 'Madrid' },
    ]);
  });

  it('looks in the fallback items, then shows the value itself', () => {
    const loaded = [{ template: { code: 'ROM', name: 'Rome' }, value: 'ROM' }];
    expect(selectedPills(['ROM', 'BER'], items, 'name', loaded)).toEqual([
      { key: 'ROM', label: 'Rome' },
      { key: 'BER', label: 'BER' },
    ]);
  });
});
