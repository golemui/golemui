// JSON Schema 2020-12 --> GolemUI dynamic form description

import * as Core from '@golemui/core';
import { isOption } from '../utils';
import { GolemWidgets } from '../widget.factory';
import { Option } from '../widget.props';

function enumToOption(opt: unknown): Option {
  if (isOption(opt)) {
    return opt;
  }
  return { label: opt as string, value: opt as string };
}

export const golemSchemaToFieldMap = <V>(
  validators: Core.JsonSchemaValidators<V>,
): Core.SchemaToWidgetMap => ({
  string: (_schema, path: string) => GolemWidgets.textinput({ config: { path } }),
  enum: (_schema, path: string) =>
    GolemWidgets.select({
      config: { path },
      props: { options: _schema.enum?.map(enumToOption) ?? [] },
      validator: validators.stringValidator(),
    }),
  boolean: (_schema, path: string) =>
    GolemWidgets.checkbox({ config: { path }, validator: validators.booleanValidator() }),
  number: (_schema, path: string) =>
    GolemWidgets.numberinput({ config: { path }, validator: validators.numberValidator() }),
  integer: (_schema, path: string) =>
    GolemWidgets.numberinput({ config: { path }, validator: validators.integerValidator() }),
  object: (_schema, children: Core.FormWidget[]) => GolemWidgets.flex({ children }),
  // one or the other must be valid .
  // - remove data when tabs change.
  // - don't generate all tabs initially.
  oneOf: (_schema, children: Core.FormWidget[]) =>
    GolemWidgets.tabs({ children } /* TODO: , props: {logic: 'XOR'} as TabsProps*/),
  // one or more must be valid.
  // - don't remove data when tabs change.
  // - generate all tabs initially, there might be a defaultValue to populate initial values.
  anyOf: (_schema, children: Core.FormWidget[]) =>
    GolemWidgets.tabs({ children } /* TODO: , props: {logic: 'OR'} as TabsProps*/),
  fallback: (_schema) =>
    GolemWidgets.alert(
      {},
      {
        text: `❌ Unsupported Json Schema field ${JSON.stringify(_schema)}`,
        level: 'error',
      },
    ),
});
