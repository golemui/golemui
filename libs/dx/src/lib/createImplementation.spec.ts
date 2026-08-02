import { describe, expect, it } from 'vitest';
import type { LayoutWidget, NonFunctionWidget } from '@golemui/core';
import {
  createImplementation,
  createItemTypeRegistry,
  createSelectors,
  createShortcutType,
  registerShortcutType,
  type DxAdapter,
  type DxCommonFields,
  type DxDisplayRenderFn,
  type ValidShortcut,
} from '../index';

// ===================================================
// A minimal second widget set ("demo") with its own vocabulary. This is the
// counterpart of the gui wiring: it pins that the pipeline seams
// (registry, adapter, umbrella kinds, facade, bridge) work for an
// implementation other than gui.
// ===================================================

interface DemoFieldDecorator extends DxCommonFields {
  path?: string;
  label?: string;
}

interface DemoFieldEntry {
  key: string;
  def?: DemoFieldDecorator;
}

const demoFieldType = createShortcutType<DemoFieldEntry, DemoFieldDecorator>({
  itemType: 'DEMO_FIELD',
  kind: 'input',
  entryShape: 'keyed',
  mapToWidget: (def) =>
    ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'demoText',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      props: {},
    }) as NonFunctionWidget,
});

interface DemoStackDecorator extends DxCommonFields {
  direction?: string;
}

interface DemoStackEntry {
  def?: DemoStackDecorator;
  children?: ValidShortcut[];
}

const demoStackType = createShortcutType<DemoStackEntry, DemoStackDecorator>({
  itemType: 'DEMO_STACK',
  kind: 'layout',
  entryShape: 'compound',
  mapToWidget: (def) =>
    ({
      uid: def.uid ?? '',
      kind: 'layout',
      type: 'flex',
      props: { direction: def.direction ?? 'column' },
      children: [],
    }) as NonFunctionWidget,
  buildCustomWidget: (mergeResult, context) => {
    if (mergeResult.kind !== 'static') {
      throw new Error('The demo stack does not support runtime definitions.');
    }
    const children = context.walkChildren(context.children ?? []);
    const mapped = context.mapStaticDef(mergeResult.def, 'DEMO_STACK') as LayoutWidget;
    return { ...mapped, children };
  },
  getChildren: (entry) => entry.children,
});

interface DemoNoteDecorator extends DxCommonFields {
  render?: DxDisplayRenderFn;
}

const demoNoteType = createShortcutType<{ render: DxDisplayRenderFn }, DemoNoteDecorator>({
  itemType: 'DEMO_NOTE',
  kind: 'display',
  entryShape: 'bare',
  mapToWidget: (def) =>
    ({
      uid: def.uid ?? '',
      kind: 'display',
      type: 'note',
      props: { render: def.render },
    }) as NonFunctionWidget,
});

const demoText = (key: string, def: DemoFieldDecorator = {}): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_FIELD',
  items: [{ key, def }],
  tags: [],
});

const demoStack = (children: ValidShortcut[], def: DemoStackDecorator = {}): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_STACK',
  items: [{ def, children }],
  tags: [],
});

const demoNote = (render: DxDisplayRenderFn): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_NOTE',
  items: [{ render }],
  tags: [],
});

function buildDemoImplementation() {
  const registry = createItemTypeRegistry();
  registerShortcutType(registry, demoFieldType);
  registerShortcutType(registry, demoStackType);
  registerShortcutType(registry, demoNoteType);

  const selectors = createSelectors({
    fields: demoFieldType.gsl,
    fieldByUid: demoFieldType.gslByUid,
  });

  const adapter: DxAdapter = {
    bareItemToWidget: (renderFn) => demoNote(renderFn),
    rootEntry: (children) => demoStack(children, { uid: '#root', direction: 'column' }),
  };

  return createImplementation({
    name: 'demo',
    registry,
    facade: {
      inputs: { text: demoText },
      displays: { note: demoNote },
      layouts: { stack: demoStack },
    },
    selectors,
    adapter,
  });
}

function rootLayoutOf(result: { form: { form: unknown } }): LayoutWidget & { children: any[] } {
  return result.form.form as LayoutWidget & { children: any[] };
}

describe('createImplementation', () => {
  it('assembles the namespace from the facade groups plus the selector chain', () => {
    const demo = buildDemoImplementation();

    expect(demo.name).toBe('demo');
    expect(demo.namespace.inputs.text).toBe(demoText);
    expect(demo.namespace.displays.note).toBe(demoNote);
    expect(demo.namespace.layouts.stack).toBe(demoStack);
    expect(typeof demo.namespace.selectors.fields).toBe('function');
    expect(typeof demo.namespace.selectors.tag).toBe('function');
  });

  it('rejects a facade that already contains a selectors key', () => {
    expect(() =>
      createImplementation({
        name: 'demo',
        registry: createItemTypeRegistry(),
        facade: { selectors: {} } as unknown as Record<string, unknown>,
        selectors: {},
        adapter: {
          bareItemToWidget: () => demoNote(() => null),
          rootEntry: (children) => demoStack(children),
        },
      }),
    ).toThrowError(/must not contain a "selectors" key/);
  });

  it('processes a definition through the second widget set end to end', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade([demoText('email', { label: 'Email' })]);

    const root = rootLayoutOf(result);
    expect(root.kind).toBe('layout');
    expect(root.type).toBe('flex');
    expect(root.uid).toBe('#root');
    expect(root.children).toHaveLength(1);

    const field = root.children[0];
    expect(field.kind).toBe('input');
    expect(field.type).toBe('demoText');
    expect(field.path).toBe('email');
    expect(field.uid).toBe('email');
    expect(field.label).toBe('Email');
  });

  it('applies umbrella selectors to the second vocabulary through its registered kinds', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade(
      [demoText('email')],
      [demo.namespace.selectors.inputs({ override: { label: 'From umbrella' } })],
    );

    const field = rootLayoutOf(result).children[0];
    expect(field.label).toBe('From umbrella');
  });

  it('maps bare functions through the adapter', () => {
    const demo = buildDemoImplementation();
    const render = () => 'hello';
    const result = demo.formDefs.processDxFacade([render]);

    const note = rootLayoutOf(result).children[0];
    expect(note.kind).toBe('display');
    expect(note.type).toBe('note');
    expect(note.props.render).toBe(render);
  });

  describe('the bound resolveFormInput bridge', () => {
    it('passes JSON form definitions through untouched', () => {
      const demo = buildDemoImplementation();
      const json = '{"kind": "layout", "type": "flex"}';
      expect(demo.resolveFormInput(json).formDef).toBe(json);
    });

    it('memoizes by reference identity of the (defs, selectors, config) triple', () => {
      const demo = buildDemoImplementation();
      const defs = [demoText('email')];
      const selectors = [demo.namespace.selectors.fields({ override: { label: 'x' } })];
      const config = { suppressAutomaticStack: false };

      const plain = demo.resolveFormInput(defs);
      expect(demo.resolveFormInput(defs)).toBe(plain);

      const withSelectors = demo.resolveFormInput(defs, selectors);
      expect(withSelectors).not.toBe(plain);
      expect(demo.resolveFormInput(defs, selectors)).toBe(withSelectors);

      const withConfig = demo.resolveFormInput(defs, selectors, config);
      expect(withConfig).not.toBe(withSelectors);
      expect(demo.resolveFormInput(defs, selectors, config)).toBe(withConfig);

      // A structurally equal but fresh defs array is a different cache key.
      expect(demo.resolveFormInput([demoText('email')])).not.toBe(plain);
    });
  });
});
