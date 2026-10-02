import { guiPreset } from '@golemui/gui-schemas/json-schema';
import { fromJsonSchema, type JsonSchema } from '@golemui/schemas/json-schema';
import { describe, expect, it } from 'vitest';
import committedForm from '../mocks/json-schema-order.form.json';
import orderSchema from './order.schema.json';

// The playground mock `jsonSchemaOrder` is committed output of the CLI. When the converter or
// the gui preset changes, regenerate it from the repository root:
//   npx nx run-many -t build -p schemas gui-schemas
//   node dist/libs/schemas/cli.js convert apps/apps-shared/src/lib/json-schema/order.schema.json \
//     --preset ./dist/libs/gui/schemas/json-schema.js --force \
//     --out apps/apps-shared/src/lib/mocks/json-schema-order.form.json
// then format it with prettier. The comparison is on parsed JSON, so formatting never fails it.
describe('the jsonSchemaOrder mock', () => {
  it('equals a new conversion of order.schema.json', () => {
    const { formDefinition, diagnostics } = fromJsonSchema(orderSchema as JsonSchema, {
      preset: guiPreset(),
    });

    expect(diagnostics).toEqual([]);
    expect(committedForm).toEqual(formDefinition);
  });
});
