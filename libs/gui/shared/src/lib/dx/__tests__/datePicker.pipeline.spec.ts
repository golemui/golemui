import { describe, expect, it } from 'vitest';
import { _guiDatePicker, _gslDatePickers, _gslDatePickerByUid } from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — DatePicker', () => {
  it('expands _guiDatePicker into a datePicker input', () => {
    const result = processDx(_guiDatePicker('birthDate', { hint: 'Select date' }));
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      path?: string;
      props?: { hint?: string };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('datePicker');
    expect(w.path).toBe('birthDate');
    expect(w.props?.hint).toBe('Select date');
  });

  it('auto-generates label from path', () => {
    const result = processDx(_guiDatePicker('birthDate'));
    const w = getStaticChild(result, 0) as { label?: string };

    expect(w.label).toBe('Birth Date');
  });

  it('auto-generates placeholder from path', () => {
    const result = processDx(_guiDatePicker('birthDate'));
    const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

    expect(w.props?.placeholder).toBe('birthDate');
  });

  it('suppresses auto-label via GSL config', () => {
    const result = processDx(_guiDatePicker('birthDate'), [
      _gslDatePickers({ suppressAutomaticLabels: true }),
    ]);
    const w = getStaticChild(result, 0) as { label?: string };

    expect(w.label).toBeUndefined();
  });

  it('suppresses auto-placeholder via GSL config', () => {
    const result = processDx(_guiDatePicker('birthDate'), [
      _gslDatePickers({ suppressAutomaticPlaceholders: true }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

    expect(w.props?.placeholder).toBeUndefined();
  });

  it('passes icon and date format props through', () => {
    const result = processDx(
      _guiDatePicker('eventDate', {
        icon: 'calendar',
        dayFormat: '2-digit',
        monthFormat: 'long',
      }),
    );
    const w = getStaticChild(result, 0) as {
      props?: { icon?: string; dayFormat?: string; monthFormat?: string };
    };

    expect(w.props?.icon).toBe('calendar');
    expect(w.props?.dayFormat).toBe('2-digit');
    expect(w.props?.monthFormat).toBe('long');
  });

  it('applies GSL decorator override', () => {
    const result = processDx(_guiDatePicker('date', { icon: 'original' }), [
      _gslDatePickers({ override: { icon: 'overridden' } }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { icon?: string } };

    expect(w.props?.icon).toBe('overridden');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(_guiDatePicker('date', { uid: 'my-date', icon: 'original' }), [
      _gslDatePickerByUid('my-date', { override: { icon: 'by-id-override' } }),
    ]);
    const w = getStaticChild(result, 0) as { props?: { icon?: string } };

    expect(w.props?.icon).toBe('by-id-override');
  });

  it('conditionally sets readonly', () => {
    const result = processDx(_guiDatePicker('date', { readonly: true }));
    const w = getStaticChild(result, 0) as { readonly?: boolean };

    expect(w.readonly).toBe(true);
  });

  it('conditionally sets disabled', () => {
    const result = processDx(_guiDatePicker('date', { disabled: true }));
    const w = getStaticChild(result, 0) as { disabled?: boolean };

    expect(w.disabled).toBe(true);
  });

  it('supports dynamic callback', () => {
    const result = processDx(_guiDatePicker('date', () => ({ hint: 'Dynamic hint' })));
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as {
      type?: string;
      props?: { hint?: string };
    };

    expect(w.type).toBe('datePicker');
    expect(w.props?.hint).toBe('Dynamic hint');
  });
});
