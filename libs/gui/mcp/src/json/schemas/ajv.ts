import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { guiCoreRegistrations } from '@golemui/gui-schemas';
import { ALL_SCHEMAS, FORM_SCHEMA } from './index';

export type AjvInstance = Ajv2020;

let cachedAjv: AjvInstance | null = null;
let cachedFormValidator: ReturnType<AjvInstance['compile']> | null = null;

function buildAjv(): AjvInstance {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    verbose: true,
  });
  addFormats(ajv);
  for (const schema of ALL_SCHEMAS) {
    if (typeof schema.$id === 'string' && !ajv.getSchema(schema.$id)) {
      ajv.addSchema(schema);
    }
  }
  // Component refs like `../core/common.schema.json` resolve against the
  // component $id to the gui/core/ retrieval URIs, registered here as
  // $id-stripped clones of the vendored core schemas.
  for (const { key, schema } of guiCoreRegistrations()) {
    if (!ajv.getSchema(key)) {
      ajv.addSchema(schema, key);
    }
  }
  return ajv;
}

export function getAjv(): AjvInstance {
  if (!cachedAjv) {
    cachedAjv = buildAjv();
  }
  return cachedAjv;
}

export function getFormValidator() {
  if (!cachedFormValidator) {
    cachedFormValidator = getAjv().compile(FORM_SCHEMA);
  }
  return cachedFormValidator;
}

export function getWidgetValidator(widgetSchemaId: string) {
  return getAjv().getSchema(widgetSchemaId);
}
