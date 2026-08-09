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
  // Dedupe with a plain set of seen keys. `ajv.getSchema` is not a safe guard here because it
  // compiles an already-registered schema, and compiling before every ref target is registered
  // crashes with MissingRefError. For the same reason the gui/core/ clones are registered
  // first: component refs like `../core/common.schema.json` resolve against the component $id
  // to the gui/core/ retrieval URIs, which the clones provide (the vendored files themselves
  // carry the canonical core $id).
  const registeredKeys = new Set<string>();
  for (const { key, schema } of guiCoreRegistrations()) {
    if (!registeredKeys.has(key)) {
      registeredKeys.add(key);
      ajv.addSchema(schema, key);
    }
  }
  for (const schema of ALL_SCHEMAS) {
    if (typeof schema.$id === 'string' && !registeredKeys.has(schema.$id)) {
      registeredKeys.add(schema.$id);
      ajv.addSchema(schema);
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
