import { describe, expect, it } from 'vitest';
import {
  actionWidgets,
  displayWidgets,
  inputWidgets,
  layoutWidgets,
} from '@golemui/gui-shared/internals';
import { guiWidgetManifest } from './widget-manifest';

describe('gui widget manifest', () => {
  it('mirrors the widget arrays in gui-shared widgets.ts, in order', () => {
    const typesOfKind = (kind: string) =>
      guiWidgetManifest.filter((entry) => entry.kind === kind).map((entry) => entry.type);

    expect(typesOfKind('input')).toEqual([...inputWidgets]);
    expect(typesOfKind('layout')).toEqual([...layoutWidgets]);
    expect(typesOfKind('display')).toEqual([...displayWidgets]);
    expect(typesOfKind('action')).toEqual([...actionWidgets]);
  });

  it('groups the kinds in widgets.ts order (input, layout, display, action)', () => {
    const kindSequence = guiWidgetManifest.map((entry) => entry.kind);
    const sortedByGroup = [...kindSequence].sort(
      (a, b) =>
        ['input', 'layout', 'display', 'action'].indexOf(a) -
        ['input', 'layout', 'display', 'action'].indexOf(b),
    );
    expect(kindSequence).toEqual(sortedByGroup);
  });

  it('derives every schema file name from the type, lowercased with no separators', () => {
    for (const entry of guiWidgetManifest) {
      if (entry.schemaFile !== undefined) {
        expect(entry.schemaFile).toBe(`${entry.type.toLowerCase()}.schema.json`);
      }
    }
  });

  it('lists renderer as the only schema-less type', () => {
    const schemalessTypes = guiWidgetManifest
      .filter((entry) => entry.schemaFile === undefined)
      .map((entry) => entry.type);
    expect(schemalessTypes).toEqual(['renderer']);
  });
});
