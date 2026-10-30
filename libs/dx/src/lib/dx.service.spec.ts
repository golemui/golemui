import { describe, expect, it, vi } from 'vitest';
import type { EventHandlerCallback, FormEvent } from '@golemui/core';
import { DxService, createDxService, type DxAdapter } from './dx.service';
import type { ItemWalker } from './core/itemWalker.service';
import selectorNormalizer from './core/selectorNormalizer.service';
import type { EventRegistry } from './core/eventWiring.service';
import { buildDemoImplementation, demoNote, demoStack, demoText } from './demo-widget-set.fixture';

// A walker that returns fixed widgets and a fixed event registry, so the result building of the
// service is checked without the shortcut pipeline.
function makeServiceWithEvents(eventRegistry: EventRegistry) {
  const walker = {
    walkAndMap: () => ({
      widgets: [{ uid: '#root', kind: 'layout', type: 'flex' }],
      eventRegistry,
    }),
  } as unknown as ItemWalker;
  const adapter: DxAdapter = {
    bareItemToWidget: (renderFn) => demoNote(renderFn),
    rootEntry: (children) => demoStack(children, { uid: '#root' }),
  };
  return new DxService(selectorNormalizer, walker, adapter);
}

function makeEvent(overrides: Partial<FormEvent> = {}): FormEvent {
  return { name: 'save', data: { a: 1 }, callback: vi.fn(), ...overrides };
}

describe('DxService form-level config', () => {
  it('wraps the definitions in a #root layout by default', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade([demoText('a'), demoText('b')]);

    const root = result.form.form as any;
    expect(root.uid).toBe('#root');
    expect(root.children.map((child: any) => child.path)).toStrictEqual(['a', 'b']);
  });

  it('keeps one definition as the root and skips the adapter root when the stack is suppressed', () => {
    const demo = buildDemoImplementation();
    const rootEntry = vi.fn();
    const service = createDxService({
      registry: demo.registry,
      adapter: { bareItemToWidget: vi.fn(), rootEntry } as unknown as DxAdapter,
    });

    const result = service.processDxFacade([demoText('only')], [], {
      suppressAutomaticStack: true,
    });

    expect((result.form.form as any).path).toBe('only');
    expect((result.form.form as any).uid).toBe('only');
    expect(rootEntry).not.toHaveBeenCalled();
  });

  it('converts dollar signs in state names to colons', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade([demoText('a')], [], {
      states: { register$adult: 'x', plain: 'y', a$b$c: 'z' },
    });

    expect(result.form.states).toStrictEqual({
      'register:adult': 'x',
      plain: 'y',
      'a:b:c': 'z',
    });
  });

  it('adds no states key when the states object is empty', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade([demoText('a')], [], { states: {} });

    expect('states' in result.form).toBe(false);
  });

  it('returns the functions and item renderers of the form config by reference', () => {
    const demo = buildDemoImplementation();
    const functions = { double: (n: number) => n * 2 };
    const itemRenderers = { row: { name: 'row' } };

    const result = demo.formDefs.processDxFacade([demoText('a')], [], {
      functions,
      itemRenderers,
    });

    expect(result.functions).toBe(functions);
    expect(result.itemRenderers).toBe(itemRenderers);
  });

  it('returns the dependencies, widget loaders and validateOn of the form config', () => {
    const demo = buildDemoImplementation();
    const dependencies = { icons: {} };
    const widgetLoaders = { demoText: () => Promise.resolve(null) };

    const result = demo.formDefs.processDxFacade([demoText('a')], [], {
      dependencies,
      widgetLoaders,
      validateOn: 'blur',
    });

    expect(result.dependencies).toBe(dependencies);
    expect(result.widgetLoaders).toBe(widgetLoaders);
    expect(result.validateOn).toBe('blur');
  });

  it('leaves out the result keys that the form config does not set', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade([demoText('a')]);

    expect(Object.keys(result)).toStrictEqual(['form']);
  });

  it('accepts a single definition that is not in an array', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade(demoText('single'));

    expect((result.form.form as any).children.map((child: any) => child.path)).toStrictEqual([
      'single',
    ]);
  });

  it('does not change the definitions array it receives', () => {
    const demo = buildDemoImplementation();
    const bare = () => 'bare';
    const first = demoText('a');
    const second = demoText('b');
    const defs = [bare, first, second];

    demo.formDefs.processDxFacade(defs);

    expect(defs).toHaveLength(3);
    expect(defs[0]).toBe(bare);
    expect(defs[1]).toBe(first);
    expect(defs[2]).toBe(second);
  });

  it('passes an expression string in a prop through unchanged', () => {
    const demo = buildDemoImplementation();

    const result = demo.formDefs.processDxFacade([demoText('a', { label: '{{ $form.x }}' })]);

    expect((result.form.form as any).children[0].label).toBe('{{ $form.x }}');
  });
});

