import { describe, expect, it } from 'vitest';
import { guiSchemaConfig, guiWidgetManifest } from '../widget-manifest';

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

  // The component $ids are handwritten while the generated aggregates derive their refs from
  // guiSchemaConfig.idBase. A mismatch surfaces as opaque Ajv "can't resolve reference"
  // failures, so this test asserts the convention directly.
  it('gives every component schema the $id derived from the config idBase', () => {
    for (const entry of guiWidgetManifest) {
      if (entry.schemaFile === undefined) {
        continue;
      }
      const schema = componentSchemas[`./${entry.schemaFile}`];
      expect(schema.$id, entry.schemaFile).toBe(
        `${guiSchemaConfig.idBase}components/${entry.schemaFile}`,
      );
    }
    const customSchema = componentSchemas['./custom.schema.json'];
    expect(customSchema.$id).toBe(`${guiSchemaConfig.idBase}components/custom.schema.json`);
  });
});
