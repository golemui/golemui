import { type DeclarativeRule, type WidgetPatch } from '@golemui/schemas/json-schema';
import {
  CUSTOMIZATION_INPUT_PROPERTIES,
  jsonSchemaToGui,
  type JsonSchemaLike,
  type MapResult,
} from './mapping/json-schema-to-gui';
import { validateFormDefinition } from './validate-form-definition';

export type GenerateFromJsonSchemaInput = {
  jsonSchema: JsonSchemaLike;
  submitAction?: boolean;
  submitLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  rules?: DeclarativeRule[];
  overrides?: Record<string, WidgetPatch>;
};

export type GenerateFromJsonSchemaResult = MapResult & {
  validation: ReturnType<typeof validateFormDefinition>;
};

export function generateFromJsonSchema(
  input: GenerateFromJsonSchemaInput,
): GenerateFromJsonSchemaResult {
  const { formDefinition, unmapped, diagnostics } = jsonSchemaToGui(input.jsonSchema, {
    submitAction: input.submitAction,
    submitLabel: input.submitLabel,
    layout: input.layout,
    rules: input.rules,
    overrides: input.overrides,
  });
  const validation = validateFormDefinition({ formDefinition });
  return { formDefinition, unmapped, diagnostics, validation };
}

export const JSON_GENERATE_FROM_SCHEMA_TOOL = {
  name: 'json_generate_from_schema',
  description:
    'Generate a GolemUI form definition from a JSON Schema describing the form data shape ' +
    '(typically an API request body or a Zod-derived schema). The result is validated against ' +
    'the GolemUI JSON Schemas before being returned, so it is guaranteed to be syntactically ' +
    'correct. `diagnostics` lists everything the form cannot express exactly, each with a ' +
    '`severity` (`error`: not rendered, `warning`: rendered approximately, `info`: a note), a ' +
    '`code`, the data `path` and the JSON `pointer` into the input. `unmapped` repeats the ' +
    'errors and warnings as `{ path, reason }`: surface them to the user. Pass `rules` or ' +
    '`overrides` to choose other widgets.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      jsonSchema: {
        type: 'object' as const,
        additionalProperties: true,
        description:
          'A standard JSON Schema (draft-07 to 2020-12). The top level must be an object schema. ' +
          'Supports primitive types with formats and constraints, enums, local `$ref`/`$defs`, ' +
          '`allOf`, nested objects, arrays (repeaters, multi-selects, tags, tuples), ' +
          'discriminated `oneOf`/`anyOf`, and `if`/`then`/`else`, `dependentRequired`, ' +
          '`dependentSchemas` compiled to conditions and form states.',
      },
      submitAction: {
        type: 'boolean' as const,
        description: 'Append a submit button. Defaults to true.',
      },
      submitLabel: {
        type: 'string' as const,
        description:
          'Label for the submit button when `submitAction` is true. Defaults to "Submit".',
      },
      layout: {
        type: 'string' as const,
        enum: ['vertical', 'horizontal', 'grid'],
        description: 'Top-level layout. Defaults to vertical (one field per row).',
      },
      ...CUSTOMIZATION_INPUT_PROPERTIES,
    },
    required: ['jsonSchema'],
  },
} as const;
