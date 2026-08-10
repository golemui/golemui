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
  generatorPath: 'libs/gui/schemas/tools/generate-schemas.ts',
  formTitle: 'Golem Form DSL',
  statesDescription: 'Named boolean conditions keyed by state name.',
  manifest: [
    { type: 'textinput', schemaFile: 'textinput.schema.json', kind: 'input' },
    { type: 'flex', schemaFile: 'flex.schema.json', kind: 'layout' },
    { type: 'tabs', schemaFile: 'tabs.schema.json', kind: 'layout' },
    { type: 'renderer', kind: 'display' },
    { type: 'button', schemaFile: 'button.schema.json', kind: 'action' },
  ],
  libRootSchemaFiles: ['ranges.schema.json', 'validators.schema.json'],
  includeSchemalessTypesInKnownWidgetTypes: true,
  includeCustomWidgetFallback: true,
};

// A deliberately different shape from the gui config: hyphenated file names and
// widget types, no layout widgets, no custom fallback, other lib root files.
const hyphenatedConfig: ImplementationSchemaConfig = {
  implementation: 'kendo',
  idBase: 'https://example.com/schemas/kendo/',
  generatorPath: 'libs/kendo/schemas/tools/generate-schemas.ts',
  formTitle: 'Kendo Form DSL',
  statesDescription: 'Kendo states description.',
  manifest: [
    { type: 'date-range', schemaFile: 'date-range.schema.json', kind: 'input' },
    { type: 'multi-select', schemaFile: 'multi-select.schema.json', kind: 'input' },
  ],
  libRootSchemaFiles: ['shared-defs.schema.json'],
  includeSchemalessTypesInKnownWidgetTypes: false,
  includeCustomWidgetFallback: false,
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
  it('emits imports, exported names, and the type-keyed map', () => {
    const source = buildSchemasPackageIndex(testConfig);
    expect(source).toContain(
      `import textinputSchemaJson from './lib/components/textinput.schema.json';`,
    );
    expect(source).toContain(`import customSchemaJson from './lib/components/custom.schema.json';`);
    expect(source).toContain(`import commonSchemaJson from './lib/core/common.schema.json';`);
    expect(source).toContain(`import rangesSchemaJson from './lib/ranges.schema.json';`);
    expect(source).toContain(`import validatorsSchemaJson from './lib/validators.schema.json';`);
    expect(source).toContain(`import widgetsSchemaJson from './lib/widgets.schema.json';`);
    expect(source).toContain('textinput: textinputSchema,');
    expect(source).not.toContain('renderer:');
    expect(source.startsWith('// GENERATED')).toBe(true);
  });

  // The published declaration file must resolve without resolveJsonModule, which
  // holds only while every schema export is an annotated constant.
  it('re-exports every schema as an annotated constant, never straight from the JSON module', () => {
    const source = buildSchemasPackageIndex(testConfig);
    expect(source).toContain(
      `export const commonSchema: Record<string, unknown> = commonSchemaJson;`,
    );
    expect(source).toContain(
      `export const textinputSchema: Record<string, unknown> = textinputSchemaJson;`,
    );
    expect(source).not.toContain('export { default as');
  });

  it('marks the file with the generator path from the config', () => {
    const source = buildSchemasPackageIndex({
      ...testConfig,
      generatorPath: 'libs/kendo/schemas/tools/generate-schemas.ts',
    });
    expect(source).toContain('GENERATED by libs/kendo/schemas/tools/generate-schemas.ts');
  });

  it('camel-cases hyphenated file names and quotes non-identifier map keys', () => {
    const source = buildSchemasPackageIndex(hyphenatedConfig);
    expect(source).toContain(
      `import dateRangeSchemaJson from './lib/components/date-range.schema.json';`,
    );
    expect(source).toContain(
      `export const multiSelectSchema: Record<string, unknown> = multiSelectSchemaJson;`,
    );
    expect(source).toContain(`'date-range': dateRangeSchema,`);
    expect(source).toContain(`'multi-select': multiSelectSchema,`);
  });

  it('throws when a file name cannot form a TypeScript identifier', () => {
    const config: ImplementationSchemaConfig = {
      ...hyphenatedConfig,
      manifest: [{ type: 'threeD', schemaFile: '3d.schema.json', kind: 'input' }],
    };
    expect(() => buildSchemasPackageIndex(config)).toThrowError(/3d\.schema\.json/);
  });

  it('throws when two sources derive the same export name', () => {
    const config: ImplementationSchemaConfig = {
      ...hyphenatedConfig,
      libRootSchemaFiles: ['common.schema.json'],
    };
    expect(() => buildSchemasPackageIndex(config)).toThrowError(
      /Duplicate export name "commonSchema".*core\/common\.schema\.json.*common\.schema\.json/,
    );
  });

  it('omits the customSchema export when the custom fallback is off', () => {
    const source = buildSchemasPackageIndex(hyphenatedConfig);
    expect(source).not.toContain('customSchema');
  });
});

describe('builders with a non-gui config shape', () => {
  it('parameterizes the form envelope title and states description', () => {
    const schema = buildFormEnvelope(hyphenatedConfig) as any;
    expect(schema.title).toBe('Kendo Form DSL');
    expect(schema.properties.states.description).toBe('Kendo states description.');
  });

  it('omits the custom fallback from the formWidget union but keeps chunkRef', () => {
    const schema = buildWidgetsSchema(hyphenatedConfig) as any;
    expect(schema.$defs.formWidget.oneOf).toEqual([
      { $ref: './components/date-range.schema.json' },
      { $ref: './components/multi-select.schema.json' },
      { $ref: './core/common.schema.json#/$defs/chunkRef' },
    ]);
  });

  it('throws instead of emitting an empty layout-widget oneOf', () => {
    expect(() => buildLayoutWidgetSchema(hyphenatedConfig)).toThrowError(/no layout entries/);
  });
});
