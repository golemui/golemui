import { describe, expect, it } from 'vitest';
import {
  _guiSelect,
  _guiRadiogroup,
  _gslSelect,
  _gslRadiogroup,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

const sampleOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

describe('DX Pipeline — Options Types (Phase 6.2)', () => {
  describe('Select', () => {
    it('expands _guiSelect into a select input with options', () => {
      const result = processDx(_guiSelect('country', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as {
        kind?: string;
        type?: string;
        path?: string;
        props?: { options?: typeof sampleOptions };
      };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('select');
      expect(w.path).toBe('country');
      expect(w.props?.options).toEqual(sampleOptions);
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiSelect('favoriteColor', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Favorite Color');
    });

    it('auto-generates placeholder from path', () => {
      const result = processDx(_guiSelect('favoriteColor', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

      expect(w.props?.placeholder).toBe('favoriteColor');
    });

    it('passes options array through to widget props', () => {
      const customOptions = [
        { label: 'US', value: 'us' },
        { label: 'Spain', value: 'es' },
      ];
      const result = processDx(_guiSelect('country', { options: customOptions }));
      const w = getStaticChild(result, 0) as { props?: { options?: typeof customOptions } };

      expect(w.props?.options).toEqual(customOptions);
      expect(w.props?.options).toHaveLength(2);
    });

    it('passes labelField and valueField through', () => {
      const result = processDx(_guiSelect('country', {
        options: sampleOptions,
        labelField: 'name',
        valueField: 'code',
      }));
      const w = getStaticChild(result, 0) as {
        props?: { labelField?: string; valueField?: string };
      };

      expect(w.props?.labelField).toBe('name');
      expect(w.props?.valueField).toBe('code');
    });

    it('passes custom props alongside options', () => {
      const result = processDx(_guiSelect('country', {
        options: sampleOptions,
        icon: 'globe',
        placeholder: 'Choose a country...',
      }));
      const w = getStaticChild(result, 0) as {
        props?: { icon?: string; placeholder?: string };
      };

      expect(w.props?.icon).toBe('globe');
      expect(w.props?.placeholder).toBe('Choose a country...');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiSelect('country', { options: sampleOptions }),
        [_gslSelect({ decorator: { hint: 'Pick one' } })],
      );
      const w = getStaticChild(result, 0) as { props?: { hint?: string } };

      expect(w.props?.hint).toBe('Pick one');
    });

    it('supports dynamic callback', () => {
      const result = processDx(
        _guiSelect('country', () => ({
          options: [{ label: 'Dynamic', value: 'dyn' }],
        })),
      );
      const raw = getRawChild(result, 0);
      const w = resolveDynamic(raw) as {
        type?: string;
        props?: { options?: Array<{ label: string; value: string }> };
      };

      expect(w.type).toBe('select');
      expect(w.props?.options).toEqual([{ label: 'Dynamic', value: 'dyn' }]);
    });
  });

  describe('Radiogroup', () => {
    it('expands _guiRadiogroup into a radiogroup input with options', () => {
      const result = processDx(_guiRadiogroup('priority', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as {
        kind?: string;
        type?: string;
        path?: string;
        props?: { options?: typeof sampleOptions };
      };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('radiogroup');
      expect(w.path).toBe('priority');
      expect(w.props?.options).toEqual(sampleOptions);
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiRadiogroup('shippingMethod', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Shipping Method');
    });

    it('does NOT auto-generate placeholder', () => {
      const result = processDx(_guiRadiogroup('priority', { options: sampleOptions }));
      const w = getStaticChild(result, 0) as { props?: { placeholder?: string } };

      expect(w.props?.placeholder).toBeUndefined();
    });

    it('passes options array through to widget props', () => {
      const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ];
      const result = processDx(_guiRadiogroup('priority', { options: priorityOptions }));
      const w = getStaticChild(result, 0) as { props?: { options?: typeof priorityOptions } };

      expect(w.props?.options).toEqual(priorityOptions);
      expect(w.props?.options).toHaveLength(3);
    });

    it('passes labelField and valueField through', () => {
      const result = processDx(_guiRadiogroup('size', {
        options: sampleOptions,
        labelField: 'displayName',
        valueField: 'id',
      }));
      const w = getStaticChild(result, 0) as {
        props?: { labelField?: string; valueField?: string };
      };

      expect(w.props?.labelField).toBe('displayName');
      expect(w.props?.valueField).toBe('id');
    });

    it('applies GSL decorator override', () => {
      const result = processDx(
        _guiRadiogroup('priority', { options: sampleOptions }),
        [_gslRadiogroup({ decorator: { hint: 'Choose carefully' } })],
      );
      const w = getStaticChild(result, 0) as { props?: { hint?: string } };

      expect(w.props?.hint).toBe('Choose carefully');
    });

    it('supports dynamic callback', () => {
      const result = processDx(
        _guiRadiogroup('level', () => ({
          options: [{ label: 'Easy', value: 1 }, { label: 'Hard', value: 2 }],
        })),
      );
      const raw = getRawChild(result, 0);
      const w = resolveDynamic(raw) as {
        type?: string;
        props?: { options?: Array<{ label: string; value: number }> };
      };

      expect(w.type).toBe('radiogroup');
      expect(w.props?.options).toHaveLength(2);
    });
  });
});
