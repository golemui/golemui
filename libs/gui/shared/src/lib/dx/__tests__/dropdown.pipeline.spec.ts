import { describe, expect, it } from 'vitest';
import { _guiDropdown, _gslDropdowns, _gslDropdownByUid } from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

const sampleItems = [
  { template: 'Spain', value: 'es' },
  { template: 'Germany', value: 'de' },
  { template: 'France', value: 'fr' },
];

describe('DX Pipeline — Dropdown', () => {
  it('expands _guiDropdown into a dropdown input', () => {
    const result = processDx(
      _guiDropdown('country', { items: sampleItems, placeholder: 'Select...' }),
    );
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      path?: string;
      props?: { items?: typeof sampleItems; placeholder?: string };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('dropdown');
    expect(w.path).toBe('country');
    expect(w.props?.items).toEqual(sampleItems);
    expect(w.props?.placeholder).toBe('Select...');
  });

  it('auto-generates label from path', () => {
    const result = processDx(_guiDropdown('homeCountry', { items: sampleItems }));
    const w = getStaticChild(result, 0) as { label?: string };

    expect(w.label).toBe('Home Country');
  });

  it('auto-generates placeholder from path', () => {
    const result = processDx(_guiDropdown('homeCountry', { items: sampleItems }));
    const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

    expect(w.props?.placeholder).toBe('homeCountry');
  });

  it('passes items array through to widget props', () => {
    const result = processDx(_guiDropdown('venue', { items: sampleItems }));
    const w = getStaticChild(result, 0) as {
      props?: { items?: typeof sampleItems };
    };

    expect(w.props?.items).toEqual(sampleItems);
    expect(w.props?.items).toHaveLength(3);
  });

  it('passes searchFields, height, and itemHeight through', () => {
    const result = processDx(
      _guiDropdown('country', {
        items: sampleItems,
        searchFields: ['template'],
        height: 300,
        itemHeight: 40,
      }),
    );
    const w = getStaticChild(result, 0) as {
      props?: { searchFields?: string[]; height?: number; itemHeight?: number };
    };

    expect(w.props?.searchFields).toEqual(['template']);
    expect(w.props?.height).toBe(300);
    expect(w.props?.itemHeight).toBe(40);
  });

  it('passes labelField and valueField through', () => {
    const result = processDx(
      _guiDropdown('country', {
        items: sampleItems,
        labelField: 'name',
        valueField: 'code',
      }),
    );
    const w = getStaticChild(result, 0) as {
      props?: { labelField?: string; valueField?: string };
    };

    expect(w.props?.labelField).toBe('name');
    expect(w.props?.valueField).toBe('code');
  });

  it('passes inputDebounce through', () => {
    const result = processDx(_guiDropdown('country', { items: sampleItems, inputDebounce: 300 }));
    const w = getStaticChild(result, 0) as {
      props?: { inputDebounce?: number };
    };

    expect(w.props?.inputDebounce).toBe(300);
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(_guiDropdown('country', { items: sampleItems }), [
      _gslDropdowns({ override: { hint: 'Pick one' } }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { hint?: string } };

    expect(w.props?.hint).toBe('Pick one');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(_guiDropdown('country', { items: sampleItems, uid: 'country-dd' }), [
      _gslDropdownByUid('country-dd', { override: { hint: 'By-id hint' } }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { hint?: string } };

    expect(w.props?.hint).toBe('By-id hint');
  });

  it('suppresses auto-label via GSL config', () => {
    const result = processDx(_guiDropdown('homeCountry', { items: sampleItems }), [
      _gslDropdowns({ suppressAutomaticLabels: true }),
    ]);
    const w = getStaticChild(result, 0) as { label?: string };

    expect(w.label).toBeUndefined();
  });

  it('conditionally sets readonly', () => {
    const result = processDx(_guiDropdown('country', { items: sampleItems, readonly: true }));
    const w = getStaticChild(result, 0) as { readonly?: boolean };

    expect(w.readonly).toBe(true);
  });

  it('conditionally sets disabled', () => {
    const result = processDx(_guiDropdown('country', { items: sampleItems, disabled: true }));
    const w = getStaticChild(result, 0) as { disabled?: boolean };

    expect(w.disabled).toBe(true);
  });

  it('supports dynamic callback', () => {
    const result = processDx(
      _guiDropdown('country', () => ({
        items: [{ template: 'Dynamic', value: 'dyn' }],
      })),
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as {
      type?: string;
      props?: { items?: Array<{ template: string; value: string }> };
    };

    expect(w.type).toBe('dropdown');
    expect(w.props?.items).toEqual([{ template: 'Dynamic', value: 'dyn' }]);
  });
});
