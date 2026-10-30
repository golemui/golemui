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
// counterpart of the gui wiring: it checks that every shared part of the
// pipeline (registry, adapter, umbrella kinds, exact item type matching,
// facade, bridge) works for an implementation other than gui.
// ===================================================

export interface DemoFieldDecorator extends DxCommonFields {
  path?: string;
  label?: string;
}

export interface DemoFieldEntry {
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

export interface DemoStackDecorator extends DxCommonFields {
  direction?: string;
}

export interface DemoStackEntry {
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

export interface DemoNoteDecorator extends DxCommonFields {
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

export const demoText = (key: string, def: DemoFieldDecorator = {}): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_FIELD',
  items: [{ key, def }],
  tags: [],
});

export const demoStack = (
  children: ValidShortcut[],
  def: DemoStackDecorator = {},
): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_STACK',
  items: [{ def, children }],
  tags: [],
});

export const demoNote = (render: DxDisplayRenderFn): ValidShortcut => ({
  type: 'ITEMS',
  itemType: 'DEMO_NOTE',
  items: [{ render }],
  tags: [],
});

export function buildDemoImplementation() {
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

export function rootLayoutOf(result: {
  form: { form: unknown };
}): LayoutWidget & { children: any[] } {
  return result.form.form as LayoutWidget & { children: any[] };
}
