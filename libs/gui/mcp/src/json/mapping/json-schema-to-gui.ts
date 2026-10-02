/**
 * JSON Schema (the form-data shape) to GolemUI form definition, for the MCP tools. It runs the
 * `fromJsonSchema` converter of `@golemui/schemas/json-schema` with the gui preset, and keeps
 * the `unmapped` list the tools have always returned.
 */

import { guiPreset } from '@golemui/gui-schemas/json-schema';
import {
  type DeclarativeRule,
  type Diagnostic,
  type FormDefinitionJson,
  fromJsonSchema,
  type JsonSchema,
  type WidgetPatch,
} from '@golemui/schemas/json-schema';
import { FORM_SCHEMA_URL } from '../../shared/form-schema-url';

/** A JSON Schema object, under the name the tool types have always used. */
export type JsonSchemaLike = JsonSchema;

export type MapOptions = {
  submitAction?: boolean;
  submitLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Declarative rules, checked before the gui preset rules. */
  rules?: DeclarativeRule[];
  /** Widget fields by form data path or by `$defs/<Name>`. */
  overrides?: Record<string, WidgetPatch>;
  /** The document `$ref` values resolve against, e.g. an OpenAPI document. */
  refRoot?: JsonSchema;
};

export type Unmapped = {
  path: string;
  reason: string;
};

export type MapResult = {
  formDefinition: FormDefinitionJson;
  /** The warnings and errors of `diagnostics`: what is not rendered, or rendered approximately. */
  unmapped: Unmapped[];
  diagnostics: Diagnostic[];
};

/** The `rules` and `overrides` inputs of the generate tools, in MCP input schema form. */
export const CUSTOMIZATION_INPUT_PROPERTIES = {
  rules: {
    type: 'array' as const,
    description:
      'Optional rules that choose or change widgets, checked in order before the gui defaults. ' +
      'Each rule has a `match` object plus widget fields. `match` compares schema keywords by ' +
      'deep equality or with `{ "$in": [...] }`, `{ "$exists": true }` or `{ "$regex": "..." }`, ' +
      'and node fields with `$type`, `$path` (a glob: `*` is one segment, `**` any number), ' +
      '`$name`, `$defName`, `$required` and `$inRepeater`. The widget fields are `widget` (a ' +
      'GolemUI widget type), `label`, `props`, `validator`, `defaultValue`, `readonly`, `size`, ' +
      '`uid`, `skip` and `order`. A rule without `widget` only changes the default widget. ' +
      'Example: `{ "match": { "format": "email" }, "props": { "icon": "mail" } }`.',
    items: {
      type: 'object' as const,
      additionalProperties: true,
      properties: { match: { type: 'object' as const, additionalProperties: true } },
      required: ['match'],
    },
  },
  overrides: {
    type: 'object' as const,
    description:
      'Optional widget fields by form data path, e.g. `{ "address.street": { "widget": "textarea" } }`. ' +
      'Inside arrays the path uses the `items` token (`lines.items.quantity`), and `""` is the ' +
      'root. A key `$defs/<Name>` applies to every node that comes from that definition. The ' +
      'fields are the same as in `rules`. A path override wins over a definition override, and ' +
      'both win over `rules` and over the `x-golemui` keyword in the schema.',
    additionalProperties: { type: 'object' as const, additionalProperties: true },
  },
};

export function jsonSchemaToGui(schema: JsonSchemaLike, options: MapOptions = {}): MapResult {
  const { formDefinition, diagnostics } = fromJsonSchema(schema, {
    preset: guiPreset({
      submitAction: options.submitAction,
      submitLabel: options.submitLabel,
      rootLayout: options.layout,
      schemaUrl: FORM_SCHEMA_URL,
    }),
    rules: options.rules,
    overrides: options.overrides,
    refRoot: options.refRoot,
  });
  const unmapped = diagnostics
    .filter((diagnostic) => diagnostic.severity !== 'info')
    .map((diagnostic) => ({ path: diagnostic.path, reason: diagnostic.message }));
  return { formDefinition, unmapped, diagnostics };
}
