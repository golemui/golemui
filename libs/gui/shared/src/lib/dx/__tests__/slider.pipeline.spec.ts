import { describe, expect, it } from 'vitest';
import { _guiRangeSlider, _guiSlider, _gslRangeSliders, _gslSliders } from '../index';
import { getStaticChild, processDx } from './helpers';

type Widget = {
  kind?: string;
  type?: string;
  path?: string;
  label?: string;
  validator?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

describe('DX Pipeline — Sliders', () => {
  describe('Slider', () => {
    it('expands _guiSlider into a slider input, labelled from its path', () => {
      const w = getStaticChild(processDx(_guiSlider('maxVolume')), 0) as Widget;

      expect(w.kind).toBe('input');
      expect(w.type).toBe('slider');
      expect(w.path).toBe('maxVolume');
      expect(w.label).toBe('Max Volume');
    });

    it('passes its props, and types its validator as a number', () => {
      const w = getStaticChild(
        processDx(
          _guiSlider('volume', {
            minimum: 0,
            maximum: 10,
            step: 2,
            marks: [0, { value: 10, label: 'Loud' }],
            format: { style: 'percent' },
            valuePlacement: 'bubble',
            validator: { required: true, minimum: 2 },
          }),
        ),
        0,
      ) as Widget;

      expect(w.props).toMatchObject({
        minimum: 0,
        maximum: 10,
        step: 2,
        marks: [0, { value: 10, label: 'Loud' }],
        format: { style: 'percent' },
        valuePlacement: 'bubble',
      });
      expect(w.validator).toEqual({ type: 'number', required: true, minimum: 2 });
    });

    it('applies a GSL override', () => {
      const w = getStaticChild(
        processDx(_guiSlider('volume'), [_gslSliders({ override: { marks: true } })]),
        0,
      ) as Widget;

      expect(w.props?.['marks']).toBe(true);
    });
  });

  describe('RangeSlider', () => {
    it('expands _guiRangeSlider into a rangeSlider input', () => {
      const w = getStaticChild(processDx(_guiRangeSlider('price')), 0) as Widget;

      expect(w.kind).toBe('input');
      expect(w.type).toBe('rangeSlider');
      expect(w.path).toBe('price');
    });

    it('passes its thumb names, and types its validator as a range', () => {
      const w = getStaticChild(
        processDx(
          _guiRangeSlider('price', {
            startLabel: 'From',
            endLabel: { key: 'to', default: 'To' },
            validator: { required: true },
          }),
        ),
        0,
      ) as Widget;

      expect(w.props).toMatchObject({ startLabel: 'From', endLabel: { key: 'to', default: 'To' } });
      expect(w.validator).toEqual({ type: 'range', required: true });
    });

    it('applies a GSL override', () => {
      const w = getStaticChild(
        processDx(_guiRangeSlider('price'), [_gslRangeSliders({ override: { step: 10 } })]),
        0,
      ) as Widget;

      expect(w.props?.['step']).toBe(10);
    });
  });
});
