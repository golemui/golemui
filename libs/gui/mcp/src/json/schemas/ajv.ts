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
  // `ajv.getSchema` compiles on lookup and crashes while refs are unregistered, so dedupe
  // with a plain set. The gui/core/ clones go first so component refs resolve to them.
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
