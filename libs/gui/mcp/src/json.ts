// Runtime-portable surface: the JSON form-definition tools plus the shared concept
// reference.
//
// This entry deliberately excludes the `gui.*` DX type-check path (`./dx/*`), which
// depends on the Node `typescript` compiler and `node:module`/`node:fs`/`node:url` and
// is therefore Node-only. Importing from `@golemui/gui-mcp/json` (rather than the
// package root) lets non-Node consumers — e.g. a Cloudflare Worker — bundle the JSON
// tools without dragging in the DX machinery. The package root (`./lib`) re-exports
// everything for Node consumers.

// --- JSON form-definition path ---
export {
  validateFormDefinition,
  JSON_VALIDATE_FORM_DEFINITION_TOOL,
} from './json/validate-form-definition';
export type { ValidateInput, ValidateResult } from './json/validate-form-definition';
export {
  generateFromJsonSchema,
  JSON_GENERATE_FROM_SCHEMA_TOOL,
} from './json/generate-from-json-schema';
export type {
  GenerateFromJsonSchemaInput,
  GenerateFromJsonSchemaResult,
} from './json/generate-from-json-schema';
export { generateFromOpenapi, JSON_GENERATE_FROM_OPENAPI_TOOL } from './json/generate-from-openapi';
export { getWidgetSpec, JSON_GET_WIDGET_SPEC_TOOL } from './json/get-widget-spec';

// --- shared (cross-cutting reference) ---
export { getConcept, GET_CONCEPT_TOOL } from './shared/get-concept';
