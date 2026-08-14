import { describe, expect, it } from 'vitest';
import {
  _guiMultiDropdown,
  _gslMultiDropdowns,
  _gslMultiDropdownByUid,
  _guiMultiList,
  _gslMultiLists,
  _gslMultiListByUid,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

const sampleItems = [
  { template: 'Spain', value: 'es' },
  { template: 'Germany', value: 'de' },
  { template: 'France', value: 'fr' },
];

describe('DX Pipeline — MultiDropdown', () => {
  it('expands _guiMultiDropdown into a multiDropdown input', () => {
    const result = processDx(
      _guiMultiDropdown('countries', { items: sampleItems, placeholder: 'Select...' }),
    );
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      path?: string;
      props?: { items?: typeof sampleItems; placeholder?: string };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('multiDropdown');
    expect(w.path).toBe('countries');
    expect(w.props?.items).toEqual(sampleItems);
    expect(w.props?.placeholder).toBe('Select...');
  });

  it('auto-generates label and placeholder from path', () => {
    const result = processDx(_guiMultiDropdown('visitedCountries', { items: sampleItems }));
    const w = getStaticChild(result, 0) as { label?: string; props?: { placeholder?: string } };

    expect(w.label).toBe('Visited Countries');
    expect(w.props?.placeholder).toBe('visitedCountries');
  });

  it('passes removeAriaLabel and removeIcon through', () => {
    const result = processDx(
      _guiMultiDropdown('countries', {
        items: sampleItems,
        removeAriaLabel: 'Remove country',
        removeIcon: 'icon-close',
      }),
    );
    const w = getStaticChild(result, 0) as {
      props?: { removeAriaLabel?: string; removeIcon?: string };
    };

    expect(w.props?.removeAriaLabel).toBe('Remove country');
    expect(w.props?.removeIcon).toBe('icon-close');
  });

  it('passes defaultValue array through', () => {
    const result = processDx(
      _guiMultiDropdown('countries', { items: sampleItems, defaultValue: ['es', 'fr'] }),
    );
    const w = getStaticChild(result, 0) as { defaultValue?: string[] };

    expect(w.defaultValue).toEqual(['es', 'fr']);
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(_guiMultiDropdown('countries', { items: sampleItems }), [
      _gslMultiDropdowns({ override: { hint: 'Pick several' } }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { hint?: string } };

    expect(w.props?.hint).toBe('Pick several');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(
      _guiMultiDropdown('countries', { items: sampleItems, uid: 'countries-mdd' }),
      [_gslMultiDropdownByUid('countries-mdd', { override: { hint: 'By-id hint' } })],
    );
    const w = getStaticChild(result, 0) as { props?: { hint?: string } };

    expect(w.props?.hint).toBe('By-id hint');
  });

  it('supports dynamic callback', () => {
    const result = processDx(
      _guiMultiDropdown('countries', () => ({
        items: [{ template: 'Dynamic', value: 'dyn' }],
      })),
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as {
      type?: string;
      props?: { items?: Array<{ template: string; value: string }> };
    };

    expect(w.type).toBe('multiDropdown');
    expect(w.props?.items).toEqual([{ template: 'Dynamic', value: 'dyn' }]);
  });
});

describe('DX Pipeline — MultiList', () => {
  it('expands _guiMultiList into a multiList input', () => {
    const result = processDx(_guiMultiList('toppings', { items: sampleItems }));
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      path?: string;
      props?: { items?: typeof sampleItems };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('multiList');
    expect(w.path).toBe('toppings');
    expect(w.props?.items).toEqual(sampleItems);
  });

  it('auto-generates label from path', () => {
    const result = processDx(_guiMultiList('pizzaToppings', { items: sampleItems }));
    const w = getStaticChild(result, 0) as { label?: string };

    expect(w.label).toBe('Pizza Toppings');
  });

  it('applies GSL broad and byId selector overrides', () => {
    const result = processDx(_guiMultiList('toppings', { items: sampleItems, uid: 'top-ml' }), [
      _gslMultiLists({ override: { hint: 'Pick several' } }),
      _gslMultiListByUid('top-ml', { override: { disabled: true } }),
    ]);
    const w = getStaticChild(result, 0) as { disabled?: boolean; props?: { hint?: string } };

    expect(w.props?.hint).toBe('Pick several');
    expect(w.disabled).toBe(true);
  });

  it('supports dynamic callback', () => {
    const result = processDx(
      _guiMultiList('toppings', () => ({
        items: [{ template: 'Dynamic', value: 'dyn' }],
      })),
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as {
      type?: string;
      props?: { items?: Array<{ template: string; value: string }> };
    };

    expect(w.type).toBe('multiList');
    expect(w.props?.items).toEqual([{ template: 'Dynamic', value: 'dyn' }]);
  });
});
