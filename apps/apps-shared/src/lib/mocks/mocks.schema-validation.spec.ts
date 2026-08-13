import { posix as path } from 'node:path';
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_SCHEMAS_BY_TYPE,
  commonSchema,
  customSchema,
  formSchema,
  layoutWidgetSchema,
  rangesSchema,
  validatorsSchema,
  widgetsSchema,
} from '@golemui/gui-schemas';

// Every mock names the schema it is written against in `$schema`, which is what gives editors
// completion and validation, but nothing checked that the mock actually satisfies it. A schema
// that rejected a supported field went unnoticed for exactly that reason. Each mock is validated
// here against the schema its own `$schema` names, with no allow-list: a mock this spec cannot
// map to a registered schema fails instead of being skipped.

type CompiledSchema = NonNullable<ReturnType<Ajv2020['getSchema']>>;

const GUI_SCHEMAS: Record<string, unknown>[] = [
  commonSchema,
  validatorsSchema,
  rangesSchema,
  widgetsSchema,
  layoutWidgetSchema,
  ...Object.values(COMPONENT_SCHEMAS_BY_TYPE),
  customSchema,
  formSchema,
];

// A oneOf over 38 widget branches reports every branch it did not match, so one missing property
// produces about 1900 errors with allErrors on and about 40 with it off. Fail fast and filter.
const ajv = new Ajv2020({ allErrors: false, strict: false });
for (const schema of GUI_SCHEMAS) {
  const id = schema['$id'] as string | undefined;
  // `ajv.getSchema` compiles on lookup and fails while ref targets are still unregistered.
  if (id !== undefined && !ajv.schemas[id]) {
    ajv.addSchema(schema);
  }
}

const REGISTERED_IDS = GUI_SCHEMAS.map((schema) => schema['$id'] as string).sort();

// Every gui schema's $id is the id base plus its path under libs/gui/schemas/src/lib, which is
// what lets a mock's relative `$schema` path be mapped back to a registered id exactly.
const GUI_ID_BASE = (formSchema['$id'] as string).replace(/form\.schema\.json$/, '');

// This spec sits five directories below the repository root. Mock `$schema` paths are relative
// to each mock, so they are rebased onto this directory before being matched against this
// prefix, which also proves the number of `../` segments a mock declares is right.
const GUI_LIB_DIR = '../../../../../libs/gui/schemas/src/lib/';

// libs/schemas/site/form.schema.json serves this URL on the website as a $ref onto the gui
// envelope. Ajv only knows the gui $id, so the published URL is translated rather than
// registered a second time.
const ABSOLUTE_SCHEMA_ALIASES: Record<string, string> = {
  'https://golemui.com/schemas/form.schema.json': `${GUI_ID_BASE}form.schema.json`,
};

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const mocks: Record<string, unknown> = import.meta.glob('./**/*.json', {
  eager: true,
  import: 'default',
});

type Resolution = { id: string } | { error: string };

function resolveSchemaId(mockKey: string, schemaValue: unknown): Resolution {
  if (typeof schemaValue !== 'string' || schemaValue.length === 0) {
    return {
      error: `${mockKey} declares no "$schema". Every mock must name the schema it is written against.`,
    };
  }

  if (/^https?:\/\//.test(schemaValue)) {
    const id = ABSOLUTE_SCHEMA_ALIASES[schemaValue] ?? schemaValue;
    return ajv.getSchema(id)
      ? { id }
      : {
          error:
            `${mockKey} declares "$schema": "${schemaValue}", which is neither a registered schema id ` +
            `nor a known alias.\nRegistered ids:\n  ${REGISTERED_IDS.join('\n  ')}`,
        };
  }

  const fromSpec = path.join(path.dirname(mockKey), schemaValue);
  if (!fromSpec.startsWith(GUI_LIB_DIR)) {
    return {
      error:
        `${mockKey} declares "$schema": "${schemaValue}", which resolves to "${fromSpec}" relative to ` +
        `this spec, outside "${GUI_LIB_DIR}". Either the number of "../" segments is wrong or the mock ` +
        `points at a schema this spec cannot map.`,
    };
  }

  const id = `${GUI_ID_BASE}${fromSpec.slice(GUI_LIB_DIR.length)}`;
  return ajv.getSchema(id)
    ? { id }
    : {
        error:
          `${mockKey} declares "$schema": "${schemaValue}", which maps to the id "${id}", but no such ` +
          `schema is registered.\nRegistered ids:\n  ${REGISTERED_IDS.join('\n  ')}`,
      };
}

function valueAtPointer(root: unknown, pointer: string): unknown {
  return pointer
    .split('/')
    .slice(1)
    .reduce<unknown>((node, token) => {
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
      return (node as Record<string, unknown> | undefined)?.[key];
    }, root);
}

// Walks up from the failing location to the nearest widget, so an error reads
// "/children/1 (timeInput)" instead of a bare pointer into a 600-line mock.
function widgetTypeAt(root: unknown, pointer: string): string | undefined {
  let current = pointer;
  for (;;) {
    const node = valueAtPointer(root, current) as { type?: unknown } | undefined;
    if (typeof node?.type === 'string') {
      return node.type;
    }
    if (current === '') {
      return undefined;
    }
    current = current.slice(0, Math.max(0, current.lastIndexOf('/')));
  }
}

// A widget union reports one failed `type`/`kind` const per branch it did not match, which buries
// the one error that names the real problem.
function isBranchDiscriminator(error: ErrorObject): boolean {
  return (
    error.keyword === 'const' &&
    (error.instancePath.endsWith('/type') || error.instancePath.endsWith('/kind'))
  );
}

const MAX_REPORTED_ERRORS = 12;

function failureReport(
  mockKey: string,
  schemaId: string,
  errors: readonly ErrorObject[],
  mock: unknown,
): string {
  const lines = new Set<string>();
  for (const error of errors) {
    if (isBranchDiscriminator(error)) {
      continue;
    }
    const widgetType = widgetTypeAt(mock, error.instancePath);
    lines.add(
      `  ${error.instancePath || '<root>'}${widgetType ? ` (${widgetType})` : ''}: ` +
        `${error.keyword} ${JSON.stringify(error.params)}`,
    );
  }
  const reported = [...lines].slice(0, MAX_REPORTED_ERRORS);
  const hidden = lines.size - reported.length;
  return (
    `${mockKey} does not validate against ${schemaId}\n${reported.join('\n')}` +
    (hidden > 0 ? `\n  ...and ${hidden} more` : '') +
    '\n(errors from widget union branches that did not match on type or kind are left out)'
  );
}

describe('mocks validate against the schema they declare', () => {
  const entries = Object.entries(mocks);

  // A glob that matched nothing would make every assertion below pass without testing anything.
  it('finds both the form mocks and the tab chunk fixtures', () => {
    expect(entries.length, 'no mock JSON files were found').toBeGreaterThan(0);
    expect(entries.some(([key]) => key.endsWith('.form.json'))).toBe(true);
    expect(entries.some(([key]) => key.startsWith('./tabs/'))).toBe(true);
  });

  for (const [mockKey, mock] of entries) {
    it(`${mockKey} validates`, () => {
      const resolved = resolveSchemaId(mockKey, (mock as Record<string, unknown>)['$schema']);
      if ('error' in resolved) {
        expect.fail(resolved.error);
      }

      const validate = ajv.getSchema(resolved.id) as CompiledSchema;
      const isValid = validate(mock) as boolean;
      expect(
        isValid,
        isValid ? undefined : failureReport(mockKey, resolved.id, validate.errors ?? [], mock),
      ).toBe(true);
    });
  }
});
