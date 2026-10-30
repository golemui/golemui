import { describe, expect, it, vi } from 'vitest';
import { isDxDefinitions } from './resolveFormInput';
import { buildDemoImplementation, demoText } from './demo-widget-set.fixture';

describe('isDxDefinitions', () => {
  it('accepts a function', () => {
    expect(isDxDefinitions(() => 'render')).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(isDxDefinitions([])).toBe(true);
  });

  it('accepts an array of builder items and functions', () => {
    expect(isDxDefinitions([demoText('a'), () => 'render'])).toBe(true);
  });

  it('accepts one builder item that is not in an array', () => {
    expect(isDxDefinitions(demoText('a'))).toBe(true);
  });

  it('rejects an array that has one JSON widget', () => {
    const jsonWidget = { kind: 'input', type: 'textinput', path: 'a' };

    expect(isDxDefinitions([demoText('a'), jsonWidget])).toBe(false);
  });

  it('rejects an items object whose item type is not a string', () => {
    expect(isDxDefinitions({ type: 'ITEMS', itemType: 1 })).toBe(false);
  });

  it('rejects null, undefined and a string', () => {
    expect(isDxDefinitions(null)).toBe(false);
    expect(isDxDefinitions(undefined)).toBe(false);
    expect(isDxDefinitions('{"kind":"layout"}')).toBe(false);
  });
});

describe('the bound resolveFormInput', () => {
  it('resolves an empty array to an empty #root layout', () => {
    const demo = buildDemoImplementation();

    const resolved = demo.resolveFormInput([]);

    const root = (resolved.formDef as any).form;
    expect(root.uid).toBe('#root');
    expect(root.children).toStrictEqual([]);
  });

  it('returns an undefined form definition without throwing', () => {
    const demo = buildDemoImplementation();

    expect(demo.resolveFormInput(undefined)).toStrictEqual({ formDef: undefined });
  });

  it('passes a JSON widget object through untouched', () => {
    const demo = buildDemoImplementation();
    const json = { kind: 'layout', type: 'grid', children: [] };

    const resolved = demo.resolveFormInput(json);

    expect(resolved.formDef).toBe(json);
    expect(Object.keys(resolved)).toStrictEqual(['formDef']);
  });

  it('passes an array of JSON widgets through untouched', () => {
    const demo = buildDemoImplementation();
    const jsonWidgets = [{ kind: 'input', type: 'textinput', path: 'a' }];

    const resolved = demo.resolveFormInput(jsonWidgets as any);

    expect(resolved.formDef).toBe(jsonWidgets);
  });

  it('returns the same object for missing selectors and a missing config', () => {
    const demo = buildDemoImplementation();
    const defs = [demoText('a')];

    const first = demo.resolveFormInput(defs);

    expect(demo.resolveFormInput(defs, undefined, undefined)).toBe(first);
    expect(demo.resolveFormInput(defs, undefined)).toBe(first);
    expect(demo.resolveFormInput(defs, null as any, null as any)).toBe(first);
  });

  it('returns a different object when only the config reference changes', () => {
    const demo = buildDemoImplementation();
    const defs = [demoText('a')];

    const first = demo.resolveFormInput(defs, undefined, { validateOn: 'blur' });
    const second = demo.resolveFormInput(defs, undefined, { validateOn: 'blur' });

    expect(second).not.toBe(first);
    expect(second).toStrictEqual(first);
  });

  it('copies the form config values and the form definition from the pipeline result', () => {
    const demo = buildDemoImplementation();
    const dependencies = { icons: {} };
    const functions = { double: (n: number) => n * 2 };
    const widgetLoaders = { demoText: () => Promise.resolve(null) };
    const itemRenderers = { row: { name: 'row' } };

    const resolved = demo.resolveFormInput([demoText('a')], undefined, {
      dependencies,
      functions,
      widgetLoaders,
      validateOn: 'submit',
      itemRenderers,
    });

    expect(resolved.dependencies).toBe(dependencies);
    expect(resolved.functions).toBe(functions);
    expect(resolved.widgetLoaders).toBe(widgetLoaders);
    expect(resolved.validateOn).toBe('submit');
    expect(resolved.itemRenderers).toBe(itemRenderers);
    expect((resolved.formDef as any).form.uid).toBe('#root');
  });

  it('copies the event function of a form that has handlers and leaves it out otherwise', () => {
    const demo = buildDemoImplementation();
    const onChange = vi.fn();

    const withHandler = demo.resolveFormInput([demoText('a', { onChange } as any)]);
    const withoutHandler = demo.resolveFormInput([demoText('a')]);

    expect(typeof withHandler.formEvent).toBe('function');
    expect(withoutHandler.formEvent).toBeUndefined();
  });

  it('gives a formEvent function that calls the handler by the event name in the widget', () => {
    const demo = buildDemoImplementation();
    const onChange = vi.fn();
    const resolved = demo.resolveFormInput([demoText('a', { onChange } as any)]);
    const widget = (resolved.formDef as any).form.children[0];
    const eventName = widget.on.change;

    // The pipeline calls the handler once while it builds the form, to find out what it returns.
    const callsAfterBuild = onChange.mock.calls.length;

    resolved.formEvent?.({ name: 'other', data: {}, callback: vi.fn() });
    expect(onChange).toHaveBeenCalledTimes(callsAfterBuild);

    resolved.formEvent?.({ name: eventName, data: {}, callback: vi.fn() });
    expect(onChange).toHaveBeenCalledTimes(callsAfterBuild + 1);
  });
});
