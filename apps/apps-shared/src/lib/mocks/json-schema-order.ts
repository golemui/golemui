import { type Form } from '@golemui/core';
import { type Example } from './types';
import jsonSchemaOrderForm from './json-schema-order.form.json';

/**
 * An order form generated from `../json-schema/order.schema.json` with the JSON Schema
 * converter and the gui preset: a discriminated payment `oneOf`, `if/then/else` on the country,
 * `dependentRequired` and a repeater of `$ref` items. `json-schema-order.spec.ts` fails when
 * this file and a new conversion differ.
 */
export const jsonSchemaOrder: Example = {
  data: { lines: [{}] },
  form: jsonSchemaOrderForm as unknown as Form<string>,
  resources: {},
};