describe('DxService events', () => {
  it('has no events function when no handler is registered', () => {
    const service = makeServiceWithEvents(new Map());

    const result = service.processDxFacade([demoText('a')]);

    expect(result.events).toBeUndefined();
  });

  it('calls the registered handler and ignores an unknown event name', () => {
    const handler = vi.fn();
    const service = makeServiceWithEvents(new Map([['save', handler]]));
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ name: 'unknown', callback }));
    expect(handler).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();

    events?.(makeEvent({ name: 'save', callback }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('gives the handler a new event with the same name, data and row', () => {
    const handler = vi.fn();
    const service = makeServiceWithEvents(new Map([['save', handler]]));
    const { events } = service.processDxFacade([demoText('a')]);
    const row = { index: 1, indexes: [1], path: 'items.1' };
    const original = makeEvent({ row, detail: { x: 1 } });
    const originalCallback = original.callback;

    events?.(original);

    const received = handler.mock.calls[0][0];
    expect(received).not.toBe(original);
    expect(received.name).toBe('save');
    expect(received.data).toBe(original.data);
    expect(received.detail).toBe(original.detail);
    expect(received.row).toBe(row);
    expect(received.callback).toBe(received.update);
    expect(received.callback).not.toBe(originalCallback);
    expect(original.callback).toBe(originalCallback);
  });

  it('turns an update with a path into one override action per prop', () => {
    const service = makeServiceWithEvents(
      new Map([
        ['save', (event: FormEvent) => (event as any).update({ path: 'b', label: 'L', hint: 'H' })],
      ]),
    );
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ callback }));

    expect(callback.mock.calls.map((call) => call[0])).toStrictEqual([
      { type: 'OVERRIDE_WIDGET_PROP', payload: { path: 'b', prop: 'label', value: 'L' } },
      { type: 'OVERRIDE_WIDGET_PROP', payload: { path: 'b', prop: 'hint', value: 'H' } },
    ]);
  });

  it('passes a value with a type key to the callback as it is', () => {
    const raw = { path: 'b', type: 'x', label: 'y' };
    const service = makeServiceWithEvents(
      new Map([['save', (event: FormEvent) => (event as any).update(raw)]]),
    );
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ callback }));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBe(raw);
  });

  it('makes no callback call for an update with a path and no props', () => {
    const service = makeServiceWithEvents(
      new Map([['save', (event: FormEvent) => (event as any).update({ path: 'b' })]]),
    );
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ callback }));

    expect(callback).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['a string', 'x'],
    ['an object without a path', { label: 'y' }],
  ])('passes %s to the callback as it is', (_label, value) => {
    const service = makeServiceWithEvents(
      new Map([['save', (event: FormEvent) => (event as any).update(value)]]),
    );
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ callback }));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBe(value);
  });

  it('accepts a raw action from the callback of the wrapped event', () => {
    const action = { type: 'INJECT_VALIDATION_ISSUES' } as unknown as EventHandlerCallback;
    const service = makeServiceWithEvents(
      new Map([['save', (event: FormEvent) => event.callback(action)]]),
    );
    const { events } = service.processDxFacade([demoText('a')]);
    const callback = vi.fn();

    events?.(makeEvent({ callback }));

    expect(callback).toHaveBeenCalledWith(action);
  });
});
