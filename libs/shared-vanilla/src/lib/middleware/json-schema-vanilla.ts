// JSON Schema 2020-12 --> GolemUI dynamic form description

import { FormField, SchemaToFieldMap } from '@formforge/core';
import { isOption } from '../components';
import { Vanilla } from '../field.factory';
import { Option } from '../field.props';

function enumToOption(opt: unknown): Option {
  if (isOption(opt)) {
    return opt;
  }
  return { label: opt as string, value: opt as string };
}

export const vanillaSchemaToFieldMap: SchemaToFieldMap = {
  string: (_schema, path: string) => Vanilla.textinput({ path }),
  enum: (_schema, path: string) =>
    Vanilla.select({ path }, { options: _schema.enum?.map(enumToOption) ?? [] }),
  boolean: (_schema, path: string) => Vanilla.checkbox({ path }),
  number: (_schema, path: string) => Vanilla.textinput({ path }),
  integer: (_schema, path: string) => Vanilla.textinput({ path }),
  object: (_schema, children: FormField[]) => Vanilla.stack({ children }),
  // one or the other must be valid .
  // - remove data when tabs change.
  // - don't generate all tabs initially.
  oneOf: (_schema, children: FormField[]) =>
    Vanilla.tabs({ children } /* TODO: , props: {logic: 'XOR'} as TabsProps*/),
  // one or more must be valid.
  // - don't remove data when tabs change.
  // - generate all tabs initially, there might be a defaultValue to populate initial values.
  anyOf: (_schema, children: FormField[]) =>
    Vanilla.tabs({ children } /* TODO: , props: {logic: 'OR'} as TabsProps*/),
  fallback: (_schema) =>
    Vanilla.alert(
      {},
      {
        text: `Unsupported Json Schema field ${JSON.stringify(_schema)}`,
        level: 'error',
      },
    ),
};
