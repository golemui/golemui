import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/table.schema.json';

const columns = [
  { key: 'id', label: 'Order' },
  { key: 'total', label: 'Total', type: 'number' as const, align: 'end' as const },
];

describe('Table schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  const expectError = (widget: unknown, error: Record<string, unknown>) => {
    expect(validate(widget)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([expect.objectContaining(error)]));
  };

  describe('Valid configurations', () => {
    it('validates a minimal table, and one with no rows', () => {
      for (const rows of [[{ id: 'A-1042', total: 1280.5 }], []]) {
        const formDef = golemForm().create({
          form: [
            { kind: 'display', type: 'table', props: { caption: 'Open orders', columns, rows } },
          ],
        });
        expectValid(formDef.form.children[0]);
      }
    });

    it('validates every prop, cells of each kind, translation keys and a state override', () => {
      const formDef = golemForm().create({
        states: { closed: '$form.showClosed === true' },
        form: [
          {
            kind: 'display',
            type: 'table',
            props: {
              caption: { key: 'orders.caption', default: 'Open orders' },
              columns: [
                { key: 'id', label: { key: 'orders.id', default: 'Order' } },
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'total', label: 'Total', type: 'number', align: 'end' },
                { key: 'paid', label: 'Paid', type: 'text', align: 'center' },
              ],
              rows: [
                { id: 'A-1042', date: '2026-11-20', total: 1280.5, paid: true, note: 'ignored' },
                { id: 'A-1043', date: null, total: 310, paid: false },
              ],
              emptyMessage: { key: 'orders.empty', default: 'No open orders' },
              'rows.closed': [],
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    it('rejects a table without a caption', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.caption" is missing.
          { kind: 'display', type: 'table', props: { columns, rows: [] } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'caption' },
      });
    });

    it('rejects a table without columns, and a column without a label', () => {
      const formDef = golemForm().create({
        form: [
          { kind: 'display', type: 'table', props: { caption: 'Orders', columns: [], rows: [] } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'minItems',
        instancePath: '/props/columns',
      });

      const unlabelled = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'table',
            // @ts-expect-error Expected, a column needs a label.
            props: { caption: 'Orders', columns: [{ key: 'id' }], rows: [] },
          },
        ],
      });
      expectError(unlabelled.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'label' },
      });
    });

    it('rejects an unknown column type, and a cell that is an object', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'table',
            props: {
              caption: 'Orders',
              // @ts-expect-error Expected, there is no currency type.
              columns: [{ key: 'total', label: 'Total', type: 'currency' }],
              // @ts-expect-error Expected, a cell is a string, a number, a boolean or null.
              rows: [{ total: { amount: 12 } }],
            },
          },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'enum',
        instancePath: '/props/columns/0/type',
      });
      expectError(formDef.form.children[0], {
        keyword: 'type',
        instancePath: '/props/rows/0/total',
      });
    });
  });
});
