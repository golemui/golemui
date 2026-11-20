import { describe, expect, it } from 'vitest';

import { kitchenSink } from './kitchen-sink';
import kitchenSinkJson from './kitchen-sink.form.json';

interface TabEntry {
  label: string;
  uid: string;
}

interface TabsWidget {
  type: 'tabs';
  props: { tabs: TabEntry[] };
  children: Array<Record<string, unknown>>;
}

function findTabsWidget(form: unknown): TabsWidget {
  const widgets = (form as { form: Array<{ type: string }> }).form;
  const tabsWidget = widgets.find((widget) => widget.type === 'tabs');
  if (tabsWidget === undefined) {
    throw new Error('The kitchen sink form has no tabs widget');
  }
  return tabsWidget as TabsWidget;
}

// Importing `./kitchen-sink` runs `resolveChunkRefsSync`, which throws on a $ref that has no
// entry in the chunk map of that file. So a tab chunk that the JSON references without a map
// entry fails this file.
describe('Kitchen sink chunk refs', () => {
  it('replaces every $ref in the JSON form with its chunk', () => {
    const rawTabs = findTabsWidget(kitchenSinkJson);
    const refCount = rawTabs.children.filter((child) => '$ref' in child).length;
    expect(refCount).toBeGreaterThan(0);

    const resolvedTabs = findTabsWidget(kitchenSink.form);
    expect(resolvedTabs.children.length).toBe(refCount);

    const serialized = JSON.stringify(resolvedTabs);
    expect(serialized).not.toContain('"$ref"');
    // The resolver removes the editor-only $schema key from each chunk.
    expect(serialized).not.toContain('"$schema"');
  });
});

// The tabs widget finds the panel of a tab by the uid of the tab entry. A chunk without a tab
// entry is never shown, and a tab entry without a chunk shows an empty panel.
describe('Kitchen sink tabs', () => {
  it('has one tab entry for each panel, with the same uid', () => {
    const resolvedTabs = findTabsWidget(kitchenSink.form);
    const tabUids = resolvedTabs.props.tabs.map((tab) => tab.uid).sort();
    const panelUids = resolvedTabs.children.map((panel) => panel['uid'] as string).sort();

    expect(panelUids).toEqual(tabUids);
  });

  it('has no repeated tab uid', () => {
    const resolvedTabs = findTabsWidget(kitchenSink.form);
    const tabUids = resolvedTabs.props.tabs.map((tab) => tab.uid);

    expect(new Set(tabUids).size).toBe(tabUids.length);
  });
});
