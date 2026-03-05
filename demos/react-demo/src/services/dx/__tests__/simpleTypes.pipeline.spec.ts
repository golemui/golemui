import { describe, expect, it } from 'vitest';
import {
  _guiPassword,
  _guiCheckbox,
  _guiDateInput,
  _guiCurrency,
  _guiRangeCalendar,
  _gslPassword,
  _gslCheckbox,
  _gslDateInput,
  _gslCurrency,
  _gslRangeCalendar,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — Simple Types (Phase 6.1)', () => {
  describe('Password', () => {
    it('expands _guiPassword into a password input', () => {
      const result = processDx(_guiPassword('secret'));
      const w = getStaticChild(result, 0) as { kind?: string; type?: string; path?: string };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('password');
      expect(w.path).toBe('secret');
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiPassword('userPassword'));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('User Password');
    });

    it('auto-generates placeholder from path', () => {
      const result = processDx(_guiPassword('userPassword'));
      const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

      expect(w.props?.placeholder).toBe('userPassword');
    });

    it('passes custom props through', () => {
      const result = processDx(_guiPassword('pw', { hint: 'Min 8 chars' }));
      const w = getStaticChild(result, 0) as { props?: { hint?: string } };

      expect(w.props?.hint).toBe('Min 8 chars');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiPassword('pw'),
        [_gslPassword({ decorator: { label: 'Secret code' } })],
      );
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Secret code');
    });

    it('supports dynamic callback', () => {
      const result = processDx(_guiPassword('pw', () => ({ label: 'Dynamic' })));
      const raw = getRawChild(result, 0);
      const w = resolveDynamic(raw) as { type?: string; label?: string };

      expect(w.type).toBe('password');
      expect(w.label).toBe('Dynamic');
    });
  });

  describe('Checkbox', () => {
    it('expands _guiCheckbox into a checkbox input', () => {
      const result = processDx(_guiCheckbox('agree'));
      const w = getStaticChild(result, 0) as { kind?: string; type?: string; path?: string };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('checkbox');
      expect(w.path).toBe('agree');
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiCheckbox('agreeToTerms'));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Agree To Terms');
    });

    it('does not auto-generate placeholder', () => {
      const result = processDx(_guiCheckbox('agree'));
      const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

      expect(w.props?.placeholder).toBeUndefined();
    });

    it('passes checkboxPosition prop', () => {
      const result = processDx(_guiCheckbox('agree', { checkboxPosition: 'right' }));
      const w = getStaticChild(result, 0) as { props?: { checkboxPosition?: string } };

      expect(w.props?.checkboxPosition).toBe('right');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiCheckbox('agree'),
        [_gslCheckbox({ decorator: { label: 'I agree' } })],
      );
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('I agree');
    });
  });

  describe('DateInput', () => {
    it('expands _guiDateInput into a dateInput widget', () => {
      const result = processDx(_guiDateInput('birthday'));
      const w = getStaticChild(result, 0) as { kind?: string; type?: string; path?: string };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('dateInput');
      expect(w.path).toBe('birthday');
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiDateInput('startDate'));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Start Date');
    });

    it('passes icon prop', () => {
      const result = processDx(_guiDateInput('date', { icon: 'calendar-icon' }));
      const w = getStaticChild(result, 0) as { props?: { icon?: string } };

      expect(w.props?.icon).toBe('calendar-icon');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiDateInput('date'),
        [_gslDateInput({ decorator: { hint: 'YYYY-MM-DD' } })],
      );
      const w = getStaticChild(result, 0) as { props?: { hint?: string } };

      expect(w.props?.hint).toBe('YYYY-MM-DD');
    });
  });

  describe('Currency', () => {
    it('expands _guiCurrency into a currency input', () => {
      const result = processDx(_guiCurrency('salary'));
      const w = getStaticChild(result, 0) as { kind?: string; type?: string; path?: string };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('currency');
      expect(w.path).toBe('salary');
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiCurrency('monthlyIncome'));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Monthly Income');
    });

    it('auto-generates placeholder from path', () => {
      const result = processDx(_guiCurrency('monthlyIncome'));
      const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

      expect(w.props?.placeholder).toBe('monthlyIncome');
    });

    it('passes currency-specific props', () => {
      const result = processDx(_guiCurrency('price', { currency: 'EUR', step: 0.01 }));
      const w = getStaticChild(result, 0) as { props?: { currency?: string; step?: number } };

      expect(w.props?.currency).toBe('EUR');
      expect(w.props?.step).toBe(0.01);
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiCurrency('amount'),
        [_gslCurrency({ decorator: { currency: 'GBP' } })],
      );
      const w = getStaticChild(result, 0) as { props?: { currency?: string } };

      expect(w.props?.currency).toBe('GBP');
    });

    it('supports dynamic callback', () => {
      const result = processDx(_guiCurrency('price', () => ({ currency: 'JPY' })));
      const raw = getRawChild(result, 0);
      const w = resolveDynamic(raw) as { type?: string; props?: { currency?: string } };

      expect(w.type).toBe('currency');
      expect(w.props?.currency).toBe('JPY');
    });
  });

  describe('RangeCalendar', () => {
    it('expands _guiRangeCalendar into a rangeCalendar input', () => {
      const result = processDx(_guiRangeCalendar('vacation'));
      const w = getStaticChild(result, 0) as { kind?: string; type?: string; path?: string };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('rangeCalendar');
      expect(w.path).toBe('vacation');
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiRangeCalendar('dateRange'));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Date Range');
    });

    it('passes range-specific props', () => {
      const result = processDx(
        _guiRangeCalendar('range', {
          numberOfMonths: 2,
          minDate: '2026-01-01',
          maxDate: '2026-12-31',
        }),
      );
      const w = getStaticChild(result, 0) as {
        props?: { numberOfMonths?: number; minDate?: string; maxDate?: string };
      };

      expect(w.props?.numberOfMonths).toBe(2);
      expect(w.props?.minDate).toBe('2026-01-01');
      expect(w.props?.maxDate).toBe('2026-12-31');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiRangeCalendar('range'),
        [_gslRangeCalendar({ decorator: { numberOfMonths: 3 } })],
      );
      const w = getStaticChild(result, 0) as { props?: { numberOfMonths?: number } };

      expect(w.props?.numberOfMonths).toBe(3);
    });
  });
});
