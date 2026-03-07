import Ajv2020, { ErrorObject } from 'ajv/dist/2020';
import * as commonSchema from './common.schema.json';
import * as formSchema from './form.schema.json';

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
  ajv.addSchema(commonSchema);

  // @ts-expect-error The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', 'node20', or 'nodenext'.ts(1343)
  // Automatically assemble all component schemas in this folder
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

  if (!ajv.getSchema(formSchema.$id)) {
    ajv.addSchema(formSchema);
  }
}
