import { describe, expect, it } from 'vitest';
import { guiWidgetManifest } from '../widget-manifest';

describe('widget manifest to components directory parity', () => {
  // @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
  const componentSchemas: Record<string, any> = import.meta.glob('./*.schema.json', {
    eager: true,
    import: 'default',
  });

  it('claims every component schema file except the custom fallback', () => {
    const directoryFiles = Object.keys(componentSchemas)
      .map((path) => path.replace('./', ''))
      .filter((file) => file !== 'custom.schema.json');
    const manifestFiles = guiWidgetManifest
      .map((entry) => entry.schemaFile)
      .filter((file): file is string => file !== undefined);

    expect([...manifestFiles].sort()).toEqual([...directoryFiles].sort());
  });

  it('matches each schema file to the manifest type and kind consts', () => {
    for (const entry of guiWidgetManifest) {
      if (entry.schemaFile === undefined) {
        continue;
      }
      const schema = componentSchemas[`./${entry.schemaFile}`];
      expect(schema, entry.schemaFile).toBeDefined();
      expect(schema.properties.type.const, entry.schemaFile).toBe(entry.type);
      expect(schema.properties.kind.const, entry.schemaFile).toBe(entry.kind);
    }
  });
});
