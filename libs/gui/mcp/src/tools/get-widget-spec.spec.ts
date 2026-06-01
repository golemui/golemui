import { describe, expect, it } from 'vitest';
import { getWidgetSpec, listWidgetTypes } from './get-widget-spec';
import { validateFormDefinition } from './validate-form-definition';

describe('get_widget_spec', () => {
  it('returns schema + example for textinput', () => {
    const r = getWidgetSpec({ widgetType: 'textinput' });
    expect(r.widgetType).toBe('textinput');
    expect(r.kind).toBe('input');
    expect(r.schema.$id).toContain('textinput.schema.json');
    expect(r.example).toMatchObject({ kind: 'input', type: 'textinput' });
  });

  it('throws on unknown widget with the list of known types in the message', () => {
    expect(() => getWidgetSpec({ widgetType: 'nope' })).toThrow(/textinput/);
  });

  it.each(listWidgetTypes())('example for %s validates against the form schema', (widgetType) => {
    const r = getWidgetSpec({ widgetType });
    const result = validateFormDefinition({ formDefinition: { form: [r.example] } });
    if (!result.valid) {
      // eslint-disable-next-line no-console
      console.error(widgetType, JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });
});
