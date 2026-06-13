import {
  jsonSchemaToGui,
  type JsonSchemaLike,
  type MapOptions,
} from './mapping/json-schema-to-gui';
import { validateFormDefinition } from './validate-form-definition';

export type GenerateFromJsonSchemaInput = {
  jsonSchema: JsonSchemaLike;
  submitAction?: boolean;
  submitLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
};

export type GenerateFromJsonSchemaResult = {
  formDefinition: { $schema: string; form: unknown[] };
  unmapped: { path: string; reason: string }[];
  validation: ReturnType<typeof validateFormDefinition>;
};

export function generateFromJsonSchema(
  input: GenerateFromJsonSchemaInput,
): GenerateFromJsonSchemaResult {
  const opts: MapOptions = {
    submitAction: input.submitAction,
    submitLabel: input.submitLabel,
    layout: input.layout,
  };
  const { formDefinition, unmapped } = jsonSchemaToGui(input.jsonSchema, opts);
  const validation = validateFormDefinition({ formDefinition });
  return { formDefinition, unmapped, validation };
}

export const GENERATE_FROM_JSON_SCHEMA_TOOL = {
  name: 'generate_from_json_schema',
  description:
    'Generate a GolemUI form definition from a JSON Schema describing the form data shape ' +
    '(typically an API request body or a Zod-derived schema). The result is validated against ' +
    'the GolemUI JSON Schemas before being returned, so it is guaranteed to be syntactically ' +
    'correct. Anything the mapper cannot handle is reported in `unmapped` rather than silently ' +
    'dropped — use that list to surface remaining work to the user.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      jsonSchema: {
        type: 'object' as const,
        additionalProperties: true,
        description:
          'A standard JSON Schema. The top level must be an `object` schema with a `properties` map. ' +
          'Supports primitive types (string/number/integer/boolean) with formats and constraints, ' +
          'enums, nested objects, and arrays of objects (rendered as repeaters).',
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
    },
    required: ['jsonSchema'],
  },
} as const;
