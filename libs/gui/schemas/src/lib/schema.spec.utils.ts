import { type ErrorObject } from 'ajv/dist/2020';
import type Ajv2020 from 'ajv/dist/2020';
import commonSchema from './core/common.schema.json';
import formSchema from './form.schema.json';
import layoutWidgetSchema from './layout-widget.schema.json';
import validatorsSchema from './core/validators.schema.json';
import widgetsSchema from './widgets.schema.json';
import { guiCoreRegistrations } from './core-registrations';

export type GetSchema = NonNullable<ReturnType<Ajv2020['getSchema']>>;

export function specValidationErrorsLogger(validate: any, data: any) {
  if (validate.errors) {
    console.error('--- GolemUI Validation Failed ---');
    console.error('Data under test:', JSON.stringify(data, null, 2));
    validate.errors.forEach((err: ErrorObject) => {
      console.error(`- Path: ${err.instancePath}`);
      console.error(`  Message: ${err.message}`);
      console.error(`  Params:`, err.params);
      if (err.keyword === 'additionalProperties') {
        console.error(`  Unknown property: ${err.params['additionalProperty']}`);
      }
    });
    console.error('---------------------------------');
  }
}

// `ajv.getSchema` compiles on lookup and fails while ref targets are still missing,
// so check the plain `ajv.schemas` registry. Also makes repeated registration safe.
function addSchemaOnce(ajv: Ajv2020, schema: any, key?: string): void {
  const id = key ?? (schema?.$id as string | undefined);
  if (id && !ajv.schemas[id]) {
    ajv.addSchema(schema, key);
  }
}

export function registerGolemSchemas(ajv: Ajv2020) {
  // Register the $id-stripped clones first so component refs resolve to the
  // gui/core/ retrieval URIs (see core-registrations.ts).
  for (const { key, schema } of guiCoreRegistrations()) {
    addSchemaOnce(ajv, schema, key);
  }
  // The vendored core copies register under their canonical core/ $ids.
  addSchemaOnce(ajv, commonSchema);
  addSchemaOnce(ajv, validatorsSchema);
  addSchemaOnce(ajv, layoutWidgetSchema);
  addSchemaOnce(ajv, widgetsSchema);

  // @ts-expect-error The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', 'node20', or 'nodenext'.ts(1343)
  // Register every component schema in this folder. The glob must not descend
  // into core/, which is already registered above under two URI sets.
  const componentSchemas: Record<string, any> = import.meta.glob('./components/*.schema.json', {
    // { eager: true, import: 'default' } resolves the JSON objects directly
    eager: true,
    import: 'default',
  });

  for (const path in componentSchemas) {
    addSchemaOnce(ajv, componentSchemas[path]);
  }

  addSchemaOnce(ajv, formSchema);
}
