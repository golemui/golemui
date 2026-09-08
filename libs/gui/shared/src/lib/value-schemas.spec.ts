import type { InputWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { guiValueSchemas } from './value-schemas';
import { inputWidgets } from './widgets';

const input = (type: string, props?: Record<string, unknown>): InputWidget<any, string> =>
  ({ uid: `${type}-uid`, kind: 'input', type, path: 'field', props }) as InputWidget<any, string>;

describe('guiValueSchemas.valueSchema', () => {
  it('describes every gui input widget type', () => {
    for (const type of inputWidgets) {
      const described = guiValueSchemas.valueSchema(input(type));
      expect(described, type).toBeDefined();
      expect(Object.keys(described!.schema).length, type).toBeGreaterThan(0);
    }
  });

  it('resolves an unknown widget type to undefined', () => {
    expect(guiValueSchemas.valueSchema(input('customdate'))).toBeUndefined();
  });

  it('marks passwords as sensitive and uploads as not writable', () => {
    expect(guiValueSchemas.valueSchema(input('password'))).toEqual({
      schema: { type: 'string' },
      sensitive: true,
    });
    expect(guiValueSchemas.valueSchema(input('fileUpload'))?.writable).toBe(false);
    expect(guiValueSchemas.valueSchema(input('multiFileUpload'))?.writable).toBe(false);
    expect(guiValueSchemas.valueSchema(input('textinput'))?.writable).toBeUndefined();
  });

  it('types the scalar widgets', () => {
    expect(guiValueSchemas.valueSchema(input('checkbox'))?.schema).toEqual({ type: 'boolean' });
    expect(guiValueSchemas.valueSchema(input('toggle'))?.schema).toEqual({ type: 'boolean' });
    expect(guiValueSchemas.valueSchema(input('number'))?.schema).toEqual({ type: 'number' });
    expect(guiValueSchemas.valueSchema(input('currency'))?.schema).toEqual({ type: 'number' });
    expect(guiValueSchemas.valueSchema(input('markdown'))?.schema).toMatchObject({
      type: 'string',
    });
    expect(guiValueSchemas.valueSchema(input('dateInput'))?.schema).toMatchObject({
      type: 'string',
      format: 'date',
    });
    expect(guiValueSchemas.valueSchema(input('timePicker'))?.schema).toMatchObject({
      type: 'string',
      format: 'time',
    });
    expect(guiValueSchemas.valueSchema(input('dateTimeCalendar'))?.schema).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
  });

  it('types the collection widgets', () => {
    expect(guiValueSchemas.valueSchema(input('tags'))?.schema).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
    expect(guiValueSchemas.valueSchema(input('rangeCalendar'))?.schema).toMatchObject({
      type: 'array',
      items: { type: 'object', required: ['start'] },
    });
    expect(guiValueSchemas.valueSchema(input('rangeTimeInput'))?.schema).toMatchObject({
      type: 'array',
      items: { type: 'object', required: ['start', 'end'] },
    });
    expect(guiValueSchemas.valueSchema(input('repeater', { limit: 3 }))?.schema).toEqual({
      type: 'array',
      items: { type: 'object' },
      maxItems: 3,
    });
    expect(guiValueSchemas.valueSchema(input('repeater'))?.schema).toEqual({
      type: 'array',
      items: { type: 'object' },
    });
  });

  it('reads select and radiogroup choices from options in every accepted shape', () => {
    expect(
      guiValueSchemas.valueSchema(input('select', { options: [{ label: 'Spain', value: 'es' }] }))
        ?.choices,
    ).toEqual([{ label: 'Spain', value: 'es' }]);
    expect(
      guiValueSchemas.valueSchema(input('radiogroup', { options: ['a', 'b'] }))?.choices,
    ).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ]);
    expect(
      guiValueSchemas.valueSchema(
        input('select', {
          options: [{ name: 'Spain', code: 'es' }],
          labelField: 'name',
          valueField: 'code',
        }),
      )?.choices,
    ).toEqual([{ label: 'Spain', value: 'es' }]);
  });

  it('reads dropdown and list choices from items, skipping disabled ones', () => {
    expect(
      guiValueSchemas.valueSchema(
        input('dropdown', {
          items: [
            { id: 1, name: 'One' },
            { id: 2, name: 'Two', disabled: true },
          ],
          labelField: 'name',
          valueField: 'id',
        }),
      )?.choices,
    ).toEqual([{ label: 'One', value: 1 }]);
    expect(guiValueSchemas.valueSchema(input('multiList', { items: ['x', 'y'] }))).toEqual({
      schema: { type: 'array', items: { type: ['string', 'number'] } },
      choices: [
        { label: 'x', value: 'x' },
        { label: 'y', value: 'y' },
      ],
    });
  });

  it('leaves the choices open while the items are not loaded yet', () => {
    expect(guiValueSchemas.valueSchema(input('dropdown'))).toEqual({
      schema: { type: ['string', 'number'] },
    });
  });

  it('carries the hint, or else the placeholder, as the untranslated description', () => {
    expect(
      guiValueSchemas.valueSchema(input('textinput', { hint: 'Your work email', placeholder: 'x' }))
        ?.description,
    ).toBe('Your work email');
    expect(
      guiValueSchemas.valueSchema(input('textinput', { placeholder: 'name@example.com' }))
        ?.description,
    ).toBe('name@example.com');
    expect(
      guiValueSchemas.valueSchema(
        input('textinput', { hint: { key: 'hints.email', default: 'E' } }),
      )?.description,
    ).toEqual({ key: 'hints.email', default: 'E' });
    expect(guiValueSchemas.valueSchema(input('textinput'))?.description).toBeUndefined();
  });

  it('delegates validator translation to gui-validators', () => {
    expect(
      guiValueSchemas.validatorSchema?.({ type: 'string', required: true, minLength: 2 }),
    ).toEqual({ schema: { type: 'string', minLength: 2 }, required: true });
  });
});
