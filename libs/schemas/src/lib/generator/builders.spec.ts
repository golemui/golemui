import { describe, expect, it } from 'vitest';
import type { ImplementationSchemaConfig } from '../manifest.types';
import {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from './builders';

const testConfig: ImplementationSchemaConfig = {
  implementation: 'gui',
  idBase: 'https://golemui.com/schemas/gui/',
  manifest: [
    { type: 'textinput', schemaFile: 'textinput.schema.json', kind: 'input' },
    { type: 'flex', schemaFile: 'flex.schema.json', kind: 'layout' },
    { type: 'tabs', schemaFile: 'tabs.schema.json', kind: 'layout' },
    { type: 'renderer', kind: 'display' },
    { type: 'button', schemaFile: 'button.schema.json', kind: 'action' },
  ],
  libRootSchemaFiles: ['ranges.schema.json', 'validators.schema.json'],
  includeSchemalessTypesInKnownWidgetTypes: true,
};

describe('buildWidgetsSchema', () => {
  it('derives the formWidget oneOf from the manifest with custom and chunkRef appended', () => {
    const schema = buildWidgetsSchema(testConfig) as any;
    expect(schema.$id).toBe('https://golemui.com/schemas/gui/widgets.schema.json');
    expect(schema.$defs.formWidget.oneOf).toEqual([
      { $ref: './components/textinput.schema.json' },
      { $ref: './components/flex.schema.json' },
      { $ref: './components/tabs.schema.json' },
      { $ref: './components/button.schema.json' },
      { $ref: './components/custom.schema.json' },
      { $ref: './core/common.schema.json#/$defs/chunkRef' },
    ]);
  });

  it('includes schema-less types in knownWidgetTypes when the flag is on', () => {
    const schema = buildWidgetsSchema(testConfig) as any;
    expect(schema.$defs.knownWidgetTypes.enum).toEqual([
      'textinput',
      'flex',
      'tabs',
      'renderer',
      'button',
    ]);
  });

  it('excludes schema-less types from knownWidgetTypes when the flag is off', () => {
    const schema = buildWidgetsSchema({
      ...testConfig,
      includeSchemalessTypesInKnownWidgetTypes: false,
    }) as any;
    expect(schema.$defs.knownWidgetTypes.enum).toEqual(['textinput', 'flex', 'tabs', 'button']);
  });

  it('marks the file as generated', () => {
    const schema = buildWidgetsSchema(testConfig) as any;
    expect(schema.$comment).toContain('GENERATED');
    expect(schema.$comment).toContain('npm run generate:schemas');
  });
});

describe('buildFormEnvelope', () => {
  it('points the form items at the widgets schema and states at the vendored core', () => {
    const schema = buildFormEnvelope(testConfig) as any;
    expect(schema.$id).toBe('https://golemui.com/schemas/gui/form.schema.json');
    expect(schema.properties.form.items.$ref).toBe('./widgets.schema.json#/$defs/formWidget');
    expect(schema.properties.states.additionalProperties.$ref).toBe(
      './core/common.schema.json#/$defs/reactiveExpression',
    );
    expect(schema.required).toEqual(['form']);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.$defs).toBeUndefined();
  });
});

describe('buildLayoutWidgetSchema', () => {
  it('unions exactly the layout-kind manifest entries', () => {
    const schema = buildLayoutWidgetSchema(testConfig) as any;
    expect(schema.$id).toBe('https://golemui.com/schemas/gui/layout-widget.schema.json');
    expect(schema.oneOf).toEqual([
      { $ref: './components/flex.schema.json' },
      { $ref: './components/tabs.schema.json' },
    ]);
  });

  it('excludes schema-less layout entries from the union', () => {
    const schema = buildLayoutWidgetSchema({
      ...testConfig,
      manifest: [...testConfig.manifest, { type: 'canvas', kind: 'layout' }],
    }) as any;
    expect(schema.oneOf).toEqual([
      { $ref: './components/flex.schema.json' },
      { $ref: './components/tabs.schema.json' },
    ]);
  });
});

describe('buildSchemasPackageIndex', () => {
  it('emits imports, legacy export names, and the type-keyed map', () => {
    const source = buildSchemasPackageIndex(testConfig);
    expect(source).toContain(
      `import textinputSchema from './lib/components/textinput.schema.json';`,
    );
    expect(source).toContain(`import customSchema from './lib/components/custom.schema.json';`);
    expect(source).toContain(
      `export { default as commonSchema } from './lib/core/common.schema.json';`,
    );
    expect(source).toContain(`export { default as rangesSchema } from './lib/ranges.schema.json';`);
    expect(source).toContain(
      `export { default as validatorsSchema } from './lib/validators.schema.json';`,
    );
    expect(source).toContain(
      `export { default as widgetsSchema } from './lib/widgets.schema.json';`,
    );
    expect(source).toContain(`export { guiCoreRegistrations } from './lib/core-registrations';`);
    expect(source).toContain('textinputSchema, flexSchema, tabsSchema, buttonSchema, customSchema');
    expect(source).toContain('textinput: textinputSchema,');
    expect(source).not.toContain('renderer:');
    expect(source.startsWith('// GENERATED')).toBe(true);
  });

  // The re-export name derives from the implementation, assert it with a non-gui config.
  it('names the core registrations re-export after the implementation', () => {
    const source = buildSchemasPackageIndex({ ...testConfig, implementation: 'kendo' });
    expect(source).toContain(`export { kendoCoreRegistrations } from './lib/core-registrations';`);
    expect(source).toContain('GENERATED by libs/kendo/schemas/tools/generate-schemas.ts');
  });
});
