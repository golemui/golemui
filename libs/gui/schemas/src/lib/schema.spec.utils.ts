import { type ErrorObject } from 'ajv/dist/2020';
import type Ajv2020 from 'ajv/dist/2020';
import commonSchema from './core/common.schema.json';
import formSchema, { $id } from './form.schema.json';
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

export function registerGolemSchemas(ajv: Ajv2020) {
  // The vendored core copies register under their canonical core/ $ids.
  ajv.addSchema(commonSchema);
  ajv.addSchema(validatorsSchema);
  // Component refs like `../core/common.schema.json` resolve against the
  // component $id to the gui/core/ retrieval URIs, registered here as
  // $id-stripped clones (see core-registrations.ts).
  for (const { key, schema } of guiCoreRegistrations()) {
    if (!ajv.getSchema(key)) {
      ajv.addSchema(schema, key);
    }
  }
  ajv.addSchema(layoutWidgetSchema);
  ajv.addSchema(widgetsSchema);

  // @ts-expect-error The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', 'node20', or 'nodenext'.ts(1343)
  // Automatically assemble all component schemas in this folder. The glob must
  // stay scoped to components/ and never descend into core/, which is already
  // registered above under two URI sets.
  const componentSchemas: Record<string, any> = import.meta.glob('./components/*.schema.json', {
    // { eager: true, import: 'default' } resolves the JSON objects directly
    eager: true,
    import: 'default',
  });

  for (const path in componentSchemas) {
    const schema = componentSchemas[path];
    if (schema && schema.$id && !ajv.getSchema(schema.$id)) {
      ajv.addSchema(schema);
    }
  }

  if (!ajv.getSchema($id)) {
    ajv.addSchema(formSchema);
  }
}
