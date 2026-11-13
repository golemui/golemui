import { describe, expect, it } from 'vitest';
import { _guiCheckboxGroup, _guiRating, _gslCheckboxGroups, _gslRatings } from '../index';
import { getStaticChild, processDx } from './helpers';

type Widget = {
  kind?: string;
  type?: string;
  path?: string;
  label?: string;
  validator?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

describe('DX Pipeline — Checkbox group and rating', () => {
  describe('CheckboxGroup', () => {
    it('expands _guiCheckboxGroup into a checkboxGroup input, labelled from its path', () => {
      const w = getStaticChild(
        processDx(_guiCheckboxGroup('pizzaToppings', { options: ['Cheese', 'Ham'] })),
        0,
      ) as Widget;

      expect(w.kind).toBe('input');
      expect(w.type).toBe('checkboxGroup');
      expect(w.path).toBe('pizzaToppings');
      expect(w.label).toBe('Pizza Toppings');
    });

    it('passes its props, and types its validator as an array', () => {
      const w = getStaticChild(
        processDx(
          _guiCheckboxGroup('toppings', {
            options: [{ name: 'Cheese', id: 'cheese' }],
            labelField: 'name',
            valueField: 'id',
            direction: 'row',
            validator: { required: true, maxItems: 2 },
          }),
        ),
        0,
      ) as Widget;

      expect(w.props).toMatchObject({
        options: [{ name: 'Cheese', id: 'cheese' }],
        labelField: 'name',
        valueField: 'id',
        direction: 'row',
      });
      expect(w.validator).toEqual({ type: 'array', required: true, maxItems: 2 });
    });

    it('applies a GSL override', () => {
      const w = getStaticChild(
        processDx(_guiCheckboxGroup('toppings', { options: ['Cheese'] }), [
          _gslCheckboxGroups({ override: { direction: 'row' } }),
        ]),
        0,
      ) as Widget;

      expect(w.props?.['direction']).toBe('row');
    });
  });

  describe('Rating', () => {
    it('expands _guiRating into a rating input', () => {
      const w = getStaticChild(processDx(_guiRating('service')), 0) as Widget;

      expect(w.kind).toBe('input');
      expect(w.type).toBe('rating');
      expect(w.path).toBe('service');
      expect(w.label).toBe('Service');
    });

    it('types its validator as an integer, whose maximum is its number of stars', () => {
      const w = getStaticChild(
        processDx(_guiRating('service', { hint: 'How was it?', validator: { maximum: 10 } })),
        0,
      ) as Widget;

      expect(w.props).toMatchObject({ hint: 'How was it?' });
      expect(w.validator).toEqual({ type: 'integer', maximum: 10 });
    });

    it('applies a GSL override', () => {
      const w = getStaticChild(
        processDx(_guiRating('service'), [_gslRatings({ override: { hint: 'Be honest' } })]),
        0,
      ) as Widget;

      expect(w.props?.['hint']).toBe('Be honest');
    });
  });
});
