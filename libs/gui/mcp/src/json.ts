// Runtime-portable surface: the JSON form-definition tools plus the shared concept
// reference.
//
// Nothing here imports Node built-ins, so a non-Node consumer, for example a Cloudflare
// Worker, can bundle this entry. The package root (`./lib`) re-exports it.

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
